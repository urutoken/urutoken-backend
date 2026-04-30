require("dotenv").config();

const express = require("express");
const { ethers } = require("ethers");

const webhookRoutes = require("./routes/webhook");
const userRoutes = require("./routes/user");
const presaleRoutes = require("./routes/presale");
const buyRoutes = require("./routes/buy");

const app = express();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.sendStatus(204);

  next();
});

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Urutoken backend running",
  });
});

app.get("/block", async (req, res) => {
  try {
    const block = await provider.getBlockNumber();
    res.json({ block });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/db-test", async (req, res) => {
  try {
    const pool = require("./db");
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "DB OK", time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: "DB ERROR", error: err.message });
  }
});

app.use("/webhook", webhookRoutes);
app.use("/api/user", userRoutes);
app.use("/api/presale", presaleRoutes);
app.use("/api/buy", buyRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
