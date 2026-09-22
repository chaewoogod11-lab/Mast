import { test, expect } from '@playwright/test';

for (const file of ['index.html', 'about.html', 'teams.html', 'resources.html']) {
  test(`${file}: images, layout, console and navigation`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.url().startsWith('http://127.0.0.1:4173') && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(`/${file}`);
    await page.evaluate(() => document.fonts.ready);
    for (const section of await page.locator('.section').all()) {
      await section.scrollIntoViewIfNeeded();
      await expect(section).toHaveClass(/is-visible/);
      await expect(section).toHaveCSS('opacity', '1');
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => [...document.images].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src))).toEqual([]);
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(await overflow()).toBe(false);
    if (file === 'index.html') {
      expect(await page.locator('.alumni-logos').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    // Exercise every same-page destination and its scroll-spy state.
    const links = page.locator('.site-subnav a');
    for (let i = 0; i < await links.count(); i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      await link.click();
      await expect(link).toHaveAttribute('aria-current', 'location');
      const geometry = await page.evaluate(href => ({
        section: document.querySelector(href).getBoundingClientRect().top,
        headerBottom: document.querySelector('.topbar').getBoundingClientRect().bottom,
        navTop: document.querySelector('.site-subnav').getBoundingClientRect().top,
        navBottom: document.querySelector('.site-subnav').getBoundingClientRect().bottom
      }), href);
      expect(Math.abs(geometry.headerBottom - geometry.navTop)).toBeLessThan(2);
      expect(geometry.section).toBeGreaterThanOrEqual(geometry.navBottom - 1);
      expect(await overflow()).toBe(false);
    }
    const toggle = page.locator('#navToggle');
    if (await toggle.isVisible()) {
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('#navMenu')).toBeVisible();
      expect(await overflow()).toBe(false);
      await page.keyboard.press('Escape');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await toggle.click();
      await page.locator('#navMenu a[href="index.html#contact"], #navMenu a[href="#contact"]').click();
      await expect(page.locator('#contact')).toBeInViewport();
    }
    await page.goto(`/${file}`);
    await page.evaluate(() => document.fonts.ready);
    for (const section of await page.locator('.section').all()) {
      await section.scrollIntoViewIfNeeded();
      await expect(section).toHaveClass(/is-visible/);
      await expect(section).toHaveCSS('opacity', '1');
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    if (file === 'about.html') {
      const welcome = await page.getByRole('heading', { name: 'Welcome to MAST' }).boundingBox();
      expect(welcome.y).toBeLessThan(440);
    }
    await page.screenshot({ path: testInfo.outputPath(`${file}.png`), fullPage: true, animations: 'disabled' });
    expect(errors).toEqual([]);
  });
}

test('project subpath works and excluded content returns 404', async ({ page, request }) => {
  await page.goto('/Mast/resources.html');
  await expect(page.getByRole('heading', { name: 'Resources', exact: true })).toBeVisible();
  await page.locator('#navMenu a[href="teams.html"]').evaluate(link => link.click());
  await expect(page).toHaveURL(/\/Mast\/teams.html$/);
  await expect(page.locator('#executive .team-card')).toHaveCount(3);
  await expect(page.locator('.team-section--previous .team-card')).toHaveCount(7);
  for (const path of ['/assets/Pknic.jpg', '/assets/Gong%20cha.jpg', '/assets/Tim.jpg', '/assets/Choi%20Hyunjung.png', '/MAST/resources.html', '/content/resources.json', '/content/resource-visuals.json', '/SOURCE_AUDIT.json', '/RESOURCE_HANDOFF.md', '/.git/config', '/package.json']) {
    expect((await request.get(path)).status()).toBe(404);
  }
});

test('curriculum statement remains readable without slides or download links', async ({ page, request }) => {
  await page.goto('/resources.html#strategy-curriculum');
  const curriculum = page.getByRole('article', { name: 'Better Questions. Stronger Thinkers.' });
  await expect(curriculum).toBeVisible();
  await expect(curriculum.locator('img, a, details')).toHaveCount(0);
  await expect(curriculum.getByRole('heading', { name: 'Built by Members. Strengthened by Every Cohort.' })).toBeVisible();
  await expect(curriculum.getByRole('list', { name: 'Our thinking principles' }).getByRole('listitem')).toHaveCount(5);
  const finalPrinciple = curriculum.getByText('Share the reasoning.', { exact: true });
  await finalPrinciple.scrollIntoViewIfNeeded();
  await expect(finalPrinciple).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const image of ['mast-thinking-process-study-session-1-p23.png', 'strategy-test-and-learn-loop-study-session-1-p18-redacted.png']) expect((await request.get('/assets/' + image)).status()).toBe(404);
});

test('contact form remains usable without sending a message', async ({ page }) => {
  await page.goto('/index.html#contact');
  await page.getByLabel('Email', { exact: true }).fill('review@example.com');
  await page.getByLabel('Subject', { exact: true }).fill('Local validation only');
  await page.getByLabel('Message', { exact: true }).fill('This form was not submitted.');
  expect(await page.locator('.contact-form').evaluate(form => form.checkValidity())).toBe(true);
  await expect(page.locator('.contact-form')).toHaveAttribute('action', 'https://formspree.io/f/mwvngzkj');
});
