// Cross-platform launcher: starts FastAPI backend + Vite dev server, opens the browser.
import { spawn } from "node:child_process";
import { platform } from "node:os";
import { setTimeout as wait } from "node:timers/promises";

const isWin = platform() === "win32";
const url = "http://localhost:5173";

const procs = [
  {
    name: "backend",
    cmd: isWin ? "python" : "python3",
    args: ["-m", "uvicorn", "backend.python_api.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
  },
  {
    name: "frontend",
    cmd: isWin ? "npm.cmd" : "npm",
    args: ["--prefix", "frontend/app", "run", "dev", "--", "--host", "0.0.0.0"],
  },
];

const children = procs.map((p) => {
  const child = spawn(p.cmd, p.args, { stdio: "inherit", shell: false });
  child.on("exit", (code) => {
    console.log(`[${p.name}] exited with code ${code}`);
    children.forEach((c) => c.kill());
    process.exit(code ?? 0);
  });
  return child;
});

const shutdown = () => { children.forEach((c) => c.kill()); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await wait(4000);
const opener = isWin ? ["cmd", ["/c", "start", "", url]] : platform() === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
spawn(opener[0], opener[1], { stdio: "ignore", detached: true }).unref();
console.log(`\nSquad RPS launching. Open ${url} (or share http://YOUR-LAN-IP:5173 with the other player).\n`);
