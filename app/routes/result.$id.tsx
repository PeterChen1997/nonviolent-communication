import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { getNVCSession } from "~/lib/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "NVC 分析结果" },
    { name: "description", content: "您的非暴力沟通练习分析结果" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const sessionId = parseInt(params.id!);
  if (isNaN(sessionId)) {
    throw new Response("无效的会话ID", { status: 400 });
  }

  const session = await getNVCSession(sessionId);
  if (!session) {
    throw new Response("未找到会话", { status: 404 });
  }

  return json({ session });
}

export default function ResultPage() {
  const { session } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const fromQuery = searchParams.get("from") === "query";

  const steps = [
    {
      key: "observation",
      title: "观察",
      color: "bg-green-500",
      content: session.observation,
    },
    {
      key: "feeling",
      title: "感受",
      color: "bg-orange-500",
      content: session.feeling,
    },
    {
      key: "need",
      title: "需要",
      color: "bg-purple-500",
      content: session.need,
    },
    {
      key: "request",
      title: "请求",
      color: "bg-blue-500",
      content: session.request,
    },
  ];

  const aiAnalysis = session.ai_feedback;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部标题 */}
      <div className="bg-white shadow-sm p-4 text-center">
        <h1 className="text-xl font-bold text-gray-800">NVC 转换结果</h1>
        <p className="text-sm text-gray-600 mt-1">
          您的表达已转换为非暴力沟通方式
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* 原始表达 */}
        <div className="bg-white rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            💬 您的原始表达
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
            <p className="text-gray-700 leading-relaxed">
              "{session.original_text}"
            </p>
          </div>
        </div>

        {/* NVC 转换结果 */}
        <div className="bg-white rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            🔄 NVC 转换结果
          </h2>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.key} className="border rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div
                    className={`w-8 h-8 rounded-full ${step.color} text-white text-sm font-bold flex items-center justify-center mr-3`}
                  >
                    {index + 1}
                  </div>
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${step.color}`}
                  >
                    {step.title}
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed ml-11">
                  {step.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* AI 分析结果 */}
        {aiAnalysis && (
          <>
            {/* 总体评分 */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🏆 总体评分
              </h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(aiAnalysis.score / 10) * 100}%` }}
                  ></div>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {aiAnalysis.score}/10
                </span>
              </div>
              <p className="text-gray-600 text-sm mt-2">
                {aiAnalysis.overall_feedback}
              </p>
            </div>

            {/* 改进建议 */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                💡 AI 改进建议
              </h3>
              <div className="space-y-4">
                {steps.map((step) => {
                  const improvements =
                    aiAnalysis.improvements[
                      step.key as keyof typeof aiAnalysis.improvements
                    ];
                  if (!improvements || improvements.length === 0) return null;

                  return (
                    <div key={step.key} className="border rounded-lg p-3">
                      <div
                        className={`inline-block px-2 py-1 rounded text-white text-xs font-medium ${step.color} mb-2`}
                      >
                        {step.title}
                      </div>
                      <ul className="space-y-1">
                        {improvements.map((suggestion, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-700 flex items-start"
                          >
                            <span className="text-orange-500 mr-2 flex-shrink-0">
                              •
                            </span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col space-y-3">
          <Link
            to="/"
            className="bg-blue-500 text-white text-center py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            开始新的练习
          </Link>

          {fromQuery && (
            <Link
              to="/"
              className="bg-gray-500 text-white text-center py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              返回首页
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
            className="bg-green-500 text-white text-center py-3 px-6 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            分享结果
          </button>
        </div>

        {/* 时间信息 */}
        <div className="text-center text-xs text-gray-500">
          完成时间: {new Date(session.created_at!).toLocaleString("zh-CN")}
        </div>
      </div>
    </div>
  );
}
