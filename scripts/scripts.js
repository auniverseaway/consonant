/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const PROJECT = 'consonant--adobecom';
const LCP_BLOCKS = ['marquee']; // add your LCP blocks to the list

/**
 * log RUM if part of the sample.
 * @param {string} checkpoint identifies the checkpoint in funnel
 * @param {Object} data additional data for RUM sample
 */
export function sampleRUM(checkpoint, data = {}) {
  try {
    window.hlx = window.hlx || {};
    if (!window.hlx.rum) {
      const usp = new URLSearchParams(window.location.search);
      const weight = (usp.get('rum') === 'on') ? 1 : 100; // with parameter, weight is 1. Defaults to 100.
      // eslint-disable-next-line no-bitwise
      const hashCode = (s) => s.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0);
      const id = `${hashCode(window.location.href)}-${new Date().getTime()}-${Math.random().toString(16).substr(2, 14)}`;
      const random = Math.random();
      const isSelected = (random * weight < 1);
      // eslint-disable-next-line object-curly-newline
      window.hlx.rum = { weight, id, random, isSelected };
    }
    const { random, weight, id } = window.hlx.rum;
    if (random && (random * weight < 1)) {
      const sendPing = () => {
        // eslint-disable-next-line object-curly-newline, max-len, no-use-before-define
        const body = JSON.stringify({ weight, id, referer: window.location.href, generation: PROJECT, checkpoint, ...data });
        const url = `https://rum.hlx3.page/.rum/${weight}`;
        // eslint-disable-next-line no-unused-expressions
        navigator.sendBeacon(url, body);
      };
      sendPing();
      // special case CWV
      if (checkpoint === 'cwv') {
        // eslint-disable-next-line import/no-unresolved
        import('./web-vitals-module-2-1-2.js').then((mod) => {
          const storeCWV = (measurement) => {
            data.cwv = {};
            data.cwv[measurement.name] = measurement.value;
            sendPing();
          };
          mod.getCLS(storeCWV);
          mod.getFID(storeCWV);
          mod.getLCP(storeCWV);
        });
      }
    }
  } catch (e) {
    // something went wrong
  }
}

/**
 * Loads a CSS file.
 * @param {string} href The path to the CSS file
 */
