import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  getNVCSession,
  createQASession,
  getQASessionsBySessionId,
} from "~/lib/db.server";
import { answerContextQuestion } from "~/lib/openai.server";

export async function action({ params, request }: ActionFunctionArgs) {
  const { id: sessionId } = params;
  if (!sessionId) {
    throw new Response("会话ID是必需的", { status: 400 });
  }

  // 验证UUID格式
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    throw new Response("无效的会话ID格式", { status: 400 });
  }

  // 获取NVC会话
  const nvcSession = await getNVCSession(sessionId);
  if (!nvcSession) {
    throw new Response("未找到会话", { status: 404 });
  }

  const formData = await request.formData();
  const question = formData.get("question")?.toString();
  const questionCount = parseInt(
    formData.get("questionCount")?.toString() || "1"
  );

  if (!question?.trim()) {
    throw new Response("问题不能为空", { status: 400 });
  }

  // 检查问答次数限制（最多3次）
  const existingQAs = await getQASessionsBySessionId(sessionId);
  if (existingQAs.length >= 3) {
    throw new Response("问答次数已达上限", { status: 400 });
  }

  try {
    // 获取之前的问答记录作为上下文
    const previousQAs = existingQAs.map((qa) => ({
      question: qa.question,
      answer: qa.answer,
    }));

    // 调用AI生成回答
    const answer = await answerContextQuestion(
      nvcSession,
      question.trim(),
      previousQAs
    );

    // 保存问答记录
    const qaSession = await createQASession({
      session_id: sessionId,
      question: question.trim(),
      answer,
      question_count: questionCount,
    });

    return json({
      success: true,
      qa: qaSession,
    });
  } catch (error) {
    console.error("问答处理失败:", error);
    return json(
      {
        error: error instanceof Error ? error.message : "问答处理失败",
      },
      { status: 500 }
    );
  }
}

// 这个路由只处理API请求，不渲染页面
export default function QAHandler() {
  return null;
}
