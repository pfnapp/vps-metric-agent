import { cpuPlugin } from "./cpu.plugin";
import { ioPlugin } from "./io.plugin";
import { loadPlugin } from "./load.plugin";
import { memoryPlugin } from "./memory.plugin";
import { processPlugin } from "./process.plugin";
import { storagePlugin } from "./storage.plugin";
import { uptimePlugin } from "./uptime.plugin";

export const defaultPlugins = [
  cpuPlugin,
  memoryPlugin,
  loadPlugin,
  ioPlugin,
  storagePlugin,
  uptimePlugin,
  processPlugin,
];
