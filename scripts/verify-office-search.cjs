// Browser regression check. API calls are intercepted; real team settings are never changed.
// Run with: node scripts/verify-office-search.cjs (requires Chrome and npm run dev).
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node browser check. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const origin = process.env.TEST_ORIGIN || 'http://localhost:3000';
const browserPath = process.env.BROWSER_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const tempRoot = await fs.realpath(os.tmpdir());
  const profile = await fs.mkdtemp(path.join(tempRoot, 'solomon-browser-'));
  const browser = spawn(browserPath, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-networking', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
  let browserLog = '';
  browser.stderr.on('data', (chunk) => { browserLog = (browserLog + chunk.toString()).slice(-3000); });
  let launchError;
  browser.on('error', (error) => { launchError = error; });
  let socket;
  let send;
  try {
    let port;
    for (let i = 0; i < 300; i++) {
      if (launchError) throw launchError;
      try { port = (await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; } catch { /* Browser has not written the port yet. */ }
      if (port) break;
      await pause(100);
    }
    assert.ok(port, `Headless browser must start (exit ${browser.exitCode}). ${browserLog}`);
    const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    socket = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    let sequence = 0;
    const pending = new Map();
    send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const selectedPlace = { id: 'original', name: '기존 사무실', address: '서울 기존로 1', lat: 37.5, lng: 127.0 };
    let settings = { teamName: '테스트팀', officeAddress: selectedPlace.address, officePlace: selectedPlace };
    const writes = [];
    const queries = [];
    let failSave = false;
    const errors = [];
    const fulfill = (requestId, body, status = 200) => send('Fetch.fulfillRequest', {
      requestId, responseCode: status,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }],
      body: Buffer.from(JSON.stringify(body)).toString('base64'),
    });
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const request = pending.get(message.id);
        if (!request) return;
        clearTimeout(request.timer);
        pending.delete(message.id);
        if (message.error) request.reject(new Error(message.error.message));
        else request.resolve(message.result);
        return;
      }
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
      if (message.method !== 'Fetch.requestPaused') return;
      const { requestId, request } = message.params;
      const url = new URL(request.url);
      void (async () => {
        if (url.pathname === '/api/settings') {
          if (request.method === 'PUT') {
            const input = JSON.parse(request.postData);
            writes.push(input);
            if (failSave) return fulfill(requestId, { success: false, error: '테스트 저장 실패' }, 500);
            settings = input;
          }
          return fulfill(requestId, { success: true, data: settings });
        }
        if (url.pathname === '/api/places') {
          const page = Number(url.searchParams.get('page') || 1);
          queries.push({ query: url.searchParams.get('query'), page });
          return fulfill(requestId, { success: true, data: { places: [{
            id: `place-${page}`, name: `검색 장소 ${page}`, address: `서울 검색로 ${page}`,
            lat: 37.51 + page / 100, lng: 127.01 + page / 100, category: '테스트 장소', phone: '',
          }], page, hasMore: page === 1 } });
        }
        if (url.pathname === '/api/restaurants') return fulfill(requestId, { success: true, data: [] });
        if (url.hostname === 'dapi.kakao.com') return send('Fetch.failRequest', { requestId, errorReason: 'Aborted' });
        return send('Fetch.continueRequest', { requestId });
      })().catch((error) => errors.push(error.message));
    });
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Fetch.enable', { patterns: [{ urlPattern: `${origin}/api/*` }, { urlPattern: '*://dapi.kakao.com/*' }] });
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    };
    const waitFor = async (expression, description) => {
      for (let i = 0; i < 150; i++) {
        if (await evaluate(expression)) return;
        await pause(100);
      }
      throw new Error(`Timed out waiting for ${description}`);
    };
    const click = (text) => evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === ${JSON.stringify(text)})?.click()`);
    await send('Page.navigate', { url: `${origin}/settings` });
    await waitFor("document.querySelector('#office-address') && !document.querySelector('fieldset').disabled", 'settings load');
    await evaluate("const field=document.querySelector('#office-address'); field.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true})); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(field,'유정식당');field.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true,data:'당'}));");
    await evaluate("document.querySelector('#office-address').dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'당'}));");
    await pause(600);
    assert.equal(queries.length, 0, 'Typing and composition must not search');
    await click('장소 검색');
    await waitFor("document.querySelector('ul[aria-label=\"장소 검색 결과\"]')?.textContent.includes('검색 장소 1')", 'results after search button');
    assert.equal(await evaluate('location.pathname'), '/settings');
    assert.equal(writes.length, 0, 'Typing must not save');
    assert.equal(queries[0].query, '유정식당');
    assert.equal(await evaluate("document.querySelector('ul[aria-label=\"장소 검색 결과\"]').getBoundingClientRect().top > document.querySelector('#office-address').getBoundingClientRect().bottom"), true);
    assert.equal(queries.length, 1, 'Search button sends one request');
    console.log('PASS: typing sends no requests; search button shows results below input');

    await click('다음');
    await waitFor("document.querySelector('ul[aria-label=\"장소 검색 결과\"]')?.textContent.includes('검색 장소 2')", 'second page');
    await click('이전');
    await waitFor("document.querySelector('ul[aria-label=\"장소 검색 결과\"]')?.textContent.includes('검색 장소 1')", 'first page');
    console.log('PASS: next and previous pages remain in settings');

    const queriesBeforeEnter = queries.length;
    await evaluate("document.querySelector('#office-address').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));");
    await pause(500);
    assert.equal(writes.length, 0, 'Enter in search must not submit settings');
    assert.equal(queries.length, queriesBeforeEnter, 'Enter in input must not search');
    await evaluate("document.querySelector('input[type=radio]').click()");
    await waitFor("document.querySelector('input[type=radio]')?.checked", 'temporary selection');
    assert.equal(writes.length, 0, 'Selection must not save');
    assert.equal(settings.officeAddress, selectedPlace.address, 'Selection must preserve persisted office');
    assert.equal(await evaluate('location.pathname'), '/settings');
    console.log('PASS: Enter sends no requests; selection is temporary');

    await send('Page.navigate', { url: `${origin}/settings` });
    await waitFor("document.querySelector('#office-address')?.value === '기존 사무실' && !document.querySelector('fieldset').disabled", 'unsaved selection discarded');
    assert.equal(writes.length, 0, 'Leaving without saving must not write');
    await evaluate("const field=document.querySelector('#office-address'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(field,'유정식당');field.dispatchEvent(new Event('input',{bubbles:true}));");
    await click('장소 검색');
    await waitFor("!!document.querySelector('input[type=radio]')", 'results after returning');
    await evaluate("document.querySelector('input[type=radio]').click()");
    await waitFor("document.querySelector('input[type=radio]')?.checked", 'new temporary selection');
    console.log('PASS: leaving without saving preserves existing office');

    failSave = true;
    await click('설정 저장');
    await waitFor("document.body.textContent.includes('테스트 저장 실패') && !document.querySelector('fieldset').disabled", 'save failure');
    assert.equal(await evaluate('location.pathname'), '/settings');
    assert.equal(await evaluate("!!document.querySelector('ul[aria-label=\"장소 검색 결과\"]')"), true);
    assert.equal(await evaluate("document.querySelector('input[type=radio]')?.checked"), true);
    assert.equal(settings.officeAddress, selectedPlace.address, 'Failed save must preserve previous office');
    failSave = false;
    await click('설정 저장');
    await waitFor("location.pathname === '/'", 'home after successful save');
    assert.equal(writes.at(-1).officePlace.id, 'place-1');
    assert.equal(writes.at(-1).officeAddress, '서울 검색로 1');
    assert.ok(Math.abs(writes.at(-1).officePlace.lat - 37.52) < 1e-9);
    assert.deepEqual(errors, []);
    console.log('PASS: save failure retains selection; only successful Save commits and goes home');
  } finally {
    if (send && socket?.readyState === WebSocket.OPEN) {
      await send('Browser.close').catch(() => {});
      socket.close();
    }
    if (browser.exitCode === null) browser.kill();
    await pause(500);
    const relative = path.relative(tempRoot, path.resolve(profile));
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'Cleanup must stay inside the temporary directory');
    await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
