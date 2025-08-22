import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `Analyze this resume/job text:\n\n${text}` }]
    });
    res.json({ result: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to analyze" });
  }
});

app.post("/api/suggest", async (req, res) => {
  try {
    const { resume } = req.body;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `Suggest improvements for this resume:\n\n${resume}` }]
    });
    res.json({ result: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to suggest improvements" });
  }
});

app.listen(port, () => {
  console.log(`✅ Backend running on port ${port}`);
});