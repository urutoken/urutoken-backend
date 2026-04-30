import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const URU_PRICE_USD = 0.01;

const COIN_IDS = {
  USDT: "tether",
  USDC: "usd-coin",
  DAI: "dai",
  ETH: "ethereum",
  BNB: "binancecoin",
  BTC: "bitcoin",
  MATIC: "matic-network",
  TRX: "tron",
  SOL: "solana"
};

app.get("/api", (req, res) => {
  res.json({ message: "API working ✅" });
});

async function getLiveUsdPrice(currency) {
  const coinId = COIN_IDS[currency];
  if (!coinId) throw new Error("Unsupported currency");

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
  const response = await fetch(url);
  const data = await response.json();

  const price = data?.[coinId]?.usd;
  if (!price) throw new Error("Live price not available");

  return Number(price);
}

async function savePurchase(payload) {
  const wallet = payload.wallet || "UNKNOWN_WALLET";
  const currency = String(payload.currency || "USDT").toUpperCase();
  const amount = Number(payload.amount || 0);

  if (!COIN_IDS[currency]) throw new Error("Unsupported currency");
  if (!amount || amount <= 0) throw new Error("Invalid amount");

  const livePriceUsd = await getLiveUsdPrice(currency);
  const usd_value = amount * livePriceUsd;
  const tokens = usd_value / URU_PRICE_USD;

  const tx_hash = payload.tx_hash || "TEST_TX_NOT_PROVIDED";
  const status = payload.status || "test";

  const response = await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify({
      wallet,
      currency,
      amount,
      usd_value,
      tokens,
      tx_hash,
      status
    })
  });

  const data = await response.text();
  if (!response.ok) throw new Error(data);

  return data;
}

app.get("/api/buy", async (req, res) => {
  try {
    const data = await savePurchase(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/buy", async (req, res) => {
  try {
    const data = await savePurchase(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running 🚀"));
