import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const URU_PRICE_USD = 0.01;

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

const FALLBACK_PRICES = {
  USDT: 1,
  USDC: 1,
  DAI: 1,
  ETH: 3000,
  WETH: 3000,
  BTC: 60000,
  WBTC: 60000,
  BNB: 600,
  SOL: 150,
  MATIC: 0.7,
  TRX: 0.12,
  LINK: 15,
  UNI: 8,
  AAVE: 100
};

app.get("/api", (req, res) => {
  res.json({ message: "API working ✅" });
});

async function getLiveUsdPrice(currency) {
  const coinId = COIN_IDS[currency];

  if (!coinId) {
    throw new Error("Unsupported currency");
  }

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
    const response = await fetch(url);
    const data = await response.json();

    const price = data?.[coinId]?.usd;

    if (price && Number(price) > 0) {
      return Number(price);
    }
  } catch (error) {
    console.log("Live price API failed:", error.message);
  }

  if (FALLBACK_PRICES[currency]) {
    return FALLBACK_PRICES[currency];
  }

  throw new Error(`${currency} live price not available`);
}

async function savePurchase(payload) {
  const wallet = payload.wallet || "UNKNOWN_WALLET";
  const currency = String(payload.currency || "USDT").toUpperCase();
  const amount = Number(payload.amount || 0);

  if (!COIN_IDS[currency]) {
    throw new Error("Unsupported currency");
  }

  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }

  const livePriceUsd = await getLiveUsdPrice(currency);
  const usd_value = Number((amount * livePriceUsd).toFixed(6));
  const tokens = Number((usd_value / URU_PRICE_USD).toFixed(6));

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

  if (!response.ok) {
    throw new Error(data);
  }

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

app.get("/api/supported-currencies", (req, res) => {
  res.json({
    success: true,
    currencies: Object.keys(COIN_IDS)
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
