import "dotenv/config";
import pg from "pg";
import { v4 as uuidv4 } from "uuid";

const { Pool } = pg;

// 数据库连接池
let pool: pg.Pool;

declare global {
  var __db_pool: pg.Pool | undefined;
}

// 在开发环境中使用全局变量避免热重载时重复创建连接池
if (process.env.NODE_ENV === "production") {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
} else {
  if (!global.__db_pool) {
    global.__db_pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  pool = global.__db_pool;
}

export { pool };

// 数据库初始化函数
export async function initDatabase() {
  try {
    // 创建UUID扩展（如果不存在）
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 创建 NVC 复盘记录表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nvc_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        original_text TEXT NOT NULL,
        observation TEXT NOT NULL,
        feeling TEXT NOT NULL,
        need TEXT NOT NULL,
        request TEXT NOT NULL,
        ai_feedback JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建问答记录表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS qa_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id UUID NOT NULL REFERENCES nvc_sessions(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        question_count INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建更新时间触发器
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_nvc_sessions_updated_at ON nvc_sessions;
      CREATE TRIGGER update_nvc_sessions_updated_at
        BEFORE UPDATE ON nvc_sessions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log("数据库初始化完成");

    // 执行数据迁移
    await migrateExistingData();
  } catch (error) {
    console.error("数据库初始化失败:", error);
    throw error;
  }
}

// 数据迁移函数：为现有数据添加standard_response字段
export async function migrateExistingData() {
  try {
    // 查找所有没有standard_response字段的记录
    const result = await pool.query(`
      SELECT id, ai_feedback, observation, feeling, need, request, original_text 
      FROM nvc_sessions 
      WHERE ai_feedback IS NOT NULL 
      AND (ai_feedback->>'standard_response') IS NULL
    `);

    console.log(`发现 ${result.rows.length} 条需要迁移的记录`);

    for (const row of result.rows) {
      const aiFeedback = row.ai_feedback;
      const originalLength = row.original_text?.length || 50; // 获取原话的实际长度

      // 生成标准答案（基于现有的四个部分，控制长度）
      let standardResponse = `${row.observation}，这让我感到${row.feeling}，因为我需要${row.need}。${row.request}`;

      // 如果标准答案太长，进行简化
      const targetMaxLength = originalLength * 3;
      if (standardResponse.length > targetMaxLength) {
        standardResponse = `${row.observation}，我感到${row.feeling}，需要${row.need}。${row.request}`;
      }

      // 如果还是太长，进一步简化
      if (standardResponse.length > targetMaxLength) {
        standardResponse = `${row.observation}，我${row.feeling}，希望${row.request}`;
      }

      // 更新记录
      const updatedFeedback = {
        ...aiFeedback,
        standard_response: standardResponse,
      };

      await pool.query(
        `UPDATE nvc_sessions SET ai_feedback = $1 WHERE id = $2`,
        [JSON.stringify(updatedFeedback), row.id]
      );
    }

    console.log(`成功迁移 ${result.rows.length} 条记录`);
  } catch (error) {
    console.error("数据迁移失败:", error);
    // 不抛出错误，避免影响应用启动
  }
}

// NVC 会话数据类型
export interface NVCSession {
  id?: string;
  original_text: string;
  observation: string;
  feeling: string;
  need: string;
  request: string;
  ai_feedback?: any;
  created_at?: Date;
  updated_at?: Date;
}

// 问答会话数据类型
export interface QASession {
  id?: string;
  session_id: string;
  question: string;
  answer: string;
  question_count: number;
  created_at?: Date;
}

// 创建新的 NVC 会话
export async function createNVCSession(
  session: Omit<NVCSession, "id" | "created_at" | "updated_at">
) {
  const result = await pool.query(
    `INSERT INTO nvc_sessions (original_text, observation, feeling, need, request, ai_feedback)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      session.original_text,
      session.observation,
      session.feeling,
      session.need,
      session.request,
      session.ai_feedback,
    ]
  );
  return result.rows[0] as NVCSession;
}

// 根据 ID 获取 NVC 会话
export async function getNVCSession(id: string) {
  const result = await pool.query("SELECT * FROM nvc_sessions WHERE id = $1", [
    id,
  ]);
  return result.rows[0] as NVCSession | undefined;
}

// 更新 NVC 会话
export async function updateNVCSession(
  id: string,
  updates: Partial<NVCSession>
) {
  const fields = Object.keys(updates).filter((key) => key !== "id");
  const values = fields.map((field) => updates[field as keyof NVCSession]);
  const setClause = fields
    .map((field, index) => `${field} = $${index + 2}`)
    .join(", ");

  const result = await pool.query(
    `UPDATE nvc_sessions SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] as NVCSession;
}

// 获取所有 NVC 会话
export async function getAllNVCSessions() {
  const result = await pool.query(
    "SELECT * FROM nvc_sessions ORDER BY created_at DESC"
  );
  return result.rows as NVCSession[];
}

// 创建新的问答记录
export async function createQASession(
  qa: Omit<QASession, "id" | "created_at">
) {
  const result = await pool.query(
    `INSERT INTO qa_sessions (session_id, question, answer, question_count)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [qa.session_id, qa.question, qa.answer, qa.question_count]
  );
  return result.rows[0] as QASession;
}

// 获取会话的问答记录
export async function getQASessionsBySessionId(sessionId: string) {
  const result = await pool.query(
    "SELECT * FROM qa_sessions WHERE session_id = $1 ORDER BY created_at ASC",
    [sessionId]
  );
  return result.rows as QASession[];
}

// 获取会话的问答数量
export async function getQACountBySessionId(sessionId: string) {
  const result = await pool.query(
    "SELECT COUNT(*) as count FROM qa_sessions WHERE session_id = $1",
    [sessionId]
  );
  return parseInt(result.rows[0].count);
}
