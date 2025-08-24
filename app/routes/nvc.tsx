import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createNVCSession } from "~/lib/db.server";
import { decomposeToNVC } from "~/lib/openai.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  // 获取查询参数
  const originalText =
    url.searchParams.get("text") || url.searchParams.get("originalText");

  // 如果没有提供原始文本，重定向到首页
  if (!originalText || !originalText.trim()) {
    return redirect("/");
  }

  try {
    // 调用 OpenAI 分解原始文本
    const nvcDecomposition = await decomposeToNVC(originalText.trim());

    // 保存到数据库
    const session = await createNVCSession({
      original_text: originalText.trim(),
      observation: nvcDecomposition.observation,
      feeling: nvcDecomposition.feeling,
      need: nvcDecomposition.need,
      request: nvcDecomposition.request,
      ai_feedback: {
        improvements: nvcDecomposition.improvements,
        overall_feedback: nvcDecomposition.overall_feedback,
        score: nvcDecomposition.score,
      },
    });

    // 重定向到结果页，并标记来源为查询参数
    return redirect(`/result/${session.id}?from=query`);
  } catch (error) {
    console.error("查询参数处理失败:", error);
    return redirect("/?error=analysis_failed");
  }
}

// 这个路由不会渲染任何内容，只是处理重定向
export default function NVCQueryHandler() {
  return null;
}
