import { GoogleGenerativeAI } from "@google/generative-ai";

export const handleChat = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message && (!history || history.length === 0)) {
      return res.status(400).json({ error: "Message or history is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in the environment variables.");
      return res.status(500).json({ error: "API key is missing" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const systemInstruction = `You are a helpful legal assistant for LawConnect, a platform connecting clients with lawyers.
Your job is to answer basic legal questions briefly, in simple language (Hindi/English mix if the user asks).
Do not provide definitive legal advice. Keep your responses natural and conversational. DO NOT add disclaimers to your messages.
Recommend which category of lawyer (e.g., Criminal, Corporate, Family, Property, Immigration, Intellectual Property, Tax, Employment) they should look for in the "Find Lawyers" section based on their query.`;

    let prompt = `${systemInstruction}\n\n`;

    if (history && Array.isArray(history)) {
      prompt += history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');
      prompt += `\nAssistant:`;
    } else {
      prompt += `User: ${message}\nAssistant:`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ reply: text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to process AI response." });
  }
};
