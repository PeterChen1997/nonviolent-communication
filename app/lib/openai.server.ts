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
  standard_response: string; // 标准答案
}

export async function decomposeToNVC(
  originalText: string
): Promise<NVCDecomposition> {
  try {
    const prompt = `
你好！我是倾听小猫🐱，一只专门帮助大家改善沟通的温暖小猫。我擅长把那些听起来不太友好的话，变成更暖心、更有效的表达方式。

你刚刚说的话是：${originalText}

作为你的沟通小助手，我会帮你重新整理这句话，让它听起来更温暖，也更容易被对方接受。我会从四个角度来帮你：

请按照以下格式返回JSON，确保每个部分都很详细（每部分至少50字）：

{
  "observation": "我们先来看看到底发生了什么事情。我会用最客观的方式描述当时的情况，就像一台录像机一样，只记录看到的、听到的事实，不加任何个人判断",
  "feeling": "然后我们聊聊你的真实感受。你心里可能有很多复杂的情绪，比如生气的背后可能还有失望、担心或者委屈。我会帮你准确地说出这些感受",
  "need": "接下来我们深挖一下，你真正需要的是什么。每个人都有一些基本的需要，比如被理解、被尊重、安全感等等。我会帮你找到你最核心的需要",
  "request": "最后，我们想想怎么说出你的期待。我会建议2-3个具体可行的方法，告诉对方你希望他们怎么做，这样大家都更清楚，关系也会更好",
  "improvements": {
    "observation": ["3-4个贴心提示：怎么去掉那些听起来像批评的词，用更中性的方式描述事情"],
    "feeling": ["3-4个感受表达小技巧：怎么区分想法和感受，怎么表达复杂的情绪"],
    "need": ["3-4个需求挖掘建议：怎么从表面的要求深入到内心真正的需要"],
    "request": ["3-4个请求优化技巧：怎么让你的期待更清楚、更容易实现"]
  },
  "overall_feedback": "至少150字的温暖反馈，包括：1）夸夸你敢于表达的勇气 2）分析这种沟通情况很常见，你不是一个人 3）举些类似的例子（工作、家庭、朋友间的相似情况）4）解释为什么温暖沟通这么重要 5）给你一些鼓励和继续练习的建议",
  "score": 8 (根据提问内容打分，满分10分),
  "standard_response": "这是一句综合了观察、感受、需要、请求四个部分的完整标准答案，用最温暖、最直接的方式表达你想说的话，别人听了会更容易理解和接受"
}

我的分析要点：
1. 观察：像小猫一样敏锐地捕捉事实，去掉"总是"、"从不"、"很烦人"这些带情绪的词
2. 感受：温柔地理解你的情绪，帮你说出那些藏在愤怒背后的真实感受
3. 需要：像知心朋友一样，帮你找到内心真正渴望的东西，比如理解、尊重、关爱
4. 请求：用最暖心的方式，建议你怎么跟对方沟通，让大家都舒服
5. 标准答案：把四个部分自然地串联成一句完整的话，就像你直接跟对方说话一样，要温暖、诚恳、容易理解。这应该是你可以直接使用的完美表达。

评分说明（1-10分）：
- 有多准确地理解你的意思（30%）
- 有多深入地挖掘你的真实需要（30%）
- 四个建议有多实用（25%）
- 改进提示有多具体可行（15%）

我会用最温暖、最理解的方式跟你交流，让你感受到被关心和支持。毕竟，每个人都值得被温柔以待呀~🐱
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
        !parsed.request ||
        !parsed.standard_response
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

// 基于NVC上下文回答问题
export async function answerContextQuestion(
  nvcSession: any,
  question: string,
  previousQAs?: Array<{ question: string; answer: string }>
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_ENDPOINT,
  });

  // 构建上下文
  let context = `用户的原始表达：${nvcSession.original_text}\n\n`;
  context += `结果：\n`;
  context += `观察：${nvcSession.observation}\n`;
  context += `感受：${nvcSession.feeling}\n`;
  context += `需要：${nvcSession.need}\n`;
  context += `请求：${nvcSession.request}\n\n`;

  if (nvcSession.ai_feedback?.overall_feedback) {
    context += `AI分析：${nvcSession.ai_feedback.overall_feedback}\n\n`;
  }

  // 添加之前的问答历史
  if (previousQAs && previousQAs.length > 0) {
    context += `之前的问答记录：\n`;
    previousQAs.forEach((qa, index) => {
      context += `Q${index + 1}: ${qa.question}\n`;
      context += `A${index + 1}: ${qa.answer}\n\n`;
    });
  }

  const prompt = `
喵~我是倾听小猫！🐱 我刚刚帮你分析了你的话，现在你又有新问题要问我啦~

你的问题是：${question}

作为你的温暖小助手，我会：
1. 基于我们刚才的聊天内容来回答你
2. 用最温暖、最贴心的方式跟你交流
3. 如果问题跟沟通有关，我会给你实用的小建议
4. 如果问题跑题了，我会温柔地拉回到我们的沟通话题上
5. 用简单易懂的话跟你说，不会太长也不会太短
6. 就像朋友聊天一样自然

我会直接回答你，不用什么固定格式，就像两个朋友在聊天一样温暖自然~
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: context,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const answer = completion.choices[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error("AI未能生成回答");
    }

    return answer;
  } catch (error) {
    console.error("问答生成失败:", error);
    throw new Error("抱歉，AI暂时无法回答您的问题，请稍后再试。");
  }
}
