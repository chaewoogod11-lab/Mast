import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const field = (label, value) => hasText(value) ? `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>` : '';
const list = (label, values) => Array.isArray(values) && values.length ? `<div class="resource-list"><h4>${escape(label)}</h4><ul>${values.map(value => `<li>${escape(value)}</li>`).join('')}</ul></div>` : '';

function visual(item) {
  if (!item.visual) return '';
  if (!/^assets\/[^/\\]+\.(?:png|jpe?g|svg|webp)$/i.test(item.visual.src) || !hasText(item.visual.alt)) throw new Error(`Invalid visual: ${item.id}`);
  return `<figure class="resource-visual"><img src="${escape(item.visual.src)}" alt="${escape(item.visual.alt)}">${hasText(item.visual.caption) || item.visual.fullSize ? `<figcaption>${hasText(item.visual.caption) ? `<span>${escape(item.visual.caption)}</span>` : ''}${item.visual.fullSize ? `<a href="${escape(item.visual.src)}" target="_blank" rel="noopener noreferrer" aria-label="View diagram at full size (opens in a new tab)">View diagram at full size</a>` : ''}</figcaption>` : ''}</figure>`;
}

function link(url, label) {
  if (!url) return '';
  if (!/^https:\/\//.test(url) || /youtu(?:be|\.be)|vimeo|1mlvS3pLQJiiwg_rlvIHoKMM2YbO12m32/i.test(url)) throw new Error('Resource links must be approved public recaps or case materials');
  return `<a class="res-card__link" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} <span aria-hidden="true">&rarr;</span></a>`;
}

function publicItems(items) {
  return items.filter(item => item.publication === 'public').map(item => {
    if (!/^[a-z0-9-]+$/.test(item.id) || !hasText(item.title)) throw new Error('Resource requires an id and title');
    if (['Permission required', 'Do not publish'].includes(item.publicStatus)) throw new Error(`Public approval missing: ${item.id}`);
    if (item.publicStatus === 'Summary only' && (item.visual || item.detailVisual || item.recapUrl || item.materialsUrl)) throw new Error(`Summary-only resource cannot expose original media or downloads: ${item.id}`);
    return item;
  });
}

function collaboration(item) {
  if (item.id === 'pknic') throw new Error('PKNIC remains pending written partner approval');
  return `<article class="res-card collaboration-card${item.visual || item.wordmark ? '' : ' res-card--text'}" id="${escape(item.id)}">
    ${visual(item)}${item.wordmark ? `<div class="collaboration-mark" aria-hidden="true"><span>INDUSTRY COLLABORATION</span><strong>${escape(item.wordmark)}</strong></div>` : ''}
    <div class="res-card__body"><p class="resource-meta">${escape([item.partner, item.term].filter(Boolean).join(' · '))}</p>
      <h3 class="res-card__title">${escape(item.title)}</h3>${item.summary ? `<p class="res-card__desc">${escape(item.summary)}</p>` : ''}
      <dl class="resource-facts">${field('Business challenge', item.challenge)}${field('Scope', item.scope)}${field('Outcome', item.outcome)}</dl>
      ${link(item.recapUrl, 'Read recap')}
    </div></article>`;
}

function project(item) {
  if (item.narrative) {
    return `<article class="res-card project-card curriculum-card" id="${escape(item.id)}" aria-labelledby="${escape(item.id)}-title">
      <div class="curriculum-card__intro"><p class="resource-meta">${escape(item.eyebrow || 'MAST Curriculum')}</p><h3 id="${escape(item.id)}-title">${escape(item.title)}</h3>
        <p class="curriculum-card__lead">${escape(item.lead)}</p><p class="curriculum-card__copy">${escape(item.summary)}</p></div>
      <div class="curriculum-card__community"><h4>${escape(item.narrative.heading)}</h4>${item.narrative.paragraphs.map(paragraph => `<p class="curriculum-card__copy">${escape(paragraph)}</p>`).join('')}</div>
      <ol class="curriculum-card__principles" aria-label="Our thinking principles">${item.principles.map(principle => `<li>${escape(principle)}</li>`).join('')}</ol>
    </article>`;
  }
  const facts = field('Purpose', item.purpose) + field('What we built', item.built) + field('Process / deliverable', item.deliverable) + field('Documented session', item.documentedSession) + field('Outcome', item.outcome);
  return `<article class="res-card project-card${item.featured ? ' project-card--featured' : ''}${item.visual ? '' : ' res-card--text'}" id="${escape(item.id)}">${item.featured ? '' : visual(item)}
    <div class="res-card__body">${item.term ? `<p class="resource-meta">${escape(item.term)}</p>` : ''}<h3 class="res-card__title">${escape(item.title)}</h3>
    ${item.summary ? `<p class="res-card__desc">${escape(item.summary)}</p>` : ''}
    ${facts ? `<dl class="resource-facts">${facts}</dl>` : ''}
    ${link(item.materialsUrl, 'View project materials')}${link(item.recapUrl, 'Read recap')}</div>
    ${item.featured ? visual(item) : ''}
    ${item.detailVisual ? `<details class="resource-details"><summary>Explore the test-and-learn loop</summary>${visual({ id: item.id, visual: item.detailVisual })}</details>` : ''}</article>`;
}

function caseStudy(item) {
  return `<article class="case-study${item.visual ? '' : ' case-study--text'}" id="${escape(item.id)}">
    <div class="case-study__overview"><p class="resource-meta">${escape([item.industry, item.term].filter(Boolean).join(' · '))}</p><h3>${escape(item.title)}</h3>
      <dl class="resource-facts">${field('Company', item.company)}</dl>${item.summary ? `<p class="case-study__summary">${escape(item.summary)}</p>` : ''}${visual(item)}${link(item.materialsUrl, 'View case materials')}</div>
    <div class="case-study__learning">${item.strategicQuestion ? `<p class="resource-label">STRATEGIC QUESTION</p><h4 class="case-study__question">${escape(item.strategicQuestion)}</h4>` : ''}
    ${item.studied ? `<dl class="resource-facts">${field('What we studied', item.studied)}</dl>` : ''}
    ${list('Focus areas', item.focusAreas)}${list('Frameworks', item.frameworks)}${list('Key insights', item.insights)}</div></article>`;
}

function speaker(item) {
  return `<article class="speaker-card" id="${escape(item.id)}"><p class="resource-meta">${escape(item.date)}</p><h3>${escape(item.title)}</h3><p class="speaker-card__name">${escape(item.speaker)}</p>${item.affiliation ? `<p class="speaker-card__affiliation">${escape(item.affiliation)}</p>` : ''}<p class="speaker-card__summary">${escape(item.summary)}</p></article>`;
}

export function renderResources(data) {
  const collaborations = publicItems(data.industryCollaborations);
  const projects = publicItems(data.projects);
  const cases = publicItems(data.caseStudies);
  const speakers = publicItems(data.speakerSessions);
  const ids = [...collaborations, ...projects, ...cases, ...speakers].map(item => item.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate resource id');
  return `
    <section class="res-section" id="industry-collaborations" aria-labelledby="collaborations-title">
      <div class="container"><div class="res-section__header"><p class="res-section__eyebrow">01 / WITH INDUSTRY</p><h2 class="res-section__title" id="collaborations-title">Industry Collaborations</h2><p class="res-section__desc">Applied strategic work with external organizations, connecting academic learning to real business questions.</p></div>
      ${collaborations.length ? `<div class="collaborations-grid">${collaborations.map(collaboration).join('\n')}</div>` : '<p class="resource-empty">Selected collaboration summaries will be added here.</p>'}</div>
    </section>
    <section class="res-section res-section--tint" id="projects" aria-labelledby="projects-title">
      <div class="container"><div class="res-section__header"><p class="res-section__eyebrow">02 / BUILT TOGETHER</p><h2 class="res-section__title" id="projects-title">Projects</h2><p class="res-section__desc">Member-led projects put strategic thinking into practice through shared planning and execution.</p></div>
      ${projects.length ? `<div class="res-grid projects-grid">${projects.map(project).join('\n')}</div>` : '<p class="resource-empty">Project summaries will be added as materials are prepared.</p>'}</div>
    </section>
    <section class="res-section" id="case-studies" aria-labelledby="cases-title">
      <div class="container"><div class="res-section__header"><p class="res-section__eyebrow">03 / LEARNING THROUGH CASES</p><h2 class="res-section__title" id="cases-title">Case Studies</h2><p class="res-section__desc">Student strategy analyses of company and industry questions. Recommendations, KPIs, and financial effects are proposed scenarios; they do not establish company engagements or implemented results.</p></div>
      ${cases.length ? `<div class="case-studies">${cases.map(caseStudy).join('\n')}</div>` : '<p class="resource-empty">Case studies will be added as materials are prepared.</p>'}</div>
    </section>
    <section class="speaker-archive" id="webinars" aria-labelledby="speakers-title"><div class="container"><div class="speaker-archive__header"><h2 id="speakers-title">Past Speaker Sessions</h2><p>Conversations that complement our academic work. Roles and affiliations reflect the original event materials.</p></div><div class="speaker-grid">${speakers.map(speaker).join('\n')}</div></div></section>
  `.replace(/[ \t]+$/gm, '');
}

export function updateResourcesPage() {
  const data = JSON.parse(readFileSync(resolve(root, 'content/resources.json'), 'utf8'));
  const path = resolve(root, 'resources.html');
  const page = readFileSync(path, 'utf8');
  const start = '<!-- RESOURCE CONTENT START -->';
  const end = '<!-- RESOURCE CONTENT END -->';
  if (!page.includes(start) || !page.includes(end)) throw new Error('Resource content markers missing');
  const next = page.slice(0, page.indexOf(start) + start.length) + renderResources(data) + page.slice(page.indexOf(end));
  if (next !== page) writeFileSync(path, next);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) updateResourcesPage();
