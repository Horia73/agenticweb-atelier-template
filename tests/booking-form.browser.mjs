import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseUrl = process.env.BOOKING_TEST_URL ?? "http://127.0.0.1:3210";
const expectedUrl = `${baseUrl}/?verify=booking%20test`;
const leadEndpoint = "https://os.agenticweb.ro/api/embed/v1/lead";
const debuggingPort = 9333;
const profile = await mkdtemp(join(tmpdir(), "studio-ceramic-booking-"));
const chromium = spawn(
  process.env.CHROMIUM_PATH ?? "chromium",
  [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--single-process",
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function connectToBrowser() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debuggingPort}/json/new`, { method: "PUT" });
      if (response.ok) return response.json();
    } catch {}
    await delay(100);
  }
  throw new Error("Chromium nu a pornit pentru testul formularului.");
}

try {
  const target = await connectToBrowser();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  const leadRequests = [];
  let commandId = 0;

  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      pending.get(message.id)?.(message);
      pending.delete(message.id);
    } else if (message.method === "Fetch.requestPaused") {
      const request = message.params.request;
      if (request.method === "POST") {
        leadRequests.push({ url: request.url, method: request.method, postData: request.postData });
      }
      const isPreflight = request.method === "OPTIONS";
      void send("Fetch.fulfillRequest", {
        requestId: message.params.requestId,
        responseCode: isPreflight ? 204 : 201,
        responseHeaders: [
          { name: "Access-Control-Allow-Origin", value: baseUrl },
          { name: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
          { name: "Access-Control-Allow-Headers", value: "Content-Type" },
          { name: "Content-Type", value: "application/json" },
        ],
        ...(!isPreflight ? { body: btoa(JSON.stringify({ ok: true })) } : {}),
      });
    }
  });
  await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));

  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++commandId;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: leadEndpoint, requestStage: "Request" }] });
  await send("Page.navigate", { url: expectedUrl });

  let ready = false;
  for (let attempt = 0; attempt < 50 && !ready; attempt += 1) {
    await delay(100);
    const probe = await send("Runtime.evaluate", {
      expression: "document.querySelector('[data-booking-form=agenticweb-lead]')?.dataset.hydrated === 'true'",
      returnByValue: true,
    });
    ready = probe.result.result.value === true;
  }
  if (!ready) throw new Error("Formularul montat de page.tsx nu a devenit disponibil.");

  const evaluation = await send("Runtime.evaluate", {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const before = location.href;
      const form = document.querySelector('[data-booking-form=agenticweb-lead]');
      form.querySelector('#name').value = 'Nume Test';
      form.querySelector('#email').value = 'test@example.com';
      form.querySelector('#message').value = 'Mesaj de test';
      form.querySelector('#session').selectedIndex = 1;
      form.requestSubmit();
      for (let attempt = 0; attempt < 30 && !document.querySelector('#rezervare [role=status]'); attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return {
        before,
        after: location.href,
        status: document.querySelector('#rezervare [role=status]')?.textContent?.trim() ?? '',
        formStillMounted: Boolean(document.querySelector('[data-booking-form=agenticweb-lead]')),
      };
    })()`,
  });
  const result = evaluation.result.result.value;

  if (result.before !== expectedUrl || result.after !== expectedUrl) {
    throw new Error(`URL-ul s-a schimbat: ${result.before} -> ${result.after}`);
  }
  if (leadRequests.length !== 1) {
    throw new Error(`Au fost interceptate ${leadRequests.length} cereri lead în loc de una.`);
  }
  const leadRequest = leadRequests[0];
  const expectedBody = {
    siteKey: "aw_d63fa8fdb1db55ee5f982b378b0231d5",
    source: "form",
    name: "Nume Test",
    email: "test@example.com",
    message: "Mesaj de test",
    page: expectedUrl,
    website: "",
    meta: { session: "Marți · 18:30" },
  };
  if (leadRequest.url !== leadEndpoint || leadRequest.method !== "POST") {
    throw new Error(`Cerere neașteptată: ${leadRequest.method} ${leadRequest.url}`);
  }
  if (JSON.stringify(JSON.parse(leadRequest.postData)) !== JSON.stringify(expectedBody)) {
    throw new Error(`Corp JSON neașteptat: ${leadRequest.postData}`);
  }
  if (!result.status || result.formStillMounted) {
    throw new Error("Confirmarea locală accesibilă nu a înlocuit formularul.");
  }

  socket.close();
  console.log("booking form: un POST AgenticWeb simulat, corp JSON corect, URL neschimbat și confirmare accesibilă");
} finally {
  chromium.kill("SIGTERM");
}
