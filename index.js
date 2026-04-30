import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const URU_PRICE_USDT = 0.01;

app.get("/api", (req, res) => {
  res.json({ message: "API working ✅" });
});

async function savePurchase(wallet, amount, currency) {
  const numericAmount = Number(amount);
  const tokens = numericAmount / URU_PRICE_USDT;

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
      amount: numericAmount,
      currency,
      tokens
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
    const { wallet, amount, currency } = req.query;
    const data = await savePurchase(wallet, amount, currency);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/buy", async (req, res) => {
  try {
    const { wallet, amount, currency } = req.body;
    const data = await savePurchase(wallet, amount, currency);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running 🚀"));
