// intentionally buggy code for Diffgence testing
import express from "express";
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Pool } from "pg";

type RequestWithRawBody = express.Request & { rawBody?: Buffer };

interface User {
  email: string;
  passwordHash: string;
}

const app = express();
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

let balance = 1000;
const users: User[] = [];

// Keep the raw body so webhook signatures can be verified against the exact bytes received
app.use(express.json({
  verify: (req, _res, buf) => {
    (req as RequestWithRawBody).rawBody = buf;
  },
}));

function safeEqual(supplied: string, expected: string) {
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const expectedToken = process.env.API_TOKEN;
  const authorization = req.header("authorization");
  const suppliedToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!expectedToken || !safeEqual(suppliedToken, expectedToken)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// P1: No authentication — fixed with bearer token authentication
app.get("/users", requireAuth, (req, res) => {
  res.json(users.map(({ email }) => ({ email })));
});

// P1: SQL injection and unauthenticated lookup fixed with a parameterized query and authentication
app.get("/user", requireAuth, async (req, res) => {
  const id = Number(req.query.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(400).json({ error: "User id must be a positive integer" });
    return;
  }
  try {
    const result = await db.query("SELECT id, email FROM users WHERE id = $1", [id]);
    res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch user", error);
    res.status(500).json({ error: "Unable to fetch user" });
  }
});

// P1: Anyone can withdraw money — fixed with authentication and amount validation
app.post("/withdraw", requireAuth, (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > balance) {
    res.status(400).json({ error: "Invalid withdrawal amount" });
    return;
  }
  balance -= amount;
  res.json({ balance });
});

// P1: Password stored in plain text — fixed with salted async scrypt hashing and input validation
app.post("/register", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "A valid email is required" });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (users.some((user) => user.email === normalizedEmail)) {
    res.status(409).json({ error: "Email is already registered" });
    return;
  }
  const salt = randomBytes(16).toString("hex");
  const passwordHash = (await scryptAsync(password, salt, 64)).toString("hex");
  users.push({
    email: normalizedEmail,
    passwordHash: `${salt}:${passwordHash}`,
  });
  res.status(201).json({ success: true });
});

// P1: Payment accepted without verification — fixed by verifying the provider's HMAC signature
app.post("/payment/success", (req: RequestWithRawBody, res) => {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  const signature = req.header("x-signature") ?? "";
  if (!secret || !req.rawBody) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }
  const expected = createHmac("sha256", secret).update(req.rawBody).digest("hex");
  if (!safeEqual(signature, expected)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }
  if (typeof req.body.orderId !== "string" || !req.body.orderId) {
    res.status(400).json({ error: "orderId is required" });
    return;
  }
  res.json({ paid: true, orderId: req.body.orderId });
});

// P2: Missing input validation — fixed by bounding the discount to 0–100
app.post("/discount", (req, res) => {
  const discount = Number(req.body.discount);
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    res.status(400).json({ error: "Discount must be a number between 0 and 100" });
    return;
  }
  res.json({ finalPrice: 100 - discount });
});

// P2: Race condition while updating inventory — fixed by reserving stock synchronously before any await
let stock = 1;
app.post("/buy", requireAuth, async (req, res) => {
  if (stock <= 0) {
    res.status(400).json({ error: "Out of stock" });
    return;
  }
  stock--;
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));
    res.json({ success: true });
  } catch (error) {
    stock++;
    console.error("Purchase failed", error);
    res.status(500).json({ error: "Purchase failed" });
  }
});

// P2: Sensitive error details exposed — fixed by logging server-side and returning a generic message
app.get("/report", (req, res) => {
  try {
    throw new Error("Database query failed");
  } catch (error) {
    console.error("Report generation failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// P2: No pagination — fixed with bounded limit and offset, generating only the requested page
const TOTAL_ORDERS = 100000;
app.get("/all-orders", requireAuth, (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? "50"), 10) || 50, 1), 100);
  const offset = Math.max(Number.parseInt(String(req.query.offset ?? "0"), 10) || 0, 0);
  const count = Math.max(Math.min(limit, TOTAL_ORDERS - offset), 0);
  const orders = Array.from({ length: count }, (_, i) => ({ id: offset + i + 1, status: "pending" }));
  res.json({ orders, limit, offset, total: TOTAL_ORDERS });
});

// P3: Incorrect total calculation — fixed by summing integer cents
app.get("/total", (req, res) => {
  const prices = [10.99, 20.99, 30.99];
  const totalCents = prices.reduce((sum, price) => sum + Math.round(price * 100), 0);
  res.json({ total: totalCents / 100 });
});

app.listen(Number(process.env.PORT) || 3000);
