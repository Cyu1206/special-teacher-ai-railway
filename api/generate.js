// api/generate.js
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

    const systemPrompt = `
你是一位專業的特教老師，負責根據「孩子能力現況」產生教學與教養建議。
請依照下列固定 JSON 結構輸出，不要加任何多餘說明或文字：

{
  "parent": {
    "gross": ["建議1", "建議2"],
    "fine": ["建議1"],
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

說明：
- parent = 給家長的建議
- teacher = 給普班老師的建議
- 六大面向 key 必須固定是：gross, fine, cognition, language, social, daily
- 每個陣列裡放 0~5 則建議句子（視需要而定）
- 嚴格輸出合法 JSON（不能有註解、不能有多餘文字、中英混合都可以，但格式一定要是 JSON）
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `孩子能力現況如下：\n${inputText}`,
        },
      ],
    });

    const suggestion = completion.choices[0].message.content;

    // suggestion 應該是一個 JSON 字串
    // 前端會做 JSON.parse(suggestion) 再交給 fillAI()
    return res.status(200).json({ suggestion });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
}
