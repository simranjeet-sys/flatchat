// intentionally buggy code for Diffgence testing
import express from "express";

const app = express();

let balance = 1000;
const users: any[] = [];

app.use(express.json());

// P1: No authentication — anyone can access user data
app.get("/users", (req, res) => {
  res.json(users);
});

// P1: SQL injection vulnerability
app.get("/user", async (req, res) => {
  const query = `SELECT * FROM users WHERE id = '${req.query.id}'`;
  const result = await db.query(query);
  res.json(result.rows);
});

// P1: Anyone can withdraw money
app.post("/withdraw", (req, res) => {
  const amount = Number(req.body.amount);
  balance -= amount;
  res.json({ balance });
});

// P1: Password stored in plain text
app.post("/register", (req, res) => {
  users.push({
    email: req.body.email,
    password: req.body.password,
  });
  res.json({ success: true });
});

// P1: Payment accepted without verification
app.post("/payment/success", (req, res) => {
  res.json({ paid: true, orderId: req.body.orderId });
});

// P2: Missing input validation
app.post("/discount", (req, res) => {
  const discount = Number(req.body.discount);
  res.json({ finalPrice: 100 - discount });
});

// P2: Race condition while updating inventory
let stock = 1;
app.post("/buy", async (req, res) => {
  if (stock > 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    stock--;
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Out of stock" });
  }
});

// P2: Sensitive error details exposed
app.get("/report", (req, res) => {
  try {
    throw new Error("Database password: demo-secret");
  } catch (error: any) {
    res.status(500).send(error.stack);
  }
});

// P2: No pagination — returns every record
app.get("/all-orders", (req, res) => {
  res.json(new Array(100000).fill({ id: 1, status: "pending" }));
});

// P3: Incorrect total calculation
app.get("/total", (req, res) => {
  const prices = [10.99, 20.99, 30.99];
  const total = prices.reduce((sum, price) => sum + Math.floor(price), 0);
  res.json({ total });
});

app.listen(3000);
