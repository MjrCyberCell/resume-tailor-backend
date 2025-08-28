import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import "dotenv/config";
import Groq from "groq-sdk";

const app = express();
const port = process.env.PORT || 5000;

// ✅ Replace with your actual Vercel frontend domain
const allowedOrigins = [
  "https://resume-tailor-frontend-gold.vercel.app", // <-- Your Vercel frontend
];

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());

// Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Utility: extract JSON safely
function extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Routes
app.get("/", (req, res) => {
  res.send("Resume Tailor Backend (Groq) is running 🚀");
});

app.post("/api/analyze", async (req, res) => {
  const { resume, jobDescription } = req.body;

  if (!resume || !jobDescription) {
    return res
      .status(400)
      .json({ error: "Both resume and job description are required." });
  }

  try {
    const prompt = `
You are an expert career coach and resume writer.

Compare the following resume against the job description and return a JSON object with detailed analysis.

Resume:
${resume}

Job Description:
${jobDescription}

The JSON must include:
{
  "score": 0-100,                  // percentage match of resume to job
  "strengths": ["..."],            // areas where resume aligns well
  "weaknesses": ["..."],           // gaps or issues
  "improvements": ["..."],         // general improvement suggestions
  "missing_keywords": ["..."],     // important terms from JD not found in resume
  "example_bullets": ["..."],      // 2-3 suggested resume bullet points tailored to JD
  "improved_resume_snippet": "..." // a short rewritten section of the resume showing improvements
}

Make sure the JSON is valid and properly formatted.
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // ✅ updated model ID
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0].message.content;
    const analysis = extractJSON(raw);

    if (!analysis) {
      console.error("Groq returned unparseable response:", raw);
      return res.status(500).json({
        error: "Invalid JSON from Groq",
        details: raw,
      });
    }

    res.json(analysis);
  } catch (err) {
    console.error("Error during analysis:", err);
    res.status(500).json({ error: "Analysis failed", details: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`✅ Groq backend running on port ${port}`);
});