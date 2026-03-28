export interface RuntimeDeps {
  readFileText: (path: string) => Promise<string>;
  runCommandText: (command: string) => Promise<string>;
  now: () => number;
}

const defaultRuntime: RuntimeDeps = {
  readFileText: (path: string) => Bun.file(path).text(),
  runCommandText: async (command: string) => {
    const proc = Bun.spawn(["bash", "-lc", command]);
    return new Response(proc.stdout).text();
  },
  now: () => Date.now(),
};

let runtime: RuntimeDeps = defaultRuntime;

export function getRuntime(): RuntimeDeps {
  return runtime;
}

export function setRuntimeForTests(overrides: Partial<RuntimeDeps>) {
  runtime = { ...defaultRuntime, ...overrides };
}

export function resetRuntimeForTests() {
  runtime = defaultRuntime;
}
