require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const buyRoutes = require("./routes/buy");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/api/buy", buyRoutes);

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const COIN_IDS = {
  ETH: "ethereum",
  WETH: "ethereum",
  BTC: "bitcoin",
  WBTC: "bitcoin",
  BNB: "binancecoin",
  SOL: "solana",
  MATIC: "matic-network",
  TRX: "tron",
  USDT: "tether",
  USDC: "usd-coin",
  DAI: "dai",
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave"
};

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Urutoken professional backend running"
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "API working ✅"
  });
});

app.get("/api/supported-currencies", (req, res) => {
  res.json({
    success: true,
    currencies: Object.keys(COIN_IDS)
  });
});

app.get("/block", async (req, res) => {
  try {
    const block = await provider.getBlockNumber();
    res.json({ success: true, block });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/db-test", async (req, res) => {
  try {
    const pool = require("./db");
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      status: "DB OK",
      time: result.rows[0].now
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: "DB ERROR",
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Urutoken backend running on port ${PORT}`);
});
