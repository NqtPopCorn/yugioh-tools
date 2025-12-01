import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  const tools = [
    {
      title: "Card Printer",
      description:
        "In và tạo thẻ bài Yu-Gi-Oh! của riêng bạn với công cụ thiết kế chuyên nghiệp",
      path: "/card-printer",
      icon: "🎴",
      gradient: "from-purple-600 to-blue-600",
    },
    {
      title: "Multiplayer Format Link Maker",
      description: "Tạo link multiplayer format để chia sẻ và chơi với bạn bè",
      path: "/link-maker",
      icon: "🔗",
      gradient: "from-blue-600 to-cyan-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-purple-500/20 bg-black/30 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10 animate-pulse"></div>
        <div className="container mx-auto px-4 py-8 relative">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4 drop-shadow-2xl">
              Yu-Gi-Oh! TCG Tools
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto">
              Bộ công cụ hoàn chỉnh cho người chơi Yu-Gi-Oh! Trading Card Game
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-6 shadow-lg shadow-purple-500/50">
            <span className="text-6xl">⚡</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Chào mừng đến với TCG Tools
          </h2>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Khám phá các công cụ mạnh mẽ giúp bạn tạo thẻ bài, quản lý deck và
            kết nối với cộng đồng Yu-Gi-Oh!
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {tools.map((tool, index) => (
            <Link
              key={index}
              to={tool.path}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-purple-500/20 p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 hover:border-purple-500/50 backdrop-blur-sm"
            >
              {/* Background Gradient Effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              ></div>

              {/* Icon */}
              <div className="relative mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-purple-500/30">
                  <span className="text-5xl">{tool.icon}</span>
                </div>
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors duration-300">
                  {tool.title}
                </h3>
                <p className="text-gray-400 leading-relaxed mb-4">
                  {tool.description}
                </p>
                <div className="flex items-center text-purple-400 font-semibold group-hover:text-purple-300 transition-colors duration-300">
                  <span>Khám phá ngay</span>
                  <svg
                    className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Features Section */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-2xl border border-purple-500/20 p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              ✨ Tính năng nổi bật
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🎨</div>
                <h4 className="text-purple-300 font-semibold mb-2">
                  Thiết kế chuyên nghiệp
                </h4>
                <p className="text-gray-400 text-sm">
                  Giao diện đẹp mắt, dễ sử dụng
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">⚡</div>
                <h4 className="text-purple-300 font-semibold mb-2">
                  Nhanh chóng
                </h4>
                <p className="text-gray-400 text-sm">
                  Xử lý tức thì, không lag
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">💾</div>
                <h4 className="text-purple-300 font-semibold mb-2">
                  Lưu trữ dễ dàng
                </h4>
                <p className="text-gray-400 text-sm">
                  Xuất file và chia sẻ đơn giản
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 bg-black/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-gray-400">
            Made with <span className="text-red-500">❤️</span> for LowCost
            Yu-Gi-Oh! community
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
