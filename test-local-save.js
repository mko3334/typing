import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // ページ内のコンソール出力を取得
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.stack || error.message));

  console.log('1. Navigating to localhost...');
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));

  // 「スタート！」ボタンをクリックしてプレイヤー選択へ
  console.log('2. Clicking "スタート！" button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const startBtn = buttons.find(b => b.textContent.includes('スタート！'));
    if (startBtn) {
      startBtn.click();
    } else {
      console.log('Start button not found');
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  // プレイヤー「テストプレイヤー」を新規作成
  console.log('3. Creating player...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const createBtn = buttons.find(b => b.textContent.includes('新規作成'));
    if (createBtn) createBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.focus('input[placeholder*="おなまえ"]');
  const testName = 'テストくん_' + Math.floor(Math.random() * 1000);
  await page.keyboard.type(testName);
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const makeBtn = buttons.find(b => b.textContent.includes('つくる！'));
    if (makeBtn) makeBtn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  // プレイヤーを選択（リストの最初にあるはず）
  console.log('4. Selecting the player...');
  await page.evaluate((name) => {
    const headings = Array.from(document.querySelectorAll('h3'));
    const nameHeading = headings.find(el => el.textContent.trim() === name);
    if (nameHeading) {
      // 親のカード要素をクリック
      const card = nameHeading.closest('.relative');
      if (card) {
        card.click();
        console.log('Clicked player card parent for:', name);
      } else {
        nameHeading.click();
        console.log('Clicked name heading directly for:', name);
      }
    } else {
      console.log('Player card name heading not found for:', name);
    }
  }, testName);
  await new Promise(r => setTimeout(r, 2000));

  // 設定画面（歯車ボタン）を開いてBGMを変更する
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

  // 設定内の音量を変更（BGMトグルやスライダーをクリック）
  await page.evaluate(() => {
    // 設定項目を探して適当に変更をトリガーする
    const buttons = Array.from(document.querySelectorAll('button'));
    const volumeBtn = buttons.find(b => b.textContent.includes('BGM') || b.textContent.includes('効果音'));
    if (volumeBtn) {
      volumeBtn.click();
      console.log('Clicked a settings toggle button');
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  // 設定を閉じる
  await page.evaluate(() => {
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('とじる') || b.textContent.includes('閉じる'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // localforage の値を確認
  console.log('Checking localForage state before reload...');
  await page.evaluate(async (name) => {
    // プレイヤー一覧を取得
    const players = await window.localforage.getItem('players') || [];
    console.log('Local players array:', JSON.stringify(players));
    const target = players.find(p => p.name === name);
    if (target) {
      const data = await window.localforage.getItem('player_data_' + target.id);
      console.log('Local player_data:', JSON.stringify(data));
    } else {
      console.log('Target player not found in players array');
    }
  }, testName);

  // リロードして設定が保持されているか確認
  console.log('6. Reloading page...');
  await page.reload();
  await new Promise(r => setTimeout(r, 3000));

  // リロード後の値を確認
  console.log('Checking localForage state after reload...');
  await page.evaluate(async (name) => {
    const players = await window.localforage.getItem('players') || [];
    console.log('Post-reload players array:', JSON.stringify(players));
    const target = players.find(p => p.name === name);
    if (target) {
      const data = await window.localforage.getItem('player_data_' + target.id);
      console.log('Post-reload player_data:', JSON.stringify(data));
    }
  }, testName);

  console.log('Test completed. Closing browser...');
  await browser.close();
})();
