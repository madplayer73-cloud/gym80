const http = require("http");
const { mkdir, readFile, stat, writeFile } = require("fs/promises");
const path = require("path");

const PORT = Number(process.env.PORT || 80);
const STATIC_DIR = process.env.STATIC_DIR || "/app/public";
const DATA_DIR = process.env.DATA_DIR || "/data";
const DATA_FILE = path.join(DATA_DIR, "gym80.json");
const MAX_BODY_BYTES = 5 * 1024 * 1024;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(text);
}

function safeStaticPath(requestUrl) {
  const parsedUrl = new URL(requestUrl, "http://localhost");
  const decodedPath = decodeURIComponent(parsedUrl.pathname);
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(STATIC_DIR, normalizedPath);

  if (!filePath.startsWith(STATIC_DIR)) {
    return path.join(STATIC_DIR, "index.html");
  }

  return filePath;
}

async function serveStatic(request, response) {
  let filePath = safeStaticPath(request.url || "/");

  try {
    const fileStat = await stat(filePath);

    if (fileStat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
  } catch (error) {
    filePath = path.join(STATIC_DIR, "index.html");
  }

  try {
    const content = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const isAsset = filePath.includes(`${path.sep}assets${path.sep}`) ||
      filePath.includes(`${path.sep}_expo${path.sep}`);

    response.writeHead(200, {
      "content-type": contentTypes[extension] || "application/octet-stream",
      "cache-control": isAsset ? "public, max-age=2592000" : "no-store"
    });
    response.end(content);
  } catch (error) {
    sendText(response, 404, "Subor sa nenasiel.");
  }
}

async function readSnapshot() {
  try {
    const content = await readFile(DATA_FILE, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function writeSnapshot(snapshot) {
  await mkdir(DATA_DIR, { recursive: true });
  const nextSnapshot = {
    ...snapshot,
    updatedAt: snapshot.updatedAt || new Date().toISOString()
  };

  await writeFile(DATA_FILE, JSON.stringify(nextSnapshot, null, 2), "utf8");
  return nextSnapshot;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        reject(new Error("Data su prilis velke."));
        request.destroy();
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function handleSyncRequest(request, response) {
  if (request.url === "/sync/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.url !== "/sync/gym80") {
    sendJson(response, 404, { message: "Endpoint neexistuje." });
    return;
  }

  if (request.method === "GET") {
    const snapshot = await readSnapshot();
    sendJson(response, 200, { data: snapshot });
    return;
  }

  if (request.method === "PUT") {
    const body = await readBody(request);
    const snapshot = JSON.parse(body || "{}");
    const savedSnapshot = await writeSnapshot(snapshot);
    sendJson(response, 200, { ok: true, updatedAt: savedSnapshot.updatedAt });
    return;
  }

  sendJson(response, 405, { message: "Metoda nie je povolena." });
}

const server = http.createServer(async (request, response) => {
  try {
    if ((request.url || "").startsWith("/sync/")) {
      await handleSyncRequest(request, response);
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { message: "CasaOS server zlyhal." });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Gym80 app server bezi na porte ${PORT}`);
});
