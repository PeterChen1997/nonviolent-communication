# NVC 非暴力沟通转换器

这是一个基于 Remix 框架开发的非暴力沟通转换应用，帮助用户将日常表达转换为温和而有效的 NVC 四步骤沟通方式。

## 功能特性

- 📱 **Mobile-first 设计**：专为移动设备优化的用户界面
- 🔄 **智能转换**：将任意表达转换为 NVC 四步骤（观察、感受、需要、请求）
- 🤖 **AI 驱动**：集成 OpenAI GPT-4 模型，提供专业的转换和改进建议
- 📊 **数据持久化**：使用 PostgreSQL 数据库存储转换记录
- 🔗 **URL 分享**：支持通过 URL 查询参数直接转换
- 📈 **评分系统**：AI 评分和个性化改进建议

## 技术栈

- **框架**：Remix (React Router)
- **数据库**：PostgreSQL
- **AI 服务**：OpenAI GPT-4
- **样式**：Tailwind CSS
- **类型**：TypeScript

## 环境配置

1. 复制环境变量文件：
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. 配置环境变量：
   \`\`\`env
   # PostgreSQL 数据库连接
   DATABASE_URL=postgresql://username:password@localhost:5432/nvc_db
   
   # OpenAI API 配置
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_API_ENDPOINT=https://api.openai.com/v1
   \`\`\`

## 安装和运行

1. 安装依赖：
   \`\`\`bash
   npm install
   \`\`\`

2. 确保 PostgreSQL 数据库运行，应用会自动创建所需的表结构

3. 开发模式运行：
   \`\`\`bash
   npm run dev
   \`\`\`

4. 生产环境构建：
   \`\`\`bash
   npm run build
   npm start
   \`\`\`

## 页面结构

### 首页 (\`/\`)
- 原始表达输入框
- 参考示例展示
- NVC 四步骤说明
- 一键转换功能

### 处理页面 (\`/process\`)
- 显示 AI 转换进度
- 自动重定向到结果页

### 结果页面 (\`/result/:id\`)
- 显示原始表达内容
- NVC 四步骤转换结果
- AI 分析结果和评分
- 个性化改进建议
- 分享功能

### URL 查询支持 (\`/nvc\`)
支持通过 URL 参数直接转换表达：
\`\`\`
/nvc?text=你总是玩手机不回我消息，真的很烦人！
# 或
/nvc?originalText=你总是玩手机不回我消息，真的很烦人！
\`\`\`

## 数据库架构

\`\`\`sql
CREATE TABLE nvc_sessions (
  id SERIAL PRIMARY KEY,
  original_text TEXT NOT NULL,
  observation TEXT NOT NULL,
  feeling TEXT NOT NULL,
  need TEXT NOT NULL,
  request TEXT NOT NULL,
  ai_feedback JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## 开发说明

- 数据库连接池在应用启动时自动初始化
- AI 转换功能将原始表达分解为 NVC 四步骤
- AI 分析结果包含转换内容、改进建议和评分（1-10分）
- 支持移动端分享功能
- 所有服务端代码包含错误处理和重试机制
- URL 查询支持 `text` 和 `originalText` 两种参数名

## 许可证

MIT License