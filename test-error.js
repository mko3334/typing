import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  await page.goto('https://taipingu.web.app');
  await new Promise(r => setTimeout(r, 2000));
  const screenshotPath = '/Users/motoyamayuuki/.gemini/antigravity/brain/e2d837ab-6070-48fb-92a9-898e42663f1d/error_screenshot.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to', screenshotPath);

  // パスワードを入力
  await page.focus('input[type="password"]');
  await page.keyboard.type('0001');
  console.log('Typed password');
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const startButton = buttons.find(b => b.textContent.includes('はじめる！'));
    if (startButton) {
      startButton.click();
      console.log('Clicked はじめる！');
    } else {
      console.log('はじめる！ button not found');
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: screenshotPath.replace('error_screenshot', 'error_screenshot_after_start') });
  console.log('After start screenshot saved');

  // スタート！ボタンをクリックしてモーダルを開く
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const startButton = buttons.find(b => b.textContent.includes('スタート！'));
    if (startButton) {
      startButton.click();
      console.log('Clicked スタート！');
    } else {
      console.log('スタート！ button not found');
    }
  });

  // モーダルが開いた後の画面を撮影
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: screenshotPath.replace('error_screenshot', 'error_screenshot_modal') });
  console.log('Modal screenshot saved');
  await browser.close();
})();
