import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import {
  getNVCSession,
  getQASessionsBySessionId,
  type QASession,
} from "~/lib/db.server";
import QASection from "~/components/QASection";

export const meta: MetaFunction = () => {
  return [
    { title: "倾听小猫的建议" },
    { name: "description", content: "小猫为你准备的暖心表达方式" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  if (!id) {
    throw new Response("会话ID是必需的", { status: 400 });
  }

  // 验证UUID格式
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Response("无效的会话ID格式", { status: 400 });
  }

  const session = await getNVCSession(id);
  if (!session) {
    throw new Response("未找到会话", { status: 404 });
  }

  // 获取问答记录
  const qaList = await getQASessionsBySessionId(id);

  return json({ session, qaList });
}

// 处理文本分行显示的工具函数
function formatText(text: string) {
  return text.split("\n").map((line, index) => (
    <span key={index}>
      {line}
      {index < text.split("\n").length - 1 && <br />}
    </span>
  ));
}

export default function ResultPage() {
  const { session, qaList } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const fromQuery = searchParams.get("from") === "query";

  const steps = [
    {
      key: "observation",
      title: "看看发生了什么",
      color: "bg-green-500",
      content: session.observation,
    },
    {
      key: "feeling",
      title: "说说心里感受",
      color: "bg-orange-500",
      content: session.feeling,
    },
    {
      key: "need",
      title: "找找内心需要",
      color: "bg-purple-500",
      content: session.need,
    },
    {
      key: "request",
      title: "提出温暖请求",
      color: "bg-blue-500",
      content: session.request,
    },
  ];

  const aiAnalysis = session.ai_feedback;

  // 生成长度适中的后备标准答案
  const generateFallbackResponse = () => {
    const originalLength = session.original_text?.length || 50;
    const targetMaxLength = originalLength * 3;

    let fallback = `${session.observation}，这让我感到${session.feeling}，因为我需要${session.need}。${session.request}`;

    if (fallback.length > targetMaxLength) {
      fallback = `${session.observation}，我感到${session.feeling}，需要${session.need}。${session.request}`;
    }

    if (fallback.length > targetMaxLength) {
      fallback = `${session.observation}，我${session.feeling}，希望${session.request}`;
    }

    return fallback;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950 pb-safe">
      {/* 顶部标题 */}
      <div className="px-6 pt-12 pb-8 text-center">
        <div className="animate-fade-in">
          <div className="text-6xl mb-4">🐱</div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            小猫为你准备好了
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-md mx-auto leading-relaxed">
            一份温暖的表达方式 💕
          </p>
        </div>
      </div>

      <div className="px-6 max-w-2xl mx-auto space-y-6">
        {/* 原始表达 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 animate-slide-up">
          <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-4 flex items-center">
            💬 <span className="ml-2">你刚才说的话</span>
          </h2>
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 md:p-5 border-l-4 border-blue-400">
            <p className="text-base md:text-lg text-gray-800 leading-relaxed font-medium">
              "{session.original_text}"
            </p>
          </div>
        </div>

        {/* NVC 转换结果 */}
        <div
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-6 flex items-center">
            🌸 <span className="ml-2">小猫建议这样说</span>
          </h2>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-4 md:p-6 shadow-md border border-gray-100 animate-fade-in transform hover:scale-[1.02] transition-all duration-300"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <div className="mb-4">
                  <div className="mb-4">
                    <div
                      className={`inline-block px-4 py-2 rounded-2xl text-white text-base md:text-lg font-bold ${step.color} shadow-md`}
                    >
                      {step.title}
                    </div>
                  </div>
                  <div className="text-base md:text-lg text-gray-800 leading-relaxed font-medium">
                    {formatText(step.content)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 标准答案 */}
        {(aiAnalysis?.standard_response ||
          (session.observation &&
            session.feeling &&
            session.need &&
            session.request)) && (
          <div
            className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 backdrop-blur-xl rounded-3xl p-8 shadow-lg border-2 border-pink-200 animate-slide-up"
            style={{ animationDelay: "1.2s" }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              ✨ <span className="ml-2">小猫推荐的标准答案</span>
            </h3>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-pink-100">
              <div className="text-lg text-gray-800 leading-relaxed font-medium">
                <span className="text-pink-600 text-xl font-semibold">💬</span>
                <span className="ml-3">
                  "
                  {formatText(
                    aiAnalysis?.standard_response || generateFallbackResponse()
                  )}
                  "
                </span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                💝 这句话结合了观察、感受、需要、请求，可以直接使用哦~
              </p>
            </div>
          </div>
        )}

        {/* AI 分析结果 */}
        {aiAnalysis && (
          <>
            {/* 总体评分 */}
            <div
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-white/20 animate-slide-up"
              style={{ animationDelay: "0.6s" }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                🌟 <span className="ml-2">小猫给你打分</span>
              </h3>
              <div className="text-center mb-6">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg
                    className="w-32 h-32 transform -rotate-90"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(aiAnalysis.score / 10) * 314} 314`}
                      className="transition-all duration-1000 animate-pulse"
                    />
                    <defs>
                      <linearGradient
                        id="gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl md:text-4xl font-bold text-green-600">
                      {aiAnalysis.score}
                    </span>
                    <span className="text-lg md:text-xl text-gray-500 ml-1">
                      /10
                    </span>
                  </div>
                </div>
                <div className="text-lg text-green-600 font-semibold">
                  {aiAnalysis.score >= 8
                    ? "优秀表达 🎉"
                    : aiAnalysis.score >= 6
                    ? "良好进步 👍"
                    : "继续加油 💪"}
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                <div className="text-base md:text-lg text-gray-800 leading-relaxed font-medium">
                  {formatText(aiAnalysis.overall_feedback)}
                </div>
              </div>
            </div>

            {/* 改进建议 */}
            <div
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-white/20 animate-slide-up"
              style={{ animationDelay: "0.8s" }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                💡 <span className="ml-2">小猫的贴心建议</span>
              </h3>
              <div className="space-y-6">
                {steps.map((step, stepIndex) => {
                  const improvements =
                    aiAnalysis.improvements[
                      step.key as keyof typeof aiAnalysis.improvements
                    ];
                  if (!improvements || improvements.length === 0) return null;

                  return (
                    <div
                      key={step.key}
                      className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 border border-gray-100 shadow-md animate-fade-in transform hover:scale-[1.02] transition-all duration-300"
                      style={{ animationDelay: `${1.0 + stepIndex * 0.1}s` }}
                    >
                      <div className="mb-4">
                        <div
                          className={`inline-block px-4 py-2 rounded-2xl text-white text-base md:text-lg font-bold ${step.color} shadow-md`}
                        >
                          {step.title}小贴士
                        </div>
                      </div>
                      <ul className="space-y-3">
                        {improvements.map(
                          (suggestion: string, index: number) => (
                            <li
                              key={index}
                              className="text-base md:text-lg text-gray-800 flex items-start leading-relaxed"
                            >
                              <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                                <span className="text-pink-600 text-sm">
                                  💝
                                </span>
                              </div>
                              <div className="font-medium">
                                {formatText(suggestion)}
                              </div>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* 操作按钮 */}
        <div
          className="flex flex-col space-y-4 animate-slide-up"
          style={{ animationDelay: "1.6s" }}
        >
          <Link
            to="/"
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-4 px-8 rounded-2xl text-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl shadow-lg"
          >
            🐱 再和小猫聊聊
          </Link>

          {fromQuery && (
            <Link
              to="/"
              className="bg-gradient-to-r from-gray-400 to-gray-600 text-white text-center py-4 px-8 rounded-2xl text-lg font-semibold hover:from-gray-500 hover:to-gray-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg shadow-md"
            >
              🏠 返回首页
            </Link>
          )}

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "NVC练习结果",
                  text: `我完成了一次非暴力沟通练习，获得了 ${aiAnalysis?.score}/10 分！`,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert("链接已复制到剪贴板");
              }
            }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center py-4 px-8 rounded-2xl text-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg shadow-md"
          >
            📤 分享结果
          </button>
        </div>

        {/* 问答区域 */}
        <QASection
          sessionId={session.id!}
          existingQAs={qaList.map((qa) => ({
            ...qa,
            created_at: qa.created_at ? new Date(qa.created_at) : undefined,
          }))}
        />

        {/* 时间信息 */}
        <div
          className="text-center bg-white/50 backdrop-blur-xl rounded-2xl p-4 animate-fade-in"
          style={{ animationDelay: "2.0s" }}
        >
          <p className="text-gray-600 text-lg">
            完成时间: {new Date(session.created_at!).toLocaleString("zh-CN")}
          </p>
        </div>

        {/* 底部留白 */}
        <div className="h-8"></div>
      </div>

      {/* 自定义动画样式 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out forwards;
            opacity: 0;
          }
          .animate-slide-up {
            animation: slide-up 0.6s ease-out forwards;
            opacity: 0;
          }
        `,
        }}
      />
    </div>
  );
}
