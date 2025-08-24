import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect } from "react";
import { createNVCSession } from "~/lib/db.server";
import { decomposeToNVC } from "~/lib/openai.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const originalText = url.searchParams.get("originalText");

  if (!originalText || !originalText.trim()) {
    return redirect("/");
  }

  return json({ originalText: originalText.trim() });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const originalText = formData.get("originalText") as string;

  if (!originalText || !originalText.trim()) {
    throw new Error("请输入您想表达的内容");
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

    // 返回会话 ID
    return json({ sessionId: session.id });
  } catch (error) {
    console.error("处理失败:", error);
    throw new Error("分析失败，请稍后重试");
  }
}

export default function ProcessingPage() {
  const { originalText } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  useEffect(() => {
    // 页面加载后立即提交处理请求
    const formData = new FormData();
    formData.append("originalText", originalText);
    fetcher.submit(formData, { method: "post" });
  }, [originalText]); // 移除 fetcher 依赖避免无限循环

  useEffect(() => {
    // 处理完成后跳转到结果页
    if (fetcher.data && fetcher.data.sessionId) {
      window.location.href = `/result/${fetcher.data.sessionId}`;
    }
  }, [fetcher.data]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          AI 正在转换中...
        </h2>
        <p className="text-gray-600 mb-4">
          我们正在使用专业的非暴力沟通模型分析您的表达，
          将其转换为温和而有效的四步骤表达方式。
        </p>
        <div className="text-sm text-gray-500">这通常需要 10-30 秒</div>

        {fetcher.state === "idle" && fetcher.data?.sessionId && (
          <div className="mt-4 text-green-600 text-sm">
            ✅ 转换完成，正在跳转...
          </div>
        )}

        {fetcher.state === "submitting" && (
          <div className="mt-4 text-blue-600 text-sm">🔄 正在处理中...</div>
        )}
      </div>
    </div>
  );
}
