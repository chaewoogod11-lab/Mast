import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { parseHTML } from 'linkedom';
import { execFileSync } from 'node:child_process';
import { renderResources } from '../scripts/render-resources.mjs';

const output = resolve('dist');
const pages = ['index.html', 'about.html', 'teams.html', 'resources.html'];
const documents = Object.fromEntries(pages.map(file => [file, parseHTML(readFileSync(resolve(output, file), 'utf8')).document]));

test('every local link, image, stylesheet, script and anchor resolves with exact casing', () => {
  for (const [file, document] of Object.entries(documents)) {
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    assert.equal(new Set(ids).size, ids.length, `${file}: duplicate ids`);
    for (const element of document.querySelectorAll('[href], [src]')) {
      const value = element.getAttribute('href') ?? element.getAttribute('src');
      assert.notEqual(value, '#', `${file}: placeholder link`);
      if (/^(https?:|mailto:)/.test(value)) continue;
      assert.ok(!value.startsWith('/'), `${file}: root-relative path ${value}`);
      const [path, hash] = value.split('#');
      const target = path || file;
      const absolute = resolve(output, target);
      assert.ok(existsSync(absolute), `${file}: missing ${target}`);
      assert.ok(readdirSync(dirname(absolute)).includes(target.split('/').at(-1)), `${file}: wrong case ${target}`);
      if (hash) assert.ok(documents[target]?.getElementById(hash), `${file}: missing anchor ${value}`);
    }
  }
});

test('public payload has only approved leadership and no restricted links or files', () => {
  const document = documents['teams.html'];
  assert.deepEqual([...document.querySelectorAll('#executive .team-card')].map(card => [card.querySelector('h3').textContent, card.querySelector('.team-card__role').textContent]), [
    ['Chaewoo Cha', 'President'], ['Jay Lee', 'Vice President'], ['Sia Park', 'Director of External Relations']
  ]);
  const files = readdirSync(output, { recursive: true });
  const text = files.filter(file => /\.(html|css|js)$/.test(file)).map(file => readFileSync(resolve(output, file), 'utf8')).join('\n');
  assert.doesNotMatch(text, /mast@indiana\.edu|mast@iu\.edu|linkedin\.com\/company|youtu(?:be|\.be)|vimeo|watch recording|1mlvS3pLQJiiwg_rlvIHoKMM2YbO12m32/i);
  assert.doesNotMatch(text, /<(?:iframe|video)\b/i);
  assert.ok(!files.some(file => /pknic|\.(pdf|pptx?|docx?|mp4|webm|mov)$/i.test(file)), 'private source files excluded');
  assert.ok(!existsSync(resolve(output, 'MAST')));
  assert.equal(documents['resources.html'].querySelector('#pknic'), null);
  assert.equal(documents['resources.html'].querySelectorAll('.speaker-card').length, 3);
  for (const row of documents['resources.html'].querySelectorAll('.speaker-card')) {
    for (const selector of ['h3', '.resource-meta', '.speaker-card__name', '.speaker-card__affiliation', '.speaker-card__summary']) assert.ok(row.querySelector(selector)?.textContent.trim());
    assert.equal(row.querySelectorAll('a').length, 0);
  }
  assert.equal(readFileSync(resolve(output, 'CNAME'), 'utf8').trim(), 'iumast.com');
  assert.deepEqual([...documents['index.html'].querySelectorAll('a[href^="mailto:"]')].map(link => link.getAttribute('href')), ['mailto:chacha@iu.edu']);
});

test('department updates preserve member identities, photos and valid profile URLs', () => {
  const original = parseHTML(execFileSync('git', ['show', '7f36c90:teams.html'], { encoding: 'utf8' })).document;
  const document = documents['teams.html'];
  const identity = card => ['.team-card__name', '.team-card__role'].map(selector => card.querySelector(selector).textContent).concat(card.querySelector('img').getAttribute('src'));
  for (const id of ['curriculum', 'external', 'marketing']) {
    const before = [...original.querySelectorAll(`#${id} .team-card`)].filter(card => {
      const name = card.querySelector('.team-card__name').textContent;
      return !(id === 'external' && name === 'Jay Lee') && !(id === 'marketing' && name === 'Chaewoo Cha');
    });
    const after = [...document.querySelectorAll(`#${id} .team-card`)];
    const expected = before.map(identity).map(member => id === 'external' && member[0] === 'Sia Park' ? [member[0], 'Director', member[2]] : member);
    assert.deepEqual(after.map(identity), expected);
    assert.match(document.getElementById(id).querySelector('.team-section__eyebrow').textContent, /DEPARTMENT ROSTER/);
    before.forEach((card, index) => {
      const url = card.querySelector('a').getAttribute('href');
      if (url === '#') {
        assert.equal(after[index].querySelectorAll('a').length, 0);
        assert.ok(after[index].querySelector('.team-card__linkedin--unavailable'));
      } else assert.equal(after[index].querySelector('a').getAttribute('href'), url);
    });
  }
  assert.equal(document.querySelectorAll('a.team-card__linkedin').length, 9);
  for (const link of document.querySelectorAll('a.team-card__linkedin')) assert.match(link.getAttribute('href'), /^https:\/\/www\.linkedin\.com\/in\/[a-z0-9-]+\/$/);
});

