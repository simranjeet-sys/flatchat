// intentionally buggy code for Diffgence testing
import express from "express";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Pool } from "pg";

const app = express();
const db = new Pool({ connectionString: process.env.DATABASE_URL });

let balance = 1000;
const users: any[] = [];

app.use(express.json());

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const expectedToken = process.env.API_TOKEN;
  const authorization = req.header("authorization");
  const suppliedToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const suppliedBuffer = Buffer.from(suppliedToken);
  const expectedBuffer = Buffer.from(expectedToken ?? "");
  if (!expectedToken || suppliedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
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
  try {
    const result = await db.query("SELECT id, email FROM users WHERE id = $1", [req.query.id]);
    res.json(result.rows);
  } catch {
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

// P1: Password stored in plain text — fixed with salted scrypt hashing
app.post("/register", (req, res) => {
  const password = req.body.password;
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  const salt = randomBytes(16).toString("hex");
  const passwordHash = scryptSync(password, salt, 64).toString("hex");
  users.push({
    email: req.body.email,
    passwordHash: `${salt}:${passwordHash}`,
  });
  res.json({ success: true });
});

// Password reset: issues a single-use, time-limited token. Only its hash is stored.
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const passwordResetTokens = new Map<string, { email: string; expiresAt: number }>();

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function findUserByEmail(email: string) {
  return users.find((u) => typeof u.email === "string" && u.email.trim().toLowerCase() === email);
}

function isMailConfigured() {
  return Boolean(process.env.MAIL_API_URL && process.env.MAIL_API_KEY && process.env.MAIL_FROM && process.env.APP_URL);
}

// Delivers the reset link through the configured transactional mail HTTP API.
async function sendResetEmail(to: string, token: string) {
  const link = `${process.env.APP_URL}/reset-password.html?token=${encodeURIComponent(token)}`;
  const response = await fetch(process.env.MAIL_API_URL as string, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.MAIL_API_KEY}` },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to,
      subject: "Reset your FlatChat password",
      text: `Use this link to reset your password. It expires in 30 minutes and can be used once:\n\n${link}`,
    }),
  });
  if (!response.ok) throw new Error(`Mail API responded with ${response.status}`);
}

app.post("/api/password-reset", async (req, res) => {
  const email = req.body?.email;
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ message: "Enter a valid email address." });
    return;
  }
  // Don't claim a link was sent when there is no way to deliver one.
  if (!isMailConfigured()) {
    res.status(503).json({ message: "Password reset is temporarily unavailable. Please try again later." });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (findUserByEmail(normalizedEmail)) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);
    passwordResetTokens.set(tokenHash, { email: normalizedEmail, expiresAt: Date.now() + RESET_TOKEN_TTL_MS });
    try {
      await sendResetEmail(normalizedEmail, token);
    } catch (error) {
      passwordResetTokens.delete(tokenHash);
      console.error("Failed to send password reset email", error);
      res.status(503).json({ message: "Could not send the reset link. Please try again later." });
      return;
    }
  }
  // Same response whether or not the account exists, so the endpoint can't be used to discover emails.
  res.status(202).json({ message: "If an account exists for that email, a reset link is on its way." });
});

// Redeems a reset token: single use, rejected once expired, and sets the new password hash.
app.post("/api/password-reset/confirm", (req, res) => {
  const { token, password } = req.body ?? {};
  if (typeof token !== "string" || !token) {
    res.status(400).json({ message: "Reset link is invalid or has expired." });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters." });
    return;
  }
  const tokenHash = hashResetToken(token);
  const entry = passwordResetTokens.get(tokenHash);
  passwordResetTokens.delete(tokenHash);
  const user = entry && entry.expiresAt > Date.now() ? findUserByEmail(entry.email) : undefined;
  if (!entry || !user) {
    res.status(400).json({ message: "Reset link is invalid or has expired." });
    return;
  }
  const salt = randomBytes(16).toString("hex");
  user.passwordHash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
  // Invalidate any other outstanding reset links for this account.
  for (const [hash, pending] of passwordResetTokens) {
    if (pending.email === entry.email) passwordResetTokens.delete(hash);
  }
  res.json({ message: "Your password has been reset. You can now log in." });
});

// P1: Payment accepted without verification — fixed with authentication and server-side payment state lookup
app.post("/payment/success", requireAuth, async (req, res) => {
  const orderId = req.body?.orderId;
  if (typeof orderId !== "string" || !orderId) {
    res.status(400).json({ error: "orderId is required" });
    return;
  }
  try {
    const result = await db.query(
      "SELECT payment_status FROM orders WHERE id = $1",
      [orderId],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (result.rows[0].payment_status !== "paid") {
      res.status(402).json({ paid: false, orderId });
      return;
    }
    res.json({ paid: true, orderId });
  } catch {
    res.status(500).json({ error: "Unable to verify payment" });
  }
});

// P2: Missing input validation
app.post("/discount", (req, res) => {
  const discount = req.body?.discount;
  if (typeof discount !== "number" || !Number.isFinite(discount) || discount < 0 || discount > 100) {
    res.status(400).json({ error: "Discount must be a number between 0 and 100" });
    return;
  }
  res.json({ finalPrice: 100 - discount });
});

// P2: Race condition while updating inventory
let stock = 1;
app.post("/buy", async (req, res) => {
  if (stock > 0) {
    stock--;
    await new Promise((resolve) => setTimeout(resolve, 100));
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Out of stock" });
  }
});

// P2: Sensitive error details exposed
app.get("/report", (req, res) => {
  try {
    throw new Error("Database query failed");
  } catch (error: any) {
    res.status(500).send("Internal server error");
  }
});

// P2: No pagination — fixed with bounded limit and offset
app.get("/all-orders", requireAuth, (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? "50"), 10) || 50, 1), 100);
  const offset = Math.max(Number.parseInt(String(req.query.offset ?? "0"), 10) || 0, 0);
  const orders = new Array(100000).fill(null).map((_, id) => ({ id: id + 1, status: "pending" }));
  res.json({ orders: orders.slice(offset, offset + limit), limit, offset });
});

// P3: Incorrect total calculation — fixed by summing integer cents
app.get("/total", (req, res) => {
  const prices = [10.99, 20.99, 30.99];
  const totalCents = prices.reduce((sum, price) => sum + Math.round(price * 100), 0);
  res.json({ total: totalCents / 100 });
});

app.listen(3000);
