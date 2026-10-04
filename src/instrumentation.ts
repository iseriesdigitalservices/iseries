/**
 * Development / sandbox convenience: if MongoDB is expected on this machine (localhost) and is not running,
 * start the local `mongod` binary automatically. Does nothing on real hosting (Atlas / remote MongoDB).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/iseries";
  if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(uri)) return;

  const { createConnection } = await import("net");
  const { existsSync, mkdirSync } = await import("fs");
  const { homedir } = await import("os");
  const { spawn } = await import("child_process");
  const port = Number(/:(\d+)\//.exec(uri)?.[1] || 27017);

  const up = () =>
    new Promise<boolean>((resolve) => {
      const s = createConnection({ host: "127.0.0.1", port }, () => (s.destroy(), resolve(true)));
      s.on("error", () => resolve(false));
      s.setTimeout(1500, () => (s.destroy(), resolve(false)));
    });

  if (await up()) return;
  const bin = `${homedir()}/mongodb/bin/mongod`;
  if (!existsSync(bin)) return;
  const dbpath = `${homedir()}/mongo-data`;
  mkdirSync(dbpath, { recursive: true });
  const child = spawn(bin, ["--dbpath", dbpath, "--bind_ip", "127.0.0.1", "--port", String(port)], { detached: true, stdio: "ignore" });
  child.unref();
}
