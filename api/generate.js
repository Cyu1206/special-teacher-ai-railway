import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { inputText } = req.body || {};

    if (!inputText || !inputText.trim()) {
      return res.status(400).json({ error: "No inputText provided" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is missing" });
    }

    const systemPrompt = `
你是一位專業的特教老師，負責根據「孩子能力現況」產生教學與教養建議。
請依照下列固定 JSON 結構輸出，不要加任何多餘說明或文字，只能輸出 JSON：

{
  "parent": {
    "gross": [],
    "fine": [],
    "cognition": [],
    "language": [],
    "social": [],
    "daily": []
  },
  "teacher": {
    "gross": [],
    "fine": [],
    "cognition": [],
    "language": [],
    "social": [],
    "daily": []
  }
}

請務必輸出合法 JSON。
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `孩子能力現況如下：\n${inputText}` }
      ]
    });

    const suggestionText = completion.choices[0]?.message?.content?.trim();

    try {
      JSON.parse(suggestionText);
    } catch (e) {
      return res.status(500).json({
        error: "Model did not return valid JSON",
        raw: suggestionText
      });
    }

    return res.status(200).json({ suggestion: suggestionText });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
}
