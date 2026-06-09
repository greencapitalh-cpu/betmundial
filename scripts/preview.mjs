import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "out");
const port = Number(process.argv[2] || 3002);
const mime = {
  ".css": "text/css",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".webp": "image/webp",
};

createServer((req, res) => {
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  let file = normalize(join(root, pathname));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  else if (!existsSync(file) && !extname(file)) file = `${file}.html`;
  if (!existsSync(file)) return res.writeHead(404).end("Not found");
  res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(port, "0.0.0.0", () => console.log(`Preview: http://localhost:${port}`));
