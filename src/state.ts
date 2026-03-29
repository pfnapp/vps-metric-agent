import { dirname } from "node:path";
import { AlertStateStore } from "./alerts";

export async function loadState(path: string): Promise<AlertStateStore> {
  const file = Bun.file(path);
  if (!(await file.exists())) return {};

  try {
    const text = await file.text();
    if (!text.trim()) return {};
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as AlertStateStore;
  } catch (error) {
    console.warn("[state] failed to load, fallback empty", error);
    return {};
  }
}

export async function saveState(path: string, state: AlertStateStore): Promise<void> {
  const dir = dirname(path);
  await Bun.$`mkdir -p ${dir}`.quiet();

  const tmp = `${path}.tmp`;
  await Bun.write(tmp, JSON.stringify(state, null, 2));
  await Bun.$`mv ${tmp} ${path}`.quiet();
}
