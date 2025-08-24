import { useEffect, useState } from "react";
import { canUseToday, getRemainingUsage } from "~/lib/usage-limit";

interface UsageLimitGuardProps {
  children: React.ReactNode;
}

export default function UsageLimitGuard({ children }: UsageLimitGuardProps) {
  const [canUse, setCanUse] = useState(true);
  const [remaining, setRemaining] = useState(3);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 客户端检查使用限制
    const checkUsage = () => {
      const allowed = canUseToday();
      const remainingCount = getRemainingUsage();

      setCanUse(allowed);
      setRemaining(remainingCount);
      setIsLoading(false);
    };

    checkUsage();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在检查使用权限...</p>
        </div>
      </div>
    );
  }

  if (!canUse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-white/20">
          <div className="mb-6">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-500 text-4xl">😴</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              小猫今天累了 😴
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              小猫今天已经很努力地帮你聊了3次啦！
              为了保持最好的状态为大家服务，小猫需要休息一下。
              明天再来找小猫聊天吧~
            </p>

            <div className="bg-blue-50 rounded-2xl p-4 mb-6">
              <p className="text-blue-800 font-medium">🐱 小猫说</p>
              <p className="text-blue-600 text-sm mt-1">
                为了让每个人都能享受到贴心服务，小猫每天只能陪你聊3次哦~
                明天再来找小猫吧！
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => (window.location.href = "/")}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-xl font-semibold hover:from-gray-500 hover:to-gray-700 transition-all duration-300"
              >
                返回首页
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {/* 使用次数提示 */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-2 shadow-lg border border-white/20 z-50">
        <p className="text-sm text-gray-600">
          今日剩余:{" "}
          <span className="font-semibold text-blue-600">{remaining}</span> 次
        </p>
      </div>
    </>
  );
}
