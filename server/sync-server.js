const http = require("http");
const { mkdir, readFile, writeFile } = require("fs/promises");
const path = require("path");

const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = process.env.DATA_DIR || "/data";
const DATA_FILE = path.join(DATA_DIR, "gym80.json");
const MAX_BODY_BYTES = 5 * 1024 * 1024;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
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

const server = http.createServer(async (request, response) => {
  try {
    if (request.url === "/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.url !== "/gym80") {
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
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { message: "CasaOS zaloha zlyhala." });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Gym80 sync server bezi na porte ${PORT}`);
});
