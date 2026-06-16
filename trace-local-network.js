import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.stack || error.message));

  page.on('request', request => {
    const url = request.url();
    if (url.includes('firestore') || url.includes('googleapis')) {
      console.log(`REQ: ${request.method()} ${url}`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('firestore') || url.includes('googleapis')) {
      console.log(`RES: ${response.status()} ${url}`);
      try {
        const text = await response.text();
        console.log(`RES BODY (first 200 chars): ${text.substring(0, 200)}`);
      } catch (e) {
        // ストリームレスポンスなどはテキスト化をスキップ
      }
    }
  });

  page.on('requestfailed', request => {
    const url = request.url();
    if (url.includes('firestore') || url.includes('googleapis')) {
      console.log(`REQ FAILED: ${url} - ${request.failure()?.errorText}`);
    }
  });

  console.log('1. Navigating to localhost...');
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));

  console.log('2. Clicking "スタート！" button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const startBtn = buttons.find(b => b.textContent.includes('スタート！'));
    if (startBtn) startBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  console.log('3. Creating player...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const createBtn = buttons.find(b => b.textContent.includes('新規作成'));
    if (createBtn) createBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.focus('input[placeholder*="おなまえ"]');
  const testName = 'セーブテスト_' + Math.floor(Math.random() * 1000);
  await page.keyboard.type(testName);
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const makeBtn = buttons.find(b => b.textContent.trim() === 'つくる');
    if (makeBtn) makeBtn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  console.log('4. Selecting the player...');
  await page.evaluate((name) => {
    const headings = Array.from(document.querySelectorAll('h3'));
    const nameHeading = headings.find(el => el.textContent.trim() === name);
    if (nameHeading) {
      const card = nameHeading.closest('.relative');
      if (card) {
        card.click();
        console.log('Clicked player card parent for:', name);
      } else {
        nameHeading.click();
        console.log('Clicked name heading directly for:', name);
      }
    } else {
      console.log('Player card not found for:', name);
    }
  }, testName);
  await new Promise(r => setTimeout(r, 3000));

  console.log('5. Changing BGM in settings...');
  await page.evaluate(() => {
    const settingsBtn = document.querySelector('button[title="設定"], button[aria-label="設定"], .lucide-settings');
    if (settingsBtn) {
      settingsBtn.click();
      console.log('Clicked Settings button');
    } else {
      const btns = Array.from(document.querySelectorAll('button'));
      const setBtn = btns.find(b => b.innerHTML.includes('settings') || b.textContent.includes('設定'));
      if (setBtn) setBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const volumeBtn = buttons.find(b => b.textContent.includes('BGM') || b.textContent.includes('効果音'));
    if (volumeBtn) {
      volumeBtn.click();
      console.log('Clicked settings toggle');
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('とじる') || b.textContent.includes('閉じる'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Closing browser.');
  await browser.close();
})();
