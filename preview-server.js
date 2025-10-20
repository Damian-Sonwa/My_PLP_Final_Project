"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = "/workspace/build/original";
const port = parseInt(process.env.PORT || "8080", 10);
const host = "0.0.0.0";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  try {
    const u = new URL(req.url, "http://localhost");
    let pathname = decodeURIComponent(u.pathname);
    if (pathname === "/" || pathname === "") pathname = "/index.html";
    const normalized = path.posix.normalize(pathname).replace(/^(\.{2}(\/|\\|$))+/, "");
    const filePath = path.join(root, normalized);

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const type = types[ext] || "application/octet-stream";
        fs.readFile(filePath, (err2, data) => {
          if (err2) {
            send(res, 500, { "Content-Type": "text/plain; charset=utf-8" }, "Server Error");
          } else {
            res.setHeader("Content-Type", type);
            res.end(data);
          }
        });
      } else {
        // SPA fallback for non-asset routes (no file extension)
        if (!path.extname(pathname)) {
          const indexPath = path.join(root, "index.html");
          fs.readFile(indexPath, (e2, data) => {
            if (e2) send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not Found");
            else {
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              res.end(data);
            }
          });
        } else {
          send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not Found");
        }
      }
    });
  } catch (e) {
    send(res, 500, { "Content-Type": "text/plain; charset=utf-8" }, "Server Error");
  }
});

server.listen(port, host, () => {
  console.log(`Preview server listening on http://${host}:${port}`);
});
