import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import { Form, useNavigation } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "NVC非暴力沟通转换器" },
    { name: "description", content: "将你的表达转换为非暴力沟通方式" },
  ];
};

export default function Index() {
  const [originalText, setOriginalText] = useState("");
  const navigation = useNavigation();

  const examples = [
    "你总是玩手机不回我消息，真的很烦人！",
    "你这个人怎么这么不靠谱，答应的事情都不做！",
    "每次开会你都迟到，一点时间观念都没有！",
    "你从来不帮忙做家务，太自私了！",
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部标题 */}
      <div className="bg-white shadow-sm p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          NVC 非暴力沟通转换器
        </h1>
        <p className="text-gray-600 text-sm">
          输入你想说的话，AI 将帮你转换为温和而有效的表达方式
        </p>
      </div>

      {/* 主要内容 */}
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <Form method="get" action="/process" className="space-y-6">
          {/* 输入区域 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="mb-4">
              <label
                htmlFor="originalText"
                className="block text-lg font-semibold text-gray-800 mb-2"
              >
                🗣️ 说出你想表达的话
              </label>
              <p className="text-sm text-gray-600 mb-4">
                无需顾虑，直接说出你内心真实的想法，AI 会帮你优化表达方式
              </p>
            </div>

            <textarea
              id="originalText"
              name="originalText"
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="例如：你总是玩手机不回我消息，真的很烦人！"
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none h-32 text-gray-800"
              rows={4}
              required
            />

            <div className="text-right text-sm text-gray-500 mt-2">
              {originalText.length}/500 字符
            </div>
          </div>

          {/* 示例 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💡 参考示例
            </h3>
            <div className="grid gap-3">
              {examples.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setOriginalText(example)}
                  className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* NVC 四步预览 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🔄 转换为 NVC 四步骤
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center mr-3">
                  1
                </div>
                <div>
                  <span className="font-medium text-green-700">观察</span>
                  <span className="text-gray-600 text-sm ml-2">
                    客观描述发生了什么
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center mr-3">
                  2
                </div>
                <div>
                  <span className="font-medium text-orange-700">感受</span>
                  <span className="text-gray-600 text-sm ml-2">
                    表达内心的真实感受
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-bold flex items-center justify-center mr-3">
                  3
                </div>
                <div>
                  <span className="font-medium text-purple-700">需要</span>
                  <span className="text-gray-600 text-sm ml-2">
                    探索背后的内在需求
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center mr-3">
                  4
                </div>
                <div>
                  <span className="font-medium text-blue-700">请求</span>
                  <span className="text-gray-600 text-sm ml-2">
                    提出具体可行的建议
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={!originalText.trim() || navigation.state === "submitting"}
            className="w-full py-4 px-6 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {navigation.state === "submitting" ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                AI 正在分析转换中...
              </div>
            ) : (
              "🚀 开始 NVC 转换"
            )}
          </button>
        </Form>
      </div>
    </div>
  );
}
