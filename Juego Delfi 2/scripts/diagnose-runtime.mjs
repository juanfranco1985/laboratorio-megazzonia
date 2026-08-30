import { createCdpClient, delay, evaluate } from '../../content-factory/src/cdp.mjs';

const cdpPort = Number(process.env.DELFI_CDP_PORT || 9230);
const targets = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((response) => response.json());
const target = targets.find((item) => item.type === 'page' && item.url?.startsWith('http://127.0.0.1:5173'));
if (!target?.webSocketDebuggerUrl) throw new Error('No se encontró la sesión de diagnóstico.');

const client = await createCdpClient(target.webSocketDebuggerUrl);
const errors = [];
const assetResponses = [];
try {
  await client.send('Runtime.enable');
  await client.send('Page.enable');
  await client.send('Network.enable');
  client.on('Runtime.exceptionThrown', ({ exceptionDetails }) => errors.push({
    type: 'exception',
    text: exceptionDetails?.exception?.description || exceptionDetails?.text || '',
  }));
  client.on('Runtime.consoleAPICalled', ({ type, args }) => {
    if (type === 'error' || type === 'warning') errors.push({ type, text: args?.map((arg) => arg.value || arg.description || '').join(' ') });
  });
  client.on('Network.loadingFailed', ({ errorText, blockedReason }) => errors.push({ type: 'network', text: errorText, blockedReason: blockedReason || '' }));
  client.on('Network.responseReceived', ({ response }) => {
    if (response?.url?.includes('/assets/runtime/')) assetResponses.push({ status: response.status, type: response.mimeType, url: response.url });
  });
  await client.send('Page.reload', { ignoreCache: true });
  await delay(8000);
  const state = await evaluate(client, `(() => {
    const canvas = document.querySelector('canvas');
    const rect = canvas?.getBoundingClientRect();
    const resources = performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/assets/runtime/'));
    return {
      title: document.title,
      readyState: document.readyState,
      gamePresent: Boolean(window.__DELFI_GAME__),
      diagnostics: window.__DELFI_DIAGNOSTICS__ || null,
      bodyText: String(document.body.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 4000),
      canvas: canvas ? { width: canvas.width, height: canvas.height, cssWidth: rect.width, cssHeight: rect.height } : null,
      assetResourceCount: resources.length,
      zeroByteResources: resources.filter((entry) => entry.transferSize === 0 && entry.decodedBodySize === 0).map((entry) => entry.name),
    };
  })()`);
  console.log(JSON.stringify({ state, errors, assetResponses: { count: assetResponses.length, failures: assetResponses.filter((item) => item.status >= 400), sample: assetResponses.slice(0, 8) } }, null, 2));
} finally {
  client.close();
}
