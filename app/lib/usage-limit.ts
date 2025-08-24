// 使用限制管理
const DAILY_LIMIT = 3;
const STORAGE_KEY = "nvc_daily_usage";

interface UsageRecord {
  date: string;
  count: number;
}

export function getTodayUsage(): number {
  if (typeof window === "undefined") return 0;

  const today = new Date().toDateString();
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) return 0;

  try {
    const record: UsageRecord = JSON.parse(stored);
    return record.date === today ? record.count : 0;
  } catch {
    return 0;
  }
}

export function incrementUsage(): void {
  if (typeof window === "undefined") return;

  const today = new Date().toDateString();
  const currentCount = getTodayUsage();

  const record: UsageRecord = {
    date: today,
    count: currentCount + 1,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function canUseToday(): boolean {
  return getTodayUsage() < DAILY_LIMIT;
}

export function getRemainingUsage(): number {
  return Math.max(0, DAILY_LIMIT - getTodayUsage());
}

export function resetUsage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
