import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
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
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "小猫正在仔细听你说话...",
    "小猫在理解你的情绪...",
    "小猫在想温暖的表达方式...",
    "小猫在完善建议...",
    "搞定啦！",
  ];

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

  // 假进度条逻辑
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) {
          const increment = Math.random() * 15 + 5; // 随机增加5-20%
          return Math.min(prev + increment, 90);
        }
        return prev;
      });
    }, 800);

    return () => clearInterval(timer);
  }, []);

  // 步骤切换逻辑
  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(stepTimer);
  }, []);

  // 当API完成时，设置进度为100%
  useEffect(() => {
    if (fetcher.data?.sessionId) {
      setProgress(100);
      setCurrentStep(steps.length - 1);
    }
  }, [fetcher.data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-white/20">
        {/* 小猫动画 */}
        <div className="mb-8">
          <div className="text-8xl mb-4 animate-bounce">🐈</div>
        </div>

        {/* 标题 */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          小猫正在思考中
        </h2>

        {/* 描述 */}
        <p className="text-base md:text-lg text-gray-600 mb-6 leading-relaxed">
          我正在用心分析你的话， 马上就能给你一个温暖的表达方式啦~
        </p>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-pink-400 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* 当前步骤显示 */}
          <div className="text-purple-600 text-base md:text-lg font-medium mb-4">
            {steps[currentStep]}
          </div>

          <div className="text-gray-500 text-sm">预计需要 10-30 秒</div>
        </div>

        {/* 状态显示 */}
        {fetcher.state === "idle" && fetcher.data?.sessionId && (
          <div className="text-green-600 text-base font-medium">
            🎉 完成啦！正在跳转...
          </div>
        )}
      </div>
    </div>
  );
}
