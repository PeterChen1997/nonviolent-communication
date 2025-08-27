import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import { Form, useNavigation } from "@remix-run/react";
import UsageLimitGuard from "~/components/UsageLimitGuard";
import { incrementUsage } from "~/lib/usage-limit";

export const meta: MetaFunction = () => {
  return [
    { title: "倾听小猫 - 温暖的沟通助手" },
    {
      name: "description",
      content: "我是倾听小猫，帮你把不舒服的话变成温暖的表达 🐱",
    },
  ];
};

export default function Index() {
  const [originalText, setOriginalText] = useState("");
  const navigation = useNavigation();

  // 处理表单提交，在提交前增加使用次数
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    incrementUsage();
    // 继续正常的表单提交
  };

  const examples = [
    "你总是玩手机不回我消息，真的很烦人！",
    "你这个人怎么这么不靠谱，答应的事情都不做！",
    "每次开会你都迟到，一点时间观念都没有！",
    "你从来不帮忙做家务，太自私了！",
  ];

  return (
    <UsageLimitGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950 pb-safe">
        {/* 顶部标题区域 */}
        <div className="px-6 pt-12 pb-8 text-center">
          <div className="animate-fade-in">
            <div className="mb-4">
              <div className="text-6xl mb-4">🐱</div>
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
                倾听小猫
              </h1>
            </div>
            <p className="text-lg md:text-xl text-gray-600 max-w-md mx-auto leading-relaxed">
              我是你的温暖沟通助手
              <br />
              帮你把不舒服的话变成暖心的表达 💕
            </p>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="px-6 max-w-lg mx-auto">
          <Form
            method="get"
            action="/process"
            className="space-y-6"
            onSubmit={handleSubmit}
          >
            {/* 输入卡片 */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 animate-slide-up">
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
                  跟小猫说说心里话吧 🐾
                </h2>
                <p className="text-gray-600 text-base md:text-lg">
                  不用担心说得不好听，我会帮你变得温暖哦~
                </p>
              </div>

              <div className="relative">
                <textarea
                  id="originalText"
                  name="originalText"
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder="例如：你总是玩手机不回我消息，真的很烦人！"
                  className="w-full p-4 text-base md:text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none resize-none h-32 md:h-36 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 transition-all duration-300 focus:shadow-lg focus:scale-[1.02]"
                  rows={4}
                  required
                />
                <div className="absolute bottom-3 right-4 text-sm text-gray-400 dark:text-gray-500">
                  {originalText.length}/500
                </div>
              </div>
            </div>

            {/* 示例卡片 */}
            <div
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                💡 试试这些例子吧
              </h3>
              <div className="grid gap-3">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setOriginalText(example)}
                    className="text-left p-3 md:p-4 bg-gray-50/50 hover:bg-blue-50 rounded-xl transition-all duration-300 text-gray-700 hover:text-blue-700 transform hover:scale-[1.02] hover:shadow-md"
                  >
                    <span className="text-sm md:text-base">{example}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* NVC 步骤预览卡片 */}
            <div
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-6">
                🐱 小猫的暖心四步法
              </h3>
              <div className="space-y-4">
                {[
                  {
                    num: 1,
                    title: "看看发生了什么",
                    desc: "客观地描述事情经过",
                    color: "bg-green-500",
                  },
                  {
                    num: 2,
                    title: "说说心里感受",
                    desc: "表达你真实的情绪",
                    color: "bg-orange-500",
                  },
                  {
                    num: 3,
                    title: "找找内心需要",
                    desc: "挖掘你真正想要的",
                    color: "bg-purple-500",
                  },
                  {
                    num: 4,
                    title: "提出温暖请求",
                    desc: "说出具体可行的期待",
                    color: "bg-blue-500",
                  },
                ].map((step, index) => (
                  <div
                    key={step.num}
                    className="flex items-center animate-fade-in"
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl ${step.color} text-white text-base md:text-lg font-bold flex items-center justify-center mr-3 md:mr-4 shadow-lg`}
                    >
                      {step.num}
                    </div>
                    <div>
                      <div className="text-base md:text-lg font-semibold text-gray-900">
                        {step.title}
                      </div>
                      <div className="text-sm md:text-base text-gray-600">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={
                !originalText.trim() || navigation.state === "submitting"
              }
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg md:text-xl font-semibold rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:scale-100 disabled:shadow-none animate-slide-up"
              style={{ animationDelay: "0.4s" }}
            >
              {navigation.state === "submitting" ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  小猫正在思考中...
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  🐱 让小猫帮你说话
                </span>
              )}
            </button>
          </Form>
        </div>

        {/* 底部留白 */}
        <div className="h-12"></div>

        {/* 添加自定义动画样式 */}
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
          }
          .animate-slide-up {
            animation: slide-up 0.6s ease-out forwards;
            opacity: 0;
          }
        `,
          }}
        />
      </div>
    </UsageLimitGuard>
  );
}
