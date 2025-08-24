import "dotenv/config";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_ENDPOINT,
});

export interface NVCDecomposition {
  observation: string;
  feeling: string;
  need: string;
  request: string;
  improvements: {
    observation?: string[];
    feeling?: string[];
    need?: string[];
    request?: string[];
  };
  overall_feedback: string;
  score: number; // 1-10 分评分
}

export async function decomposeToNVC(
  originalText: string
): Promise<NVCDecomposition> {
  try {
    const prompt = `
作为一位非暴力沟通（NVC）专家，请将以下表达分解为非暴力沟通的四个步骤，并提供改进建议。

原始表达：${originalText}

请按照以下格式返回JSON：

{
  "observation": "客观描述发生的事实（无评判、无解释）",
  "feeling": "表达真实的内在感受（避免想法和评判）",
  "need": "识别背后的内在需求（而非具体策略）",
  "request": "提出具体可行的请求（而非要求）",
  "improvements": {
    "observation": ["对观察部分的改进建议"],
    "feeling": ["对感受部分的改进建议"],
    "need": ["对需要部分的改进建议"],
    "request": ["对请求部分的改进建议"]
  },
  "overall_feedback": "整体反馈，鼓励用户的表达勇气，同时给出温暖的建议",
  "score": 8
}

要求：
1. 观察：从原始表达中提取客观事实，去除评判、标签、解释
2. 感受：识别说话者的真实情感，区分感受和想法
3. 需要：探索表达背后的普世人类需求
4. 请求：将抱怨转化为具体、积极的行动建议

评分标准（1-10分）：
- 转换的准确性和完整性
- 是否真正理解原始表达的核心需求
- NVC四步骤的质量

请用温暖、非评判的语气给出建议。
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "你是一位温暖、专业的非暴力沟通教练，擅长帮助人们将日常表达转换为更加温和有效的沟通方式。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;

    console.log(content);

    if (!content) {
      throw new Error("OpenAI 返回为空");
    }

    // 尝试解析 JSON
    try {
      // 先清理可能的格式问题
      let cleanContent = content.trim();

      // 如果内容被 markdown 代码块包围，提取实际 JSON
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      const parsed = JSON.parse(cleanContent) as NVCDecomposition;

      // 验证必要字段是否存在
      if (
        !parsed.observation ||
        !parsed.feeling ||
        !parsed.need ||
        !parsed.request
      ) {
        throw new Error("JSON 缺少必要字段");
      }

      return parsed;
    } catch (parseError) {
      console.error("JSON 解析失败:", parseError, "原始内容:", content);
      throw parseError;
    }
  } catch (error) {
    console.error("OpenAI API 调用失败:", error);
    throw new Error("AI 分析服务暂时不可用，请稍后重试");
  }
}
