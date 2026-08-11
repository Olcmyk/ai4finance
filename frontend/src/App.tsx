function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
          AI Personal Finance Advisor
        </h1>
        <p className="text-center text-gray-600 mb-8">
          个人财务 AI 顾问
        </p>
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">✅ 项目已成功启动</h2>
          <p className="text-gray-700 mb-4">
            恭喜！所有服务都已经正常运行：
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
            <li>✅ PostgreSQL 数据库（端口 5432）</li>
            <li>✅ Redis 缓存（端口 6379）</li>
            <li>✅ FastAPI 后端（端口 8000）</li>
            <li>✅ React 前端（端口 5173）</li>
          </ul>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📚 查看 API 文档</h3>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              http://localhost:8000/docs
            </a>
          </div>
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">🚀 下一步</h3>
            <p className="text-sm text-green-800">
              现在可以开始开发功能了：用户认证、交易管理、AI 顾问等
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