export function loadStyle(href, callback) {
  if (!document.querySelector(`head > link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', href);
    if (typeof callback === 'function') {
      link.onload = (e) => callback(e.type);
      link.onerror = (e) => callback(e.type);
    }
    document.head.appendChild(link);
  } else if (typeof callback === 'function') {
    callback('noop');
  }
}

/**
 * Retrieves the content of a metadata tag.
 * @param {string} name The metadata name (or property)
 * @returns {string} The metadata value
 */
export function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const $meta = document.head.querySelector(`meta[${attr}="${name}"]`);
  return $meta && $meta.content;
}

/**
 * Adds one or more URLs to the dependencies for publishing.
 * @param {string|[string]} url The URL(s) to add as dependencies
 */
export function addPublishDependencies(url) {
  const urls = Array.isArray(url) ? url : [url];
  window.hlx = window.hlx || {};
  if (window.hlx.dependencies && Array.isArray(window.hlx.dependencies)) {
    window.hlx.dependencies = window.hlx.dependencies.concat(urls);
  } else {
    window.hlx.dependencies = urls;
  }
}

/**
 * Wraps each section in an additional {@code div}.
 * @param {[Element]} $sections The sections
 */
function wrapSections(sections) {
  sections.forEach((section) => {
    if (section.childNodes.length === 0) {
      // remove empty sections
      section.remove();
    } else if (!section.id) {
      const $wrapper = document.createElement('div');
      $wrapper.className = 'section-wrapper';
      section.parentNode.appendChild($wrapper);
      $wrapper.appendChild(section);
    }
  });
}

/**
 * Decorates a block.
 * @param {Element} block The block element
 */
export function decorateBlock(block) {
  const trimDashes = (str) => str.replace(/(^\s*-)|(-\s*$)/g, '');
  const classes = Array.from(block.classList.values());
  const blockName = classes[0];
  if (!blockName) return;
  const section = block.closest('.section-wrapper');
  if (section) {
    section.classList.add(`${blockName}-container`.replace(/--/g, '-'));
  }
  const variantBlocks = blockName.split('--');
  const shortBlockName = trimDashes(variantBlocks.shift());
  const variants = variantBlocks.map((v) => trimDashes(v));
  block.classList.add(shortBlockName);
  block.classList.add(...variants);

  block.classList.add('block');
  block.setAttribute('data-block-name', shortBlockName);
  block.setAttribute('data-block-status', 'initialized');
}

/**
 * Decorates all sections in a container element.
 * @param {Element} $main The container element
 */
export function decorateSections($main) {
  wrapSections($main.querySelectorAll(':scope > div'));
  $main.querySelectorAll(':scope > div.section-wrapper').forEach((section) => {
    section.setAttribute('data-section-status', 'initialized');
  });
}

/**
 * Updates all section status in a container element.
 * @param {Element} $main The container element
 */
export function updateSectionsStatus($main) {
  const sections = [...$main.querySelectorAll(':scope > div.section-wrapper')];
  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    const status = section.getAttribute('data-section-status');
    if (status !== 'loaded') {
      const loadingBlock = section.querySelector('.block[data-block-status="initialized"], .block[data-block-status="loading"]');
      if (loadingBlock) {
        section.setAttribute('data-section-status', 'loading');
        break;
      } else {
        section.setAttribute('data-section-status', 'loaded');
      }
    }
  }
}

/**
 * Decorates all blocks in a container element.
 * @param {Element} $main The container element
 */
export function decorateBlocks($main) {
  $main
    .querySelectorAll('div.section-wrapper > div div')
    .forEach(($block) => decorateBlock($block));
}

/**
 * Builds a block DOM Element from a two dimensional array
 * @param {string} blockName name of the block
 * @param {any} content two dimensional array or string or object of content
 */
function buildBlock(blockName, content, id) {
  const table = Array.isArray(content) ? content : [[content]];
  const blockEl = document.createElement('div');
  // build image block nested div structure
  blockEl.classList.add(blockName);
  if (id) {
    if (typeof id === 'boolean') {
      blockEl.id = `${blockName}-${Math.floor(Math.random() * 100000)}`;
    } else {
      blockEl.id = id;
    }
  }
  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      const vals = col.elems ? col.elems : [col];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') {
            colEl.innerHTML += val;
          } else {
            colEl.appendChild(val);
          }
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return (blockEl);
}

/**
 * Loads JS and CSS for a block.
 * @param {Element} $block The block element
 */
export async function loadBlock(block, eager = false) {
  if (!(block.getAttribute('data-block-status') === 'loading' || block.getAttribute('data-block-status') === 'loaded')) {
    block.setAttribute('data-block-status', 'loading');
    const blockName = block.getAttribute('data-block-name');
    try {
      const cssLoaded = new Promise((resolve) => {
        loadStyle(`${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.css`, resolve);
      });
      const decorationComplete = new Promise((resolve) => {
        (async () => {
          try {
            const mod = await import(`../blocks/${blockName}/${blockName}.js`);
            if (mod.default) {
              await mod.default(block, blockName, document, eager);
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.log(`failed to load module for ${blockName}`, err);
          }
          resolve();
        })();
      });
      await Promise.all([cssLoaded, decorationComplete]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(`failed to load block ${blockName}`, err);
    }
    block.setAttribute('data-block-status', 'loaded');
  }
}

/**
 * Loads JS and CSS for all blocks in a container element.
 * @param {Element} $main The container element
 */
export async function loadBlocks($main) {
  updateSectionsStatus($main);
  const blocks = [...$main.querySelectorAll('div.block')];
  for (let i = 0; i < blocks.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await loadBlock(blocks[i]);
    updateSectionsStatus($main);
  }
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

/**
 * load LCP block and/or wait for LCP in default content.
 */
async function waitForLCP() {
  const block = document.querySelector('.block');
  const hasLCPBlock = (block && LCP_BLOCKS.includes(block.getAttribute('data-block-name')));
  if (hasLCPBlock) await loadBlock(block, true);

  document.querySelector('body').classList.add('appear');
  const lcpCandidate = document.querySelector('main img');
  await new Promise((resolve) => {
    if (lcpCandidate && !lcpCandidate.complete) {
      lcpCandidate.addEventListener('load', () => resolve());
      lcpCandidate.addEventListener('error', () => resolve());
    } else {
      resolve();
    }
  });
}

export function initHlx() {
  window.hlx = window.hlx || {};
  window.hlx.lighthouse = new URLSearchParams(window.location.search).get('lighthouse') === 'on';
  window.hlx.codeBasePath = '';

  const scriptEl = document.querySelector('script[src$="/scripts/scripts.js"]');
  if (scriptEl) {
    try {
      [window.hlx.codeBasePath] = new URL(scriptEl.src).pathname.split('/scripts/scripts.js');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }
}

initHlx();

/*
 * ------------------------------------------------------------
 * Edit above at your own risk
 * ------------------------------------------------------------
 */

sampleRUM('top');
window.addEventListener('load', () => sampleRUM('load'));
document.addEventListener('click', () => sampleRUM('click'));

export function makeRelative(anchor) {
  const { href } = anchor;
  const url = new URL(href);
  const host = url.hostname;
  if (host.endsWith(`${PROJECT}.hlx3.page`)
      || host.endsWith(`${PROJECT}.hlx.live`)) {
    const relative = `${url.pathname}${url.search}${url.hash}`;
    anchor.setAttribute('href', relative);
    return relative;
  }
  // external link
  anchor.target = '_blank';
  return href;
}

export function setSVG(anchor) {
  const { textContent } = anchor;
  const href = anchor.getAttribute('href');
  const ext = textContent.substr(textContent.lastIndexOf('.') + 1);
  if (ext !== 'svg') return;
  const img = document.createElement('img');
  img.src = textContent;
  if (textContent === href) {
    anchor.insertAdjacentElement('afterend', img);
    anchor.remove();
  } else {
    anchor.textContent = '';
    anchor.append(img);
  }
}

export function decorateAnchors(parent) {
  const anchors = parent.getElementsByTagName('a');
  return Array.from(anchors).map((anchor) => {
    makeRelative(anchor);
    setSVG(anchor);
    return anchor;
  });
}

export function loadScript(url, callback, type) {
    const script = document.createElement('script');
    script.onload = callback;
    script.setAttribute('src', url);
    if (type) { script.setAttribute('type', type); }
    document.head.append(script);
    return script;    
}

export function setTemplate() {
  const template = getMetadata('template');
  if (!template) return;
  document.body.classList.add(`${template}-template`);
}

/**
 * Clean up variant classes
 * Ex: marquee--small--contained- -> marquee small contained
 * @param {HTMLElement} parent
 */
export function cleanVariations(parent) {
  const variantBlocks = parent.querySelectorAll('[class$="-"]');
  return Array.from(variantBlocks).map((variant) => {
    const { className } = variant;
    const classNameClipped = className.slice(0, -1);
    variant.classList.remove(className);
    const classNames = classNameClipped.split('--');
    variant.classList.add(...classNames);
    return variant;
  });
}

function buildEmbeds() {
  const embeds = document.querySelectorAll('a[href^="https://www.youtube.com"], a[href^="https://gist.github.com"]');
  const caas = document.querySelectorAll('a[href^="http://cmiqueo.corp.adobe.com/chimera/index.html"]');
  if (caas) {
    import('../blocks/caas/caas.js').then((caasObject) => {
      loadStyle('https://www.adobe.com/special/chimera/latest/dist/dexter/app.min.css');
      loadStyle('../blocks/caas/caas.css');
      // loadScript('https://www.adobe.com/special/chimera/latest/dist/dexter/react.umd.js', loadreactDom);
      loadScript('https://unpkg.com/react@17.0.2/umd/react.development.js', loadreactDom);
    });
  }
}
function loadreactDom() {
  // loadScript('https://unpkg.com/react-dom@17.0.2/umd/react-dom.development.js', loadCaasApp);
  loadScript('https://unpkg.com/react-dom@17.0.2/umd/react-dom.development.js', loadCaasApp);
  // loadScript('https://www.adobe.com/special/chimera/latest/dist/dexter/react.dom.umd.js', loadCaasApp);
}
function loadCaasApp() {
  loadScript('https://www.adobe.com/special/chimera/latest/dist/dexter/app.min.js', prepCaas);
}

function prepCaas() {
  const caas = document.querySelectorAll('a[href^="http://cmiqueo.corp.adobe.com/chimera/index.html"]');
  caas.forEach((link) => {    
    link.replaceWith(buildBlock('caas', link.outerHTML, true));
  });    
  const caas2 = document.querySelectorAll('a[href^="http://cmiqueo.corp.adobe.com/chimera/index.html"]');
  caas2.forEach((link) => {    
    buildCaaS(link.closest('.caas').getAttribute('id'), link.href);
  });  
}

function buildCaaS(id, url) {

  // Get the params from URL
  const query = new URLSearchParams(url.split('?')[1]);
  const source = query.get('source');
  const cardStyle = query.get('cs');
  const containerSize = query.get('c');
  const filter = query.get('f');
  const pagination = query.get('p');
  const pagniationMethod = query.get('pt');
  const search = query.get('s');
  
  // Prep the CAAS configuration object
  const caasConfig = {
    "collection": {
        "mode": "lightest",
        "layout": {
            "type": "2up",
            "gutter": "4x",
            "container": containerSize,
        },
        "button": {
            "style": "primary"
        },
        "resultsPerPage": "8",
        "endpoint": "https://www.adobe.com/chimera-api/collection?contentSource=&originSelection="+ source +"&contentTypeTags=&collectionTags=&excludeContentWithTags=caas%3Aevents&language=en&country=us&complexQuery=&excludeIds=¤tEntityId=55214dea-5481-3515-a4b9-dbf51c378e62&featuredCards=&environment=&draft=true&size=300",
        "fallbackEndpoint": "",
        "totalCardsToShow": "300",
        "cardStyle": cardStyle,
        "showTotalResults": "false",
        "i18n": {
            "prettyDateIntervalFormat": "{ddd}, {LLL} {dd} | {timeRange} {timeZone}",
            "totalResultsText": "{total} results",
            "title": "",
            "onErrorTitle": "Sorry there was a system error.",
            "onErrorDescription": "Please try reloading the page or try coming back to the page another time."
        },
        "setCardBorders": "false",
        "useOverlayLinks": "false",
        "banner": {
            "register": {
                "description": "Sign Up",
                "url": "#registration"
            },
            "upcoming": {
                "description": "Upcoming"
            },
            "live": {
                "description": "Live"
            },
            "onDemand": {
                "description": "On Demand"
            }
        },
        "useLightText": "false",
        "disableBanners": "false",
        "reservoir": {
            "sample": "3",
            "pool": "1000"
        }
    },
    "filterPanel": {
        "enabled": filter,
        "eventFilter": "not-timed",
        "type": "left",
        "showEmptyFilters": "true",
        "filters": [
            {
                "openedOnLoad": "false",
                "id": "caas:content-type",
                "items": [
                    {
                        "label": "Application",
                        "id": "caas:content-type/application"
                    },
                    {
                        "label": "Article",
                        "id": "caas:content-type/article"
                    },
                    {
                        "label": "Blog",
                        "id": "caas:content-type/blog"
                    },
                    {
                        "label": "Certification",
                        "id": "caas:content-type/certification"
                    },
                    {
                        "label": "Consulting",
                        "id": "caas:content-type/consulting"
                    },
                    {
                        "label": "Course",
                        "id": "caas:content-type/course"
                    },
                    {
                        "label": "Customer Story",
                        "id": "caas:content-type/customer-story"
                    },
                    {
                        "label": "Demo",
                        "id": "caas:content-type/demo"
                    },
                    {
                        "label": "Document",
                        "id": "caas:content-type/document"
                    },
                    {
                        "label": "Documentation",
                        "id": "caas:content-type/documentation"
                    },
                    {
                        "label": "Event",
                        "id": "caas:content-type/event"
                    },
                    {
                        "label": "Event Session",
                        "id": "caas:content-type/event-session"
                    },
                    {
                        "label": "Event Speaker",
                        "id": "caas:content-type/event-speaker"
                    },
                    {
                        "label": "Guide",
                        "id": "caas:content-type/guide"
                    },
                    {
                        "label": "Infographic",
                        "id": "caas:content-type/infographic"
                    },
                    {
                        "label": "Partner",
                        "id": "caas:content-type/partner"
                    },
                    {
                        "label": "Podcast",
                        "id": "caas:content-type/podcast"
                    },
                    {
                        "label": "Product",
                        "id": "caas:content-type/product"
                    },
                    {
                        "label": "Product Tour",
                        "id": "caas:content-type/product-tour"
                    },
                    {
                        "label": "Promotion",
                        "id": "caas:content-type/promotion"
                    },
                    {
                        "label": "Quiz",
                        "id": "caas:content-type/quiz"
                    },
                    {
                        "label": "Report",
                        "id": "caas:content-type/report"
                    },
                    {
                        "label": "Solution",
                        "id": "caas:content-type/solution"
                    },
                    {
                        "label": "Template",
                        "id": "caas:content-type/template"
                    },
                    {
                        "label": "Tutorial",
                        "id": "caas:content-type/tutorial"
                    },
                    {
                        "label": "Video",
                        "id": "caas:content-type/video"
                    },
                    {
                        "label": "Webinar",
                        "id": "caas:content-type/webinar"
                    },
                    {
                        "label": "eBook",
                        "id": "caas:content-type/ebook"
                    }
                ],
                "group": "Content Type"
            },
            {
                "openedOnLoad": false,
                "id": "caas:business-unit",
                "items": [
                    {
                        "label": "Commerce Cloud",
                        "id": "caas:business-unit/commerce-cloud"
                    },
                    {
                        "label": "Creative Cloud",
                        "id": "caas:business-unit/creative-cloud"
                    },
                    {
                        "label": "Document Cloud",
                        "id": "caas:business-unit/document-cloud"
                    },
                    {
                        "label": "Experience Cloud",
                        "id": "caas:business-unit/experience-cloud"
                    }
                ],
                "group": "Business Unit"
            },
            {
                "openedOnLoad": false,
                "id": "caas:journey-phase",
                "items": [
                    {
                        "label": "Acceleration",
                        "id": "caas:journey-phase/acceleration"
                    },
                    {
                        "label": "Acquisition",
                        "id": "caas:journey-phase/acquisition"
                    },
                    {
                        "label": "Discover",
                        "id": "caas:journey-phase/discover"
                    },
                    {
                        "label": "Evaluate",
                        "id": "caas:journey-phase/evaluate"
                    },
                    {
                        "label": "Expansion",
                        "id": "caas:journey-phase/expansion"
                    },
                    {
                        "label": "Explore",
                        "id": "caas:journey-phase/explore"
                    },
                    {
                        "label": "Retention",
                        "id": "caas:journey-phase/retention"
                    },
                    {
                        "label": "Use Re-invest",
                        "id": "caas:journey-phase/use-re-invest"
                    }
                ],
                "group": "Journey Phase"
            },
            {
                "openedOnLoad": false,
                "id": "caas:role",
                "items": [
                    {
                        "label": "Advertising",
                        "id": "caas:role/advertising"
                    },
                    {
                        "label": "Commerce",
                        "id": "caas:role/commerce"
                    },
                    {
                        "label": "Compliance Evaluator",
                        "id": "caas:role/compliance-evaluator"
                    },
                    {
                        "label": "Decision Maker",
                        "id": "caas:role/decision-maker"
                    },
                    {
                        "label": "Digital",
                        "id": "caas:role/digital"
                    },
                    {
                        "label": "Feature Evaluator",
                        "id": "caas:role/feature-evaluator"
                    },
                    {
                        "label": "IT",
                        "id": "caas:role/it"
                    },
                    {
                        "label": "Marketing",
                        "id": "caas:role/marketing"
                    },
                    {
                        "label": "Sales",
                        "id": "caas:role/sales"
                    },
                    {
                        "label": "Vision Leader",
                        "id": "caas:role/vision-leader"
                    }
                ],
                "group": "Role"
            },
            {
                "openedOnLoad": false,
                "id": "caas:industry",
                "items": [
                    {
                        "label": "Advertising",
                        "id": "caas:industry/advertising"
                    },
                    {
                        "label": "Aviation",
                        "id": "caas:industry/aviation"
                    },
                    {
                        "label": "Education",
                        "id": "caas:industry/education"
                    },
                    {
                        "label": "Energy & Utilities",
                        "id": "caas:industry/energy-utilities"
                    },
                    {
                        "label": "Financial Services",
                        "id": "caas:industry/financial-services"
                    },
                    {
                        "label": "Food & Beverage",
                        "id": "caas:industry/food-and-beverage"
                    },
                    {
                        "label": "Government",
                        "id": "caas:industry/government"
                    },
                    {
                        "label": "Healthcare",
                        "id": "caas:industry/healthcare"
                    },
                    {
                        "label": "High Tech",
                        "id": "caas:industry/high-tech"
                    },
                    {
                        "label": "Life Sciences",
                        "id": "caas:industry/life-sciences"
                    },
                    {
                        "label": "Logistics & Transportation",
                        "id": "caas:industry/logistics-transportation"
                    },
                    {
                        "label": "Manufacturing",
                        "id": "caas:industry/manufacturing"
                    },
                    {
                        "label": "Media & Entertainment",
                        "id": "caas:industry/media-and-entertainment"
                    },
                    {
                        "label": "Non-profit",
                        "id": "caas:industry/non-profit"
                    },
                    {
                        "label": "Pharmaceuticals",
                        "id": "caas:industry/pharmaceuticals"
                    },
                    {
                        "label": "Print & Publishing",
                        "id": "caas:industry/print-publishing"
                    },
                    {
                        "label": "Professional Services",
                        "id": "caas:industry/professional-services"
                    },
                    {
                        "label": "Retail",
                        "id": "caas:industry/retail"
                    },
                    {
                        "label": "Technology Software & Services",
                        "id": "caas:industry/technology-software-services"
                    },
                    {
                        "label": "Telecommunications",
                        "id": "caas:industry/telecommunications"
                    },
                    {
                        "label": "Travel & Hospitality",
                        "id": "caas:industry/travel-and-hospitality"
                    }
                ],
                "group": "Industry"
            },
            {
                "openedOnLoad": false,
                "id": "caas:products",
                "items": [
                    {
                        "label": "Acrobat",
                        "id": "caas:products/acrobat"
                    },
                    {
                        "label": "Adobe Advertising Cloud",
                        "id": "caas:products/adobe-advertising-cloud"
                    },
                    {
                        "label": "Adobe Analytics",
                        "id": "caas:products/adobe-analytics"
                    },
                    {
                        "label": "Adobe Audience Manager",
                        "id": "caas:products/adobe-audience-manager"
                    },
                    {
                        "label": "Adobe Campaign",
                        "id": "caas:products/adobe-campaign"
                    },
                    {
                        "label": "Adobe Commerce",
                        "id": "caas:products/adobe-commerce"
                    },
                    {
                        "label": "Adobe Commerce Cloud",
                        "id": "caas:products/adobe-commerce-cloud"
                    },
                    {
                        "label": "Adobe Creative Cloud",
                        "id": "caas:products/adobe-creative-cloud"
                    },
                    {
                        "label": "Adobe Document Cloud",
                        "id": "caas:products/adobe-document-cloud"
                    },
                    {
                        "label": "Adobe Experience Cloud",
                        "id": "caas:products/adobe-experience-cloud"
                    },
                    {
                        "label": "Adobe Experience Manager",
                        "id": "caas:products/adobe-experience-manager"
                    },
                    {
                        "label": "Adobe Experience Platform",
                        "id": "caas:products/adobe-experience-platform"
                    },
                    {
                        "label": "Adobe Fonts",
                        "id": "caas:products/adobe-fonts"
                    },
                    {
                        "label": "Adobe Fresco",
                        "id": "caas:products/adobe-fresco"
                    },
                    {
                        "label": "Adobe Primetime",
                        "id": "caas:products/adobe-primetime"
                    },
                    {
                        "label": "Adobe Scan",
                        "id": "caas:products/adobe-scan"
                    },
                    {
                        "label": "Adobe Sensei",
                        "id": "caas:products/adobe-sensei"
                    },
                    {
                        "label": "Adobe Sign",
                        "id": "caas:products/adobe-sign"
                    },
                    {
                        "label": "Adobe Spark",
                        "id": "caas:products/adobe-spark"
                    },
                    {
                        "label": "Adobe Stock",
                        "id": "caas:products/adobe-stock"
                    },
                    {
                        "label": "Adobe Target",
                        "id": "caas:products/adobe-target"
                    },
                    {
                        "label": "Adobe Workfront",
                        "id": "caas:products/workfront"
                    },
                    {
                        "label": "Adobe Workfront",
                        "id": "caas:products/adobe-workfront"
                    },
                    {
                        "label": "Aero",
                        "id": "caas:products/aero"
                    },
                    {
                        "label": "After Effects",
                        "id": "caas:products/after-effects"
                    },
                    {
                        "label": "Animate",
                        "id": "caas:products/animate"
                    },
                    {
                        "label": "Audition",
                        "id": "caas:products/audition"
                    },
                    {
                        "label": "Behance",
                        "id": "caas:products/behance"
                    },
                    {
                        "label": "Bridge",
                        "id": "caas:products/bridge"
                    },
                    {
                        "label": "Capture",
                        "id": "caas:products/capture"
                    },
                    {
                        "label": "Character Animator",
                        "id": "caas:products/character-animator"
                    },
                    {
                        "label": "Creative Cloud",
                        "id": "caas:products/creative-cloud"
                    },
                    {
                        "label": "Creative Cloud Express",
                        "id": "caas:products/creative-cloud-express"
                    },
                    {
                        "label": "Creative Cloud Libraries",
                        "id": "caas:products/creative-cloud-libraries"
                    },
                    {
                        "label": "Dimension",
                        "id": "caas:products/dimension"
                    },
                    {
                        "label": "Illustrator",
                        "id": "caas:products/illustrator"
                    },
                    {
                        "label": "InDesign",
                        "id": "caas:products/indesign"
                    },
                    {
                        "label": "Lightroom",
                        "id": "caas:products/lightroom"
                    },
                    {
                        "label": "Lightroom Classic",
                        "id": "caas:products/lightroom-classic"
                    },
                    {
                        "label": "Lightroom on mobile",
                        "id": "caas:products/lightroom-on-mobile"
                    },
                    {
                        "label": "Magento Business Intelligence",
                        "id": "caas:products/magento-business-intelligence"
                    },
                    {
                        "label": "Magento Commerce",
                        "id": "caas:products/magento-commerce"
                    },
                    {
                        "label": "Magento Order Management",
                        "id": "caas:products/magento-order-management"
                    },
                    {
                        "label": "Marketo Engage & Bizible",
                        "id": "caas:products/marketo-engage-bizible"
                    },
                    {
                        "label": "Medium by Adobe",
                        "id": "caas:products/medium-by-adobe"
                    },
                    {
                        "label": "Not Product Specific",
                        "id": "caas:products/not-product-specific"
                    },
                    {
                        "label": "PDF API",
                        "id": "caas:products/pdf-api"
                    },
                    {
                        "label": "PDF SDK",
                        "id": "caas:products/pdf-sdk"
                    },
                    {
                        "label": "Photoshop",
                        "id": "caas:products/photoshop"
                    },
                    {
                        "label": "Photoshop Camera",
                        "id": "caas:products/photoshop-camera"
                    },
                    {
                        "label": "Photoshop Express",
                        "id": "caas:products/photoshop-express"
                    },
                    {
                        "label": "Portfolio",
                        "id": "caas:products/portfolio"
                    },
                    {
                        "label": "Premiere Express",
                        "id": "caas:products/premiere-express"
                    },
                    {
                        "label": "Premiere Pro",
                        "id": "caas:products/premiere-pro"
                    },
                    {
                        "label": "Premiere Rush",
                        "id": "caas:products/premiere-rush"
                    },
                    {
                        "label": "Preview",
                        "id": "caas:products/preview"
                    },
                    {
                        "label": "Reader",
                        "id": "caas:products/reader"
                    },
                    {
                        "label": "Substance",
                        "id": "caas:products/substance"
                    },
                    {
                        "label": "Substance 3D Assets",
                        "id": "caas:products/substance-3d-assets"
                    },
                    {
                        "label": "Substance 3D Designer",
                        "id": "caas:products/substance-3d-designer"
                    },
                    {
                        "label": "Substance 3D Modeler",
                        "id": "caas:products/substance-3d-modeler"
                    },
                    {
                        "label": "Substance 3D Painter",
                        "id": "caas:products/substance-3d-painter"
                    },
                    {
                        "label": "Substance 3D Sampler",
                        "id": "caas:products/substance-3d-sampler"
                    },
                    {
                        "label": "Substance 3D Stager",
                        "id": "caas:products/substance-3d-stager"
                    },
                    {
                        "label": "Substance Alchemist",
                        "id": "caas:products/substance-alchemist"
                    },
                    {
                        "label": "Substance Painter",
                        "id": "caas:products/substance-painter"
                    },
                    {
                        "label": "Substance Source",
                        "id": "caas:products/substance-source"
                    },
                    {
                        "label": "XD",
                        "id": "caas:products/xd"
                    }
                ],
                "group": "Products"
            },
            {
                "openedOnLoad": false,
                "id": "caas:product-categories",
                "items": [
                    {
                        "label": "3D and AR",
                        "id": "caas:product-categories/3d-and-ar"
                    },
                    {
                        "label": "Acrobat and PDF",
                        "id": "caas:product-categories/acrobat-and-pdf"
                    },
                    {
                        "label": "Graphic Design",
                        "id": "caas:product-categories/graphic-design"
                    },
                    {
                        "label": "Illustration",
                        "id": "caas:product-categories/illustration"
                    },
                    {
                        "label": "Photo",
                        "id": "caas:product-categories/photo"
                    },
                    {
                        "label": "Social Media",
                        "id": "caas:product-categories/social-media"
                    },
                    {
                        "label": "UI and UX",
                        "id": "caas:product-categories/ui-and-ux"
                    },
                    {
                        "label": "Video",
                        "id": "caas:product-categories/video"
                    }
                ],
                "group": "Product Categories"
            }
        ],
        "filterLogic": "or",
        "i18n": {
            "leftPanel": {
                "header": "Refine Your Results",
                "clearAllFiltersText": "Clear All",
                "mobile": {
                    "filtersBtnLabel": "Filters",
                    "panel": {
                        "header": "Filter by",
                        "totalResultsText": "{total} results",
                        "applyBtnText": "Apply",
                        "clearFilterText": "Clear",
                        "doneBtnText": "Done"
                    },
                    "group": {
                        "totalResultsText": "{total} results",
                        "applyBtnText": "Apply",
                        "clearFilterText": "Clear",
                        "doneBtnText": "Done"
                    }
                }
            },
            "topPanel": {
                "groupLabel": "Filters:",
                "clearAllFiltersText": "Clear All",
                "moreFiltersBtnText": "More Filters +",
                "mobile": {
                    "group": {
                        "totalResultsText": "{total} results",
                        "applyBtnText": "Apply",
                        "clearFilterText": "Clear",
                        "doneBtnText": "Done"
                    }
                }
            }
        }
    },
    "sort": {
        "enabled": "true",
        "defaultSort": "dateDesc",
        "options": []
    },
    "pagination": {
        "animationStyle": "paged",
        "enabled": pagination,
        "resultsQuantityShown": "true",
        "loadMoreButton": {
            "style": "primary",
            "useThemeThree": "false"
        },
        "type": pagniationMethod,
        "i18n": {
            "loadMore": {
                "btnText": "Load More",
                "resultsQuantityText": "{start} of {end} displayed"
            },
            "paginator": {
                "resultsQuantityText": "{start} - {end} of {total} results",
                "prevLabel": "Prev",
                "nextLabel": "Next"
            }
        }
    },
    "bookmarks": {
        "showOnCards": "false",
        "leftFilterPanel": {
            "bookmarkOnlyCollection": "false",
            "showBookmarksFilter": "false",
            "selectBookmarksIcon": "",
            "unselectBookmarksIcon": ""
        },
        "i18n": {
            "leftFilterPanel": {
                "filterTitle": "My favorites"
            },
            "card": {
                "saveText": "Save Card",
                "unsaveText": "Unsave Card"
            }
        }
    },
    "search": {
        "enabled": search,
        "searchFields": [],
        "i18n": {
            "noResultsTitle": "No Results Found",
            "noResultsDescription": "Try checking your spelling or broadening your search.",
            "leftFilterPanel": {
                "searchTitle": "Search",
                "searchPlaceholderText": "Search Here"
            },
            "topFilterPanel": {
                "searchPlaceholderText": "Search Here"
            },
            "filterInfo": {
                "searchPlaceholderText": "Search Here"
            }
        }
    },
    "language": "en",
    "country": "US",
    "analytics": {
        "trackImpressions": "",
        "collectionIdentifier": ""
    },
    "target": {
        "enabled": ""
    }
  }

  // prep the output div
  const container = document.getElementById(id);
  const destinationDiv = document.createElement('div');
  const randomId = Math.floor(Math.random() * 100000);
  destinationDiv.setAttribute('id', randomId);
  container.appendChild(destinationDiv);

  // Deliver script to bottom of page
  var scriptElm = document.createElement('script');
  scriptElm.setAttribute('class', 'class-name');
  var inlineCode = document.createTextNode('function goCaas(randomId, caasConfig) { const consonantlinkCollection = new ConsonantCardCollection(caasConfig, document.getElementById(randomId)); }');
  scriptElm.appendChild(inlineCode); 
  document.body.appendChild(scriptElm);

  // Call goCaas() and run the script
  goCaas(randomId, caasConfig);
}

function buildHeader() {
  const header = document.querySelector('header');
  header.append(buildBlock('header', ''));
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
export function buildAutoBlocks() {
  try {
    buildHeader();
    buildEmbeds();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain() {
  const main = document.querySelector('main');
  if (main) {
    decorateAnchors(main);
    buildAutoBlocks(main);
    decorateSections(main);
    decorateBlocks(main);
  }
}

/**
 * loads everything needed to get to LCP.
 */
async function loadEager() {
  setTemplate();
  decorateMain();
  await waitForLCP();
}

/**
 * loads everything that doesn't need to be delayed.
 */
async function loadLazy(doc) {
  const header = doc.querySelector('header > div');
  const main = document.querySelector('main');
  if (main) {
    loadBlocks(main);

    decorateBlock(header);
    loadBlock(header);

    loadStyle('/fonts/fonts.css');
    addFavIcon(`${window.hlx.codeBasePath}/img/icon.svg`);
  }
}

/**
 * loads everything that happens a lot later, without impacting
 * the user experience.
 */
function loadDelayed() {
  // load anything that can be postponed to the latest here
}

(async function decoratePage() {
  await loadEager();
  await loadLazy(document);
  loadDelayed(document);
}());
