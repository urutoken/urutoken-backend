import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Test route
app.get("/api", (req, res) => {
  res.json({ message: "API working ✅" });
});

// Save purchase
app.post("/buy", async (req, res) => {
  try {
    const { wallet, amount, currency } = req.body;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        wallet,
        amount,
        currency
      })
    });

    if (!response.ok) {
      throw new Error("Failed to save");
    }

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running 🚀"));
