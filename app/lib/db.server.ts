import "dotenv/config";
import pg from "pg";

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
    // 创建 NVC 复盘记录表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nvc_sessions (
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
  } catch (error) {
    console.error("数据库初始化失败:", error);
    throw error;
  }
}

// NVC 会话数据类型
export interface NVCSession {
  id?: number;
  original_text: string;
  observation: string;
  feeling: string;
  need: string;
  request: string;
  ai_feedback?: any;
  created_at?: Date;
  updated_at?: Date;
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
export async function getNVCSession(id: number) {
  const result = await pool.query("SELECT * FROM nvc_sessions WHERE id = $1", [
    id,
  ]);
  return result.rows[0] as NVCSession | undefined;
}

// 更新 NVC 会话
export async function updateNVCSession(
  id: number,
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
