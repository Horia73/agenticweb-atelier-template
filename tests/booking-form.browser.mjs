import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseUrl = process.env.BOOKING_TEST_URL ?? "http://127.0.0.1:3210";
const expectedUrl = `${baseUrl}/?verify=booking%20test`;
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
  const requests = [];
  let commandId = 0;

  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      pending.get(message.id)?.(message);
      pending.delete(message.id);
    } else if (message.method === "Network.requestWillBeSent") {
      requests.push(message.params.request.url);
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
  await send("Page.navigate", { url: expectedUrl });

  let ready = false;
  for (let attempt = 0; attempt < 50 && !ready; attempt += 1) {
    await delay(100);
    const probe = await send("Runtime.evaluate", {
      expression: "document.querySelector('[data-booking-form=local-demo]')?.dataset.hydrated === 'true'",
      returnByValue: true,
    });
    ready = probe.result.result.value === true;
  }
  if (!ready) throw new Error("Formularul montat de page.tsx nu a devenit disponibil.");

  const requestsBeforeSubmit = requests.length;
  const evaluation = await send("Runtime.evaluate", {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const before = location.href;
      const form = document.querySelector('[data-booking-form=local-demo]');
      form.querySelector('#name').value = 'Nume Test';
      form.querySelector('#email').value = 'test@example.com';
      form.querySelector('#session').selectedIndex = 1;
      form.requestSubmit();
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        before,
        after: location.href,
        status: document.querySelector('#rezervare [role=status]')?.textContent?.trim() ?? '',
        formStillMounted: Boolean(document.querySelector('[data-booking-form=local-demo]')),
      };
    })()`,
  });
  const result = evaluation.result.result.value;
  const submitRequests = requests.slice(requestsBeforeSubmit);

  if (result.before !== expectedUrl || result.after !== expectedUrl) {
    throw new Error(`URL-ul s-a schimbat: ${result.before} -> ${result.after}`);
  }
  if (submitRequests.length !== 0) {
    throw new Error(`Submit-ul a produs cereri de rețea: ${submitRequests.join(", ")}`);
  }
  if (!result.status || result.formStillMounted) {
    throw new Error("Confirmarea locală accesibilă nu a înlocuit formularul.");
  }

  socket.close();
  console.log("booking form: URL neschimbat, zero cereri și confirmare locală accesibilă");
} finally {
  chromium.kill("SIGTERM");
}
