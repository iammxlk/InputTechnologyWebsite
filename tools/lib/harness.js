/**
 * tools/lib/harness.js
 * เซิร์ฟเวอร์ไฟล์นิ่ง + Chrome headless ผ่าน DevTools Protocol (ไม่ต้องติดตั้งแพ็กเกจเพิ่ม)
 * ทุกการทดสอบรันในโหมด sandbox: ปิด GAS_WEB_APP_URL และบล็อก script.google.com
 * จึงไม่มีข้อมูลทดสอบไปถึง Google Sheets จริง
 */
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].filter(Boolean);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8"
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startServer() {
  const notFound = [];
  const server = http.createServer((req, res) => {
    const clean = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(ROOT, clean === "/" ? "index.html" : clean);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        notFound.push(clean);
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      res.end(buf);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, notFound }));
  });
}

const SANDBOX_SCRIPT = `
(() => {
  let cfg;
  Object.defineProperty(window, "APP_CONFIG", {
    configurable: true,
    get() { return cfg; },
    set(v) { if (v) v.GAS_WEB_APP_URL = ""; cfg = v; }
  });
})();
`;

async function launch(options = {}) {
  const chromePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
  if (!chromePath) throw new Error("ไม่พบ Chrome/Edge กำหนด CHROME_PATH ได้");

  const { server, port, notFound } = await startServer();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cai-harness-"));
  const width = options.width || 1440;
  const height = options.height || 900;

  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${userDataDir}`,
      `--window-size=${width},${height}`,
      "--hide-scrollbars",
      "--mute-audio",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "about:blank"
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );

  const debugPort = await new Promise((resolve, reject) => {
    let buf = "";
    const timer = setTimeout(() => reject(new Error("Chrome ไม่เปิดพอร์ต debug")), 15000);
    chrome.stderr.on("data", (d) => {
      buf += d.toString();
      const m = buf.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
      if (m) {
        clearTimeout(timer);
        resolve(Number(m[1]));
      }
    });
  });

  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
  const target = targets.find((t) => t.type === "page");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let seq = 1;
  const pending = new Map();
  const errors = [];
  const failedRequests = [];

  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.method === "Runtime.exceptionThrown") {
      const d = m.params.exceptionDetails;
      errors.push(`exception: ${(d.exception && d.exception.description) || d.text}`);
    } else if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
      errors.push("console.error: " + m.params.args.map((a) => a.value || a.description || "").join(" "));
    } else if (m.method === "Log.entryAdded" && m.params.entry.level === "error") {
      const en = m.params.entry;
      if (!/ERR_BLOCKED_BY_CLIENT/.test(en.text)) errors.push(`log: ${en.text} ${en.url || ""}`);
    } else if (m.method === "Network.responseReceived" && m.params.response.status >= 400) {
      failedRequests.push(`${m.params.response.status} ${m.params.response.url}`);
    }
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) p.reject(new Error(m.error.message));
      else p.resolve(m.result);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = seq++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Network.enable");
  await send("DOM.enable");
  await send("Network.setBlockedURLs", { urls: ["*script.google.com*", "*script.googleusercontent.com*"] });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: SANDBOX_SCRIPT });

  const page = {
    baseUrl: `http://127.0.0.1:${port}`,
    errors,
    failedRequests,
    notFound,
    send,

    async setViewport(w, h, mobile = false) {
      await send("Emulation.setDeviceMetricsOverride", {
        width: w,
        height: h,
        deviceScaleFactor: 1,
        mobile
      });
    },

    async emulateMedia(features) {
      await send("Emulation.setEmulatedMedia", {
        features: Object.entries(features).map(([name, value]) => ({ name, value }))
      });
    },

    async goto(pathname = "/index.html", waitMs = 1200) {
      await send("Page.navigate", { url: `http://127.0.0.1:${port}${pathname}` });
      await sleep(waitMs);
    },

    async eval(expression) {
      const res = await send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
        userGesture: true
      });
      if (res.exceptionDetails) {
        const d = res.exceptionDetails;
        throw new Error((d.exception && d.exception.description) || d.text);
      }
      return res.result.value;
    },

    async setFiles(selector, files) {
      const doc = await send("DOM.getDocument", { depth: 0 });
      const node = await send("DOM.querySelector", { nodeId: doc.root.nodeId, selector });
      await send("DOM.setFileInputFiles", { nodeId: node.nodeId, files });
    },

    async screenshot(file, fullPage = false) {
      const params = { format: "png" };
      if (fullPage) {
        const m = await send("Page.getLayoutMetrics");
        const size = m.cssContentSize || m.contentSize;
        params.clip = { x: 0, y: 0, width: size.width, height: Math.min(size.height, 12000), scale: 1 };
        params.captureBeyondViewport = true;
      }
      const shot = await send("Page.captureScreenshot", params);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
    },

    async close() {
      try {
        ws.close();
      } catch (e) {}
      chrome.kill();
      server.close();
      await sleep(300);
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch (e) {}
    }
  };

  await page.setViewport(width, height, Boolean(options.mobile));
  return page;
}

module.exports = { launch, sleep, ROOT };
