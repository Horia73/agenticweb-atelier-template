import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseUrl = process.env.BOOKING_TEST_URL ?? "http://127.0.0.1:3210";
const expectedUrl = `${baseUrl}/?verify=booking%20test#fragment-test`;
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

  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++commandId;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });

  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      pending.get(message.id)?.(message);
      pending.delete(message.id);
    } else if (message.method === "Fetch.requestPaused") {
      const request = message.params.request;
      const isPreflight = request.method === "OPTIONS";
      if (!isPreflight) {
        leadRequests.push({ url: request.url, method: request.method, postData: request.postData });
      }
      const responseCode = isPreflight ? 204 : leadRequests.length === 2 ? 500 : 201;
      void send("Fetch.fulfillRequest", {
        requestId: message.params.requestId,
        responseCode,
        responseHeaders: [
          { name: "Access-Control-Allow-Origin", value: baseUrl },
          { name: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
          { name: "Access-Control-Allow-Headers", value: "Content-Type" },
          { name: "Content-Type", value: "application/json" },
        ],
        ...(!isPreflight ? { body: btoa(JSON.stringify({ ok: responseCode < 400 })) } : {}),
      });
    }
  });
  await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: leadEndpoint, requestStage: "Request" }] });

  // Browserul încarcă HTML-ul SSR fără a executa JavaScript, demonstrând gardul real pre-hidratare.
  await send("Emulation.setScriptExecutionDisabled", { value: true });
  await send("Page.navigate", { url: expectedUrl });
  await delay(500);
  const preHydration = await send("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const form = document.querySelector('[data-booking-form=agenticweb-lead]');
      const fieldset = form?.querySelector('fieldset');
      const before = location.href;
      form?.requestSubmit();
      return {
        exists: Boolean(form),
        hydrated: form?.dataset.hydrated,
        fieldsetDisabled: fieldset?.disabled,
        before,
        after: location.href,
      };
    })()`,
  });
  const guard = preHydration.result.result.value;
  if (!guard.exists || guard.hydrated !== "false" || !guard.fieldsetDisabled) {
    throw new Error(`Gardul pre-hidratare lipsește: ${JSON.stringify(guard)}`);
  }
  if (guard.before !== expectedUrl || guard.after !== expectedUrl || leadRequests.length !== 0) {
    throw new Error("Submit-ul pre-hidratare a navigat sau a inițiat o cerere lead.");
  }

  await send("Emulation.setScriptExecutionDisabled", { value: false });
  await send("Page.reload", { ignoreCache: true });
  let ready = false;
  for (let attempt = 0; attempt < 50 && !ready; attempt += 1) {
    await delay(100);
    const probe = await send("Runtime.evaluate", {
      expression: "document.querySelector('[data-booking-form=agenticweb-lead]')?.dataset.hydrated === 'true'",
      returnByValue: true,
    });
    ready = probe.result.result.value === true;
  }
  if (!ready) throw new Error("Formularul nu a devenit disponibil după hidratare.");

  const evaluation = await send("Runtime.evaluate", {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const waitFor = async (selector) => {
        for (let attempt = 0; attempt < 40 && !document.querySelector(selector); attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return document.querySelector(selector);
      };
      const fillAndSubmit = (name, email, message) => {
        const form = document.querySelector('[data-booking-form=agenticweb-lead]');
        form.querySelector('#name').value = name;
        form.querySelector('#email').value = email;
        form.querySelector('#message').value = message;
        form.querySelector('#session').selectedIndex = 1;
        form.requestSubmit();
      };

      const before = location.href;
      fillAndSubmit('Succes Direct', 'direct@example.com', 'Mesaj direct');
      const directStatus = await waitFor('#rezervare [role=status]');
      const directSuccess = Boolean(directStatus) && document.activeElement === directStatus;
      directStatus?.querySelector('button')?.click();
      await waitFor('[data-booking-form=agenticweb-lead]');

      fillAndSubmit('Retry Test', 'retry@example.com', 'Mesaj păstrat');
      const alert = await waitFor('#rezervare [role=alert]');
      const valuesPreserved =
        document.querySelector('#name')?.value === 'Retry Test' &&
        document.querySelector('#email')?.value === 'retry@example.com' &&
        document.querySelector('#message')?.value === 'Mesaj păstrat';
      const accessibleError = Boolean(alert?.textContent?.trim()) && document.activeElement === alert;
      document.querySelector('[data-booking-form=agenticweb-lead]')?.requestSubmit();
      const retryStatus = await waitFor('#rezervare [role=status]');

      return {
        before,
        after: location.href,
        directSuccess,
        accessibleError,
        valuesPreserved,
        retrySuccess: Boolean(retryStatus) && document.activeElement === retryStatus,
      };
    })()`,
  });
  const result = evaluation.result.result.value;

  if (result.before !== expectedUrl || result.after !== expectedUrl) {
    throw new Error(`URL-ul s-a schimbat: ${result.before} -> ${result.after}`);
  }
  if (!result.directSuccess || !result.accessibleError || !result.valuesPreserved || !result.retrySuccess) {
    throw new Error(`Stări formular incomplete: ${JSON.stringify(result)}`);
  }
  if (leadRequests.length !== 3) {
    throw new Error(`Au fost interceptate ${leadRequests.length} cereri lead în loc de exact trei.`);
  }

  const expectedBodies = [
    { name: "Succes Direct", email: "direct@example.com", message: "Mesaj direct" },
    { name: "Retry Test", email: "retry@example.com", message: "Mesaj păstrat" },
    { name: "Retry Test", email: "retry@example.com", message: "Mesaj păstrat" },
  ];
  leadRequests.forEach((request, index) => {
    const expectedBody = {
      key: "aw_d63fa8fdb1db55ee5f982b378b0231d5",
      source: "form",
      ...expectedBodies[index],
      page: "/",
      website: "",
      meta: { session: "Marți · 18:30" },
    };
    if (request.url !== leadEndpoint || request.method !== "POST") {
      throw new Error(`Cerere neașteptată: ${request.method} ${request.url}`);
    }
    if (JSON.stringify(JSON.parse(request.postData)) !== JSON.stringify(expectedBody)) {
      throw new Error(`Corp JSON neașteptat la încercarea ${index + 1}: ${request.postData}`);
    }
  });

  socket.close();
  console.log("booking form: gard pre-hidratare, succes direct, eroare accesibilă și retry reușit; exact 3 POST-uri simulate, pathname minimizat și URL neschimbat");
} finally {
  chromium.kill("SIGTERM");
}
