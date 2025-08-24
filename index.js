import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Helper function to call Groq with JSON-enforced output
async function callGroq(prompt) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: `You are a resume analysis assistant. Always respond ONLY in valid JSON with this structure:
{
  "strengths": ["point1", "point2", ...],
  "weaknesses": ["point1", "point2", ...],
  "improvements": ["point1", "point2", ...]
}`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Groq API error");
  }

  const data = await response.json();

  // Parse JSON safely
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    console.error("❌ JSON parse error:", e.message);
    throw new Error("Groq did not return valid JSON");
  }
}

// 🔎 Analyze endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    const result = await callGroq(`Analyze this resume/job text:\n\n${text}`);
    res.json(result);
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
    res.json(result);
  } catch (err) {
    console.error("❌ Error in /api/suggest:", err.message);
    res.status(500).json({ error: "Failed to suggest", details: err.message });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("✅ Resume Tailor backend (Groq JSON mode) is running");
});

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});