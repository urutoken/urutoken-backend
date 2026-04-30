import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const URU_PRICE_USD = 0.01;

const SUPPORTED_CURRENCIES = [
  "USDT", "USDC", "DAI",
  "ETH", "BNB", "BTC",
  "MATIC", "TRX", "SOL"
];

function calculateUsdValue(amount, currency, usdValueFromRequest) {
  const numericAmount = Number(amount);

  if (["USDT", "USDC", "DAI"].includes(currency)) {
    return numericAmount;
  }

  if (!usdValueFromRequest) {
    throw new Error(`${currency} purchase needs usd_value from live price quote`);
  }

  return Number(usdValueFromRequest);
}

app.get("/api", (req, res) => {
  res.json({ message: "API working ✅" });
});

async function savePurchase(payload) {
  const wallet = payload.wallet || "UNKNOWN_WALLET";
  const currency = String(payload.currency || "USDT").toUpperCase();
  const amount = Number(payload.amount || 0);

  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new Error("Unsupported currency");
  }

  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }

  const usd_value = calculateUsdValue(amount, currency, payload.usd_value);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running 🚀"));
