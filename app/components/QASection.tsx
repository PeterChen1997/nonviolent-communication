import { useState, useRef, useEffect } from "react";
import { useFetcher } from "@remix-run/react";

interface QASession {
  id?: string;
  session_id: string;
  question: string;
  answer: string;
  question_count: number;
  created_at?: Date | string;
}

interface QASectionProps {
  sessionId: string;
  existingQAs: QASession[];
}

export default function QASection({ sessionId, existingQAs }: QASectionProps) {
  const [question, setQuestion] = useState("");
  const [qaList, setQAList] = useState<QASession[]>(existingQAs);
  const fetcher = useFetcher<{ success: boolean; qa: QASession }>();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const maxQuestions = 3;
  const remainingQuestions = maxQuestions - qaList.length;

  // 当fetcher返回新的问答时，更新列表
  useEffect(() => {
    if (fetcher.data?.qa) {
      setQAList((prev) => [...prev, fetcher.data!.qa]);
      setQuestion("");
      // 滚动到底部
      setTimeout(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [fetcher.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !question.trim() ||
      qaList.length >= maxQuestions ||
      fetcher.state !== "idle"
    ) {
      return;
    }

    // 提交问题
    const formData = new FormData();
    formData.append("question", question.trim());
    formData.append("sessionId", sessionId);
    formData.append("questionCount", String(qaList.length + 1));

    fetcher.submit(formData, {
      method: "post",
      action: `/result/${sessionId}/qa`,
    });
  };

  if (remainingQuestions <= 0 && qaList.length === 0) {
    return null; // 不显示问答区域
  }

  return (
    <div
      className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 animate-slide-up"
      style={{ animationDelay: "2.0s" }}
    >
      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 flex items-center">
        🐱 <span className="ml-2">继续和小猫聊聊</span>
      </h3>

      <p className="text-gray-600 text-sm md:text-base mb-6">
        基于刚才的对话，小猫还可以回答你{" "}
        <span className="font-semibold text-purple-600">
          {remainingQuestions}
        </span>{" "}
        个问题呢
      </p>

      {/* 问答历史 */}
      {qaList.length > 0 && (
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {qaList.map((qa, index) => (
            <div key={qa.id || index} className="space-y-3">
              {/* 用户问题 */}
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-blue-500 text-white p-3 rounded-2xl rounded-br-sm">
                  <p className="text-sm md:text-base">{qa.question}</p>
                </div>
              </div>

              {/* AI回答 */}
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-bl-sm">
                  <div className="text-sm md:text-base leading-relaxed">
                    {qa.answer.split("\n").map((line, lineIndex) => (
                      <span key={lineIndex}>
                        {line}
                        {lineIndex < qa.answer.split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={endOfMessagesRef} />
        </div>
      )}

      {/* 输入区域 */}
      {remainingQuestions > 0 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="您还有什么想了解的关于这次的问题吗？"
              className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none resize-none h-24 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 transition-all duration-300"
              maxLength={200}
              disabled={fetcher.state !== "idle"}
            />
            <div className="absolute bottom-2 right-3 text-xs text-gray-400 dark:text-gray-500">
              {question.length}/200
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              剩余问题数: {remainingQuestions}
            </span>

            <button
              type="submit"
              disabled={!question.trim() || fetcher.state !== "idle"}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
            >
              {fetcher.state === "submitting" ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  思考中...
                </div>
              ) : (
                "提问"
              )}
            </button>
          </div>
        </form>
      )}

      {remainingQuestions === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">
            今天的问答次数用完啦~ 小猫明天继续陪你聊天 🐱💕
          </p>
        </div>
      )}
    </div>
  );
}
