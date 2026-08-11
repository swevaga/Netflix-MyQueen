const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/brave.com/brave/brave',
    args: ['--no-sandbox'],
    headless: true,
  });

  const results = [];
  const ok = (name, pass, extra = '') => {
    results.push({ name, pass, extra });
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
  };

  // Desktop viewport
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => { if (!r.url().includes('fonts.g')) errors.push('reqfail: ' + r.url()); });

  // ---- index.html desktop ----
  await page.goto('http://127.0.0.1:8000/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const heroDesktop = await page.evaluate(() => {
    const img = document.getElementById('heroImg');
    return { src: img.src, w: img.naturalWidth, h: img.naturalHeight };
  });
  const isLandscape = heroDesktop.w > heroDesktop.h;
  ok('index hero desktop is 16:9 landscape', isLandscape, heroDesktop.src.split('/').pop() + ` ${heroDesktop.w}x${heroDesktop.h}`);

  const gallery = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#imageGrid img.active'));
    const all = imgs.map((i) => ({ src: i.src.split('/').pop(), loaded: i.naturalWidth > 0 }));
    return { count: all.length, broken: all.filter((x) => !x.loaded).map((x) => x.src), files: all.map((x) => x.src) };
  });
  ok('index gallery shows 12 cards', gallery.count === 12, gallery.count + ' cards');
  ok('index gallery no broken images', gallery.broken.length === 0, gallery.broken.join(',') || 'all loaded');
  ok('index gallery includes new photos (56-83)', gallery.files.some((f) => /placeholder(5[6-9]|6[0-9]|7[0-9]|8[0-3])\.png/.test(f)), gallery.files.join(','));

  // Music island title
  const musicTitle = await page.evaluate(() => document.getElementById('musicIslandTrack').textContent);
  ok('music island shows real song title', musicTitle.includes('Aku Yang Jatuh Cinta'), musicTitle);

  // ---- mobile viewport ----
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1500);
  const heroMobile = await page.evaluate(() => {
    const img = document.getElementById('heroImg');
    return { src: img.src, w: img.naturalWidth, h: img.naturalHeight };
  });
  const isPortrait = heroMobile.h > heroMobile.w;
  ok('index hero mobile is 9:16 portrait', isPortrait, heroMobile.src.split('/').pop() + ` ${heroMobile.w}x${heroMobile.h}`);

  // ---- movies.html ----
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:8000/movies.html', { waitUntil: 'networkidle' });
  const movies = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button[aria-label^="Putar video"]'));
    const imgs = Array.from(document.querySelectorAll('#moviesSection img')).map((i) => ({
      src: i.src.split('/').pop(),
      loaded: i.naturalWidth > 0,
    }));
    return { count: btns.length, broken: imgs.filter((x) => !x.loaded).map((x) => x.src) };
  });
  ok('movies has 59 cards', movies.count === 59, movies.count + ' cards');
  ok('movies posters all load', movies.broken.length === 0, movies.broken.join(',') || 'all loaded');

  // Open video59 modal
  await page.click('button[aria-label="Putar video 59"]');
  await page.waitForTimeout(800);
  const modal59 = await page.evaluate(() => {
    const m = document.getElementById('video59');
    const v = document.getElementById('video59-player');
    const src = v ? v.querySelector('source').src : '';
    return { display: m.style.display, src, poster: v ? v.getAttribute('poster') : '' };
  });
  ok('video59 modal opens with video26-59 source', modal59.display === 'block' && modal59.src.includes('video59.mp4'), modal59.src);
  await page.keyboard.press('Escape');

  // ---- newsandpopular.html ----
  await page.goto('http://127.0.0.1:8000/newsandpopular.html', { waitUntil: 'networkidle' });
  const news = await page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('#newsList article'));
    return {
      count: articles.length,
      videos: Array.from(document.querySelectorAll('#newsList video')).length,
      firstHasVideo: !!articles[0] && !!articles[0].querySelector('video'),
      texts: articles.map((a) => a.querySelector('h3') ? a.querySelector('h3').textContent : ''),
    };
  });
  ok('news renders items', news.count === 3, news.count + ' items: ' + news.texts.join(' | '));
  ok('news first item has video', news.firstHasVideo, news.videos + ' videos total');
  ok('news has text-only items (video optional)', news.videos === 1 && news.count === 3, news.videos + ' videos among ' + news.count + ' items');

  const newsHeroMobile = await page.evaluate(() => {
    const img = document.querySelector('#heroSliderImg');
    return { src: img ? img.src : '', w: img ? img.naturalWidth : 0, h: img ? img.naturalHeight : 0 };
  });
  // mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  const newsHeroMobile2 = await page.evaluate(() => {
    const img = document.querySelector('#heroSliderImg');
    return { src: img ? img.src.split('/').pop() : '', w: img ? img.naturalWidth : 0, h: img ? img.naturalHeight : 0 };
  });
  ok('news hero mobile is 9:16 portrait', newsHeroMobile2.h > newsHeroMobile2.w, newsHeroMobile2.src + ` ${newsHeroMobile2.w}x${newsHeroMobile2.h}`);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1000);
  const newsHeroDesktop = await page.evaluate(() => {
    const img = document.querySelector('#heroSliderImg');
    return { src: img ? img.src.split('/').pop() : '', w: img ? img.naturalWidth : 0, h: img ? img.naturalHeight : 0 };
  });
  ok('news hero desktop is 16:9 landscape', newsHeroDesktop.w > newsHeroDesktop.h, newsHeroDesktop.src + ` ${newsHeroDesktop.w}x${newsHeroDesktop.h}`);

  // ---- series.html mapping ----
  await page.goto('http://127.0.0.1:8000/series.html', { waitUntil: 'networkidle' });
  const seriesMap = await page.evaluate(() => {
    const f = window.getSeriesVideoSrc ? getSeriesVideoSrc : null;
    return {
      v55: f ? f('src/images/seriespage/placeholder55.png') : null,
      v59: f ? f('src/images/seriespage/placeholder59.png') : null,
      pt14: f ? f('src/images/seriespage/placeholder16_9pt14.png') : null,
    };
  });
  ok('series video pool maps to 59 videos', seriesMap.v59 === 'src/videos/moviespage/video59.mp4', JSON.stringify(seriesMap));

  // ---- mylist.html ----
  await page.goto('http://127.0.0.1:8000/mylist.html', { waitUntil: 'networkidle' });
  const mylist = await page.evaluate(() => {
    const img = document.querySelector('#heroSliderImg');
    return { src: img ? img.src.split('/').pop() : '', w: img ? img.naturalWidth : 0, h: img ? img.naturalHeight : 0 };
  });
  ok('mylist hero desktop is 16:9 landscape', mylist.w > mylist.h, mylist.src + ` ${mylist.w}x${mylist.h}`);

  // Console errors across pages (filtered to real issues)
  const realErrors = errors.filter((e) => !e.includes('net::ERR_ABORTED') && !e.includes('favicon'));
  ok('no console/page errors across pages', realErrors.length === 0, realErrors.slice(0, 5).join(' || '));

  const failed = results.filter((r) => !r.pass);
  console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})();
