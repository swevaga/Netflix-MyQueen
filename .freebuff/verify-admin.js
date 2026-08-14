const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: '/home/swevaga/.cache/ms-playwright/chromium-1148/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  const url = 'file://' + path.resolve('admin.html');
  await page.goto(url);
  await page.waitForTimeout(500);

  // 1. PIN gate visible
  const pinVisible = await page.isVisible('#pinSection');
  console.log('PIN section visible:', pinVisible);

  // 2. Wrong PIN rejected
  await page.fill('#pinInput', '0000');
  await page.click('#pinForm button[type=submit]');
  await page.waitForTimeout(300);
  console.log('Wrong PIN shows error:', await page.isVisible('#pinError'));

  // 3. Correct PIN unlocks
  await page.fill('#pinInput', '1602');
  await page.click('#pinForm button[type=submit]');
  await page.waitForTimeout(500);
  console.log('Dashboard visible:', await page.isVisible('#adminSection'));
  console.log('Toast box present:', (await page.locator('#toastBox').count()) === 1);

  // 4. Series tab: add form should render upload zone, not text input for src
  await page.click('[data-tab="tabSeries"]');
  await page.click('#tabSeries .btn-red');
  await page.waitForTimeout(300);
  const seriesZones = await page.locator('#seriesForm .upload-zone').count();
  const seriesHidden = await page.locator('#seriesForm input[type=hidden]').count();
  const seriesTextInputs = await page.locator('#seriesForm input[type=text]:not(.uz-manual-input)').count();
  console.log('Series upload zones:', seriesZones, '| hidden inputs:', seriesHidden, '| leftover path text inputs:', seriesTextInputs);
  console.log('Series zone folder attr:', await page.locator('#seriesForm .upload-zone').getAttribute('data-folder'));
  console.log('Series zone kind attr:', await page.locator('#seriesForm .upload-zone').getAttribute('data-kind'));

  // 5. Movies tab: two upload zones (video + thumbnail)
  await page.click('#seriesForm .btn-gray'); // cancel
  await page.click('[data-tab="tabMovies"]');
  await page.click('#tabMovies .btn-red');
  await page.waitForTimeout(300);
  const movieZones = await page.locator('#moviesForm .upload-zone').count();
  const movieKinds = await page.locator('#moviesForm .upload-zone').evaluateAll((els) => els.map((e) => e.getAttribute('data-kind') + ':' + e.getAttribute('data-folder')));
  console.log('Movies upload zones:', movieZones, '->', JSON.stringify(movieKinds));
  console.log('Movies leftover path text inputs:', await page.locator('#moviesForm input[type=text]:not(.uz-manual-input)').count());

  // 6. News tab still uses text input for optional video (kind video preview)
  await page.click('#moviesForm .btn-gray');
  await page.click('[data-tab="tabNews"]');
  await page.click('#tabNews .btn-red');
  await page.waitForTimeout(300);
  console.log('News video field is text input with preview:', (await page.locator('#newsForm input[type=text]').count()) >= 1, '| media-preview video count:', await page.locator('#newsForm video.media-preview').count());

  // 7. Manual path toggle works on series zone
  await page.click('[data-tab="tabSeries"]');
  await page.click('#tabSeries .btn-red');
  await page.waitForTimeout(300);
  await page.click('#seriesForm .uz-manual-toggle');
  await page.waitForTimeout(200);
  const manualVisible = await page.locator('#seriesForm .uz-manual-input').isVisible();
  await page.fill('#seriesForm .uz-manual-input', 'src/images/photo/manual_test.png');
  await page.waitForTimeout(200);
  const hiddenVal = await page.locator('#seriesForm input[type=hidden]').inputValue();
  console.log('Manual toggle visible:', manualVisible, '| hidden value after manual input:', hiddenVal);

  console.log('--- ERRORS ---');
  console.log(errors.length ? errors.join('\n') : 'none');
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
