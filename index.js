import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// 👇 Use your Groq API key here (set in Render dashboard)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Helper function to call Groq
async function callGroq(prompt) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama3-70b-8192", // free model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Groq API error");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 🔎 Analyze endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    const result = await callGroq(`Analyze this resume/job text:\n\n${text}`);
    res.json({ result });
  } catch (err) {
    console.error("❌ Error in /api/analyze:", err.message);
    res.status(500).json({ error: "Failed to analyze", details: err.message });
  }
});

// 💡 Suggest improvements endpoint
app.post("/api/suggest", async (req, res) => {
  try {
    const { resume } = req.body;
    const result = await callGroq(`Suggest improvements for this resume:\n\n${resume}`);
    res.json({ result });
  } catch (err) {
    console.error("❌ Error in /api/suggest:", err.message);
    res.status(500).json({ error: "Failed to suggest", details: err.message });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("✅ Resume Tailor backend (Groq) is running");
});

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});