test('founder message, original Core Values and historical events are preserved', () => {
  const original = parseHTML(execFileSync('git', ['show', '7f36c90:about.html'], { encoding: 'utf8' })).document;
  const normalize = node => node.textContent.replace(/\s+/g, ' ').trim();
  const about = documents['about.html'];
  for (const selector of ['.about-greeting__content', '.about-values__right']) assert.equal(normalize(about.querySelector(selector)), normalize(original.querySelector(selector)));
  for (const old of original.querySelectorAll('.about-history__event, .about-history__detail')) assert.ok(normalize(about.getElementById('history')).includes(normalize(old)));
  assert.deepEqual([...about.querySelectorAll('.about-history__year')].map(normalize), ['2024', '2025', '2026']);
  assert.doesNotMatch(normalize(about.getElementById('history')), /Pknic/i);
  assert.match(normalize(about.getElementById('history')), /New Leadership, Advanced Curriculum/);
});

test('research-backed resources use the correct categories and hold unapproved entries', () => {
  const resources = documents['resources.html'];
  assert.deepEqual([...resources.querySelectorAll('.site-subnav a')].map(a => a.textContent), ['Industry Collaborations', 'Projects', 'Case Studies']);
  assert.equal(resources.querySelectorAll('#industry-collaborations .res-card').length, 0);
  assert.deepEqual([...resources.querySelectorAll('#projects .project-card')].map(card => card.id), ['strategy-curriculum', 'career-webinar-series']);
  assert.deepEqual([...resources.querySelectorAll('#case-studies .case-study')].map(card => card.id), ['gong-cha-singapore', 'amazon-fulfillment', 'amc-cinema', 'alivecor-neurobit']);
  const data = JSON.parse(readFileSync('content/resources.json', 'utf8'));
  for (const item of [...data.projects, ...data.caseStudies].filter(item => item.publication === 'public')) {
    const words = item.summary.trim().split(/\s+/).length;
    assert.ok(words >= 40 && words <= 70, `${item.id}: summary length ${words}`);
    const card = resources.getElementById(item.id);
    if (item.publicStatus === 'Summary only') assert.equal(card.querySelectorAll('img, a').length, 0);
  }
  for (const card of resources.querySelectorAll('.case-study')) {
    assert.ok(card.querySelector('.case-study__summary').textContent.trim());
    assert.ok(card.textContent.includes('Key insights'));
    assert.doesNotMatch(card.querySelector('.resource-meta').textContent, /20\d\d|Unknown/);
  }
  assert.doesNotMatch(resources.body.textContent, /PKNIC|Tim Hortons|undefined|null|Permission required|RESOURCE_HANDOFF|SOURCE_AUDIT|OneDrive|[A-Z]:\\|Team 1|Ivey/i);
  assert.ok(resources.querySelector('#webinars h2').textContent.includes('Past Speaker Sessions'));
});

test('new text-only resources and verified insights render without draft or private data', () => {
  const data = JSON.parse(readFileSync('content/resources.json', 'utf8'));
  data.projects.push({ id: 'test-fixture', publication: 'public', title: 'Test fixture', purpose: 'Verify text-only rendering' });
  data.projects.push({ id: 'draft-fixture', publication: 'draft', title: 'Unapproved draft' });
  data.caseStudies.push({ id: 'case-fixture', publication: 'public', title: 'Test case fixture', insights: ['Verified test fixture insight'] });
  const document = parseHTML(renderResources(data)).document;
  assert.equal(document.querySelectorAll('#test-fixture img, #test-fixture figure').length, 0);
  assert.equal(document.querySelector('#draft-fixture'), null);
  assert.ok(document.querySelector('#case-fixture').textContent.includes('Verified test fixture insight'));
  data.projects[1].materialsUrl = 'https://example.com/uncleared.pdf';
  assert.throws(() => renderResources(data), /Summary-only resource cannot expose/);
  delete data.projects[1].materialsUrl;
  data.industryCollaborations[0].publication = 'public';
  assert.throws(() => renderResources(data), /Public approval missing/);
  delete data.industryCollaborations[0].publicStatus;
  assert.throws(() => renderResources(data), /PKNIC remains pending/);
});

test('curriculum statement replaces slides and retired public media is excluded', () => {
  const visuals = JSON.parse(readFileSync('content/resource-visuals.json', 'utf8'));
  assert.deepEqual(visuals, []);
  const curriculum = documents['resources.html'].getElementById('strategy-curriculum');
  assert.equal(curriculum.querySelectorAll('img, figure, details, a, dl').length, 0);
  assert.equal(curriculum.querySelectorAll('h3').length, 1);
  assert.equal(curriculum.querySelector('h3').textContent, 'Better Questions. Stronger Thinkers.');
  assert.equal(curriculum.querySelector('h4').textContent, 'Built by Members. Strengthened by Every Cohort.');
  assert.equal(curriculum.querySelectorAll('ol li').length, 5);
  assert.doesNotMatch(curriculum.textContent, /Fall 2026|hypothetical|undefined|null|&#x42;/);
  for (const file of ['assets/mast-thinking-process-study-session-1-p23.png', 'assets/strategy-test-and-learn-loop-study-session-1-p18-redacted.png', 'assets/Gong cha.jpg', 'assets/Tim.jpg', 'assets/Choi Hyunjung.png', 'assets/Young Jae Lee.png', 'assets/Ted, Seo.png', 'SOURCE_AUDIT.json', 'RESOURCE_HANDOFF.md', 'content/resource-visuals.json']) assert.ok(!existsSync(resolve(output, file)), file);
  const payload = readFileSync(resolve(output, 'resources.html'), 'utf8');
  assert.doesNotMatch(payload, /drive\.google|sharepoint|\.pdf|\.pptx|sourcePath|publicStatus|sha256|research-review/i);
});
