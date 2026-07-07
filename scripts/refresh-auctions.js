// Refreshes the auction listings on auctions.html with live data from BaankNet.
// Run manually with: node scripts/refresh-auctions.js
// Run automatically weekly via .github/workflows/refresh-auctions.yml
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const AUCTIONS_HTML_PATH = path.join(__dirname, '..', 'auctions.html');

const STATE_ID = '16';       // Karnataka
const DISTRICT_ID = '280';   // Bengaluru Urban
const CITY_ID = '3974';      // Bengaluru
const PRICE_FROM = '15000000'; // Rs 1.5 Crore
const SKIP_KEYWORDS = ['MACHINERY'];

// -------------------- HTTP helpers (BaankNet's cert chain needs the SSL bypass, matching curl -k) --------------------

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ ...options, rejectUnauthorized: false }, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function fetchTokenAndCookie() {
  const res = await httpRequest({
    hostname: 'baanknet.com',
    path: '/eauction-psb/eproc-listing',
    method: 'GET',
  });
  const tokenMatch = res.body.match(/content="([a-f0-9-]{36})"/);
  if (!tokenMatch) throw new Error('CSRF token not found in eproc-listing page');
  const setCookie = res.headers['set-cookie'] || [];
  const jsessionMatch = setCookie.join(';').match(/JSESSIONID=([^;]+)/);
  if (!jsessionMatch) throw new Error('JSESSIONID cookie not found');
  return { token: tokenMatch[1], cookie: `JSESSIONID=${jsessionMatch[1]}` };
}

async function searchAuctions(token, cookie, aucDateFrom, aucDateTo) {
  const payload = JSON.stringify({
    currentPage: '1', perPage: '50',
    stateId: STATE_ID, districtId: DISTRICT_ID, cityId: CITY_ID,
    keywords: '', priceFrom: PRICE_FROM, priceTo: '',
    aucDateFrom, aucDateTo,
    propertyTypeId: '', searchType: '1', aucXstatus: '-1',
  });
  const res = await httpRequest({
    hostname: 'baanknet.com',
    path: '/eauction-psb/ajax/search-auction',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': token,
      'Referer': 'https://baanknet.com/eauction-psb/eproc-listing',
      'Cookie': cookie,
      'Content-Length': Buffer.byteLength(payload),
    },
  }, payload);
  if (res.statusCode !== 200) throw new Error(`search-auction returned HTTP ${res.statusCode}`);
  return res.body;
}

// -------------------- Parsing --------------------

function unescapeHtml(s) {
  return s
    .replace(/&#8377;/g, '₹')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseListings(html) {
  const blocks = html.split('<div class="eproc-listing-main">').slice(1);
  const results = [];
  for (const block of blocks) {
    const titleM = block.match(/<h4><a>\d+\)\s*([\s\S]*?)<\/a><\/h4>/);
    const auctionIdM = block.match(/Auction ID:\s*\n?\s*([0-9]+)/);
    const reserveM = block.match(/Reserve Price:\s*&#8377;\s*([0-9,.]+)\s*(Crore|Lakh|Cr|Lac)/i);
    const bankM = block.match(/x-dept-name">\s*(?:<img[^>]*\/?>)?\s*([^<]+?)\s*<\/p>/s);
    const locationM = block.match(/ref-location">[\s\S]*?<span>\s*([\s\S]*?)<\/span>\s*<\/span>/);
    const startDateM = block.match(/Start Date\s*:\s*([\d-]+)\s+([\d:]+)/);

    if (!titleM || !auctionIdM) continue;

    const title = unescapeHtml(titleM[1]).replace(/\s+/g, ' ').trim();
    const auctionId = auctionIdM[1].trim();
    let reserveCrore = null;
    if (reserveM) {
      const v = parseFloat(reserveM[1].replace(/,/g, ''));
      const unit = reserveM[2].toLowerCase();
      reserveCrore = (unit === 'lakh' || unit === 'lac') ? v / 100 : v;
    }
    const bank = bankM ? unescapeHtml(bankM[1]).replace(/\s+/g, ' ').trim() : '';
    const location = locationM ? unescapeHtml(locationM[1]).replace(/\s+/g, ' ').trim() : '';
    const startDate = startDateM ? startDateM[1] : null;

    if (!reserveCrore || !startDate) continue;
    results.push({ title, auctionId, reserveCrore, bank, location, startDate });
  }
  return results;
}

// -------------------- Classification / card building --------------------

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function parseDMY(s) {
  const [d, m, y] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
function fmtLongDate(d) {
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtShortBadge(d) {
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]}`;
}
function titleCaseWord(w) {
  if (/^[0-9]+$/.test(w)) return w;
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}
function titleCase(s) {
  return s.split(/(\s+)/).map(part => (/\s+/.test(part) ? part : titleCaseWord(part))).join('');
}

const LOCALITY_FIXES = {
  'beguir hibli': 'Begur Hobli',
  'infrantry road': 'Infantry Road',
};

function cleanLocality(loc) {
  const s = loc.trim().replace(/\.+$/, '').replace(/,\s*$/, '');
  const key = s.toLowerCase();
  if (LOCALITY_FIXES[key]) return LOCALITY_FIXES[key];
  return s.split(',').map(seg => titleCase(seg.trim())).join(', ');
}

function extractLocalityAndPin(item) {
  const pinM = item.location.match(/Bengaluru-(\d{6})/);
  const pin = pinM ? pinM[1] : '560001';

  let m = item.title.match(/for Sale in\s+(.*?)(?:,\s*Bengaluru-\d{6}\.?,?\s*)?,?\s*Bengaluru\s*$/i);
  let locality = m ? m[1].trim() : '';
  locality = locality.replace(/^Nil,\s*/i, '');
  locality = locality.replace(/,\s*Bengaluru-\d{6}\.?$/i, '');
  if (!locality || /^bengaluru$/i.test(locality)) {
    return { locality: 'Bengaluru', pin, hasSpecificLocality: false };
  }
  const segs = locality.split(',').map(s => s.trim()).filter(Boolean);
  const shortLocality = segs.slice(0, 2).join(', ');
  return { locality: cleanLocality(shortLocality), pin, hasSpecificLocality: true };
}

function classify(item) {
  const t = item.title.toUpperCase();
  if (t.includes('INDUSTRIAL')) return { category: 'industrial', subtype: 'Industrial Plot', cardType: 'Industrial' };
  if (t.includes('OFFICE')) return { category: 'commercial', subtype: 'Office', cardType: 'Commercial' };
  if (t.includes('COMMERCIAL')) return { category: 'commercial', subtype: 'Residential Cum Commercial', cardType: 'Commercial' };
  if (t.includes('PLOT')) return { category: 'land', subtype: 'Plot', cardType: 'Land / Plot' };
  if (t.includes('VILLA')) return { category: 'residential', subtype: 'Villa', cardType: 'Residential' };
  if (t.includes('FLAT') || t.includes('APARTMENT')) return { category: 'residential', subtype: 'Flat', cardType: 'Residential' };
  if (t.includes('HOUSE')) return { category: 'residential', subtype: 'Independent House', cardType: 'Residential' };
  return { category: 'residential', subtype: 'Property', cardType: 'Residential' };
}

function extractBhkPrefix(item) {
  const m = item.title.match(/^(\d+\s*BHK)\s+/i);
  return m ? m[1].toUpperCase().replace(/\s+/, ' ') : null;
}

function buildCards(rawListings, today) {
  const cards = rawListings.map(item => {
    const date = parseDMY(item.startDate);
    const daysAway = daysBetween(today, date);
    const { locality, pin, hasSpecificLocality } = extractLocalityAndPin(item);
    const { category, subtype, cardType } = classify(item);
    const bhk = extractBhkPrefix(item);

    let badgeClass, badgeText, isUrgent = false;
    if (category === 'commercial') {
      badgeClass = 'badge-new'; badgeText = 'Mixed-Use';
    } else if (item.reserveCrore >= 8) {
      badgeClass = 'badge-new'; badgeText = 'High Value';
    } else if (daysAway <= 7) {
      badgeClass = 'badge-urgent'; badgeText = `${fmtShortBadge(date)} — Urgent`; isUrgent = true;
    } else {
      badgeClass = 'badge-upcoming'; badgeText = `${fmtShortBadge(date)} ${date.getFullYear()}`;
    }

    const titlePrefix = bhk ? `${bhk} ${subtype}` : subtype;
    const cardTitle = `${titlePrefix} — ${locality}`;
    const reserveStr = `₹${item.reserveCrore.toFixed(2)} Cr`;

    return {
      category, cardType, subtype, cardTitle, locality, pin, hasSpecificLocality,
      bank: item.bank, reserveStr, dateStr: fmtLongDate(date),
      auctionId: item.auctionId, badgeClass, badgeText, isUrgent, reserveCrore: item.reserveCrore,
    };
  });

  // Disambiguate cards whose title + location line are identical
  const seenKeys = new Map();
  cards.forEach(c => {
    const locLine = c.hasSpecificLocality ? `${c.locality}, Bengaluru-${c.pin}` : `Bengaluru-${c.pin}`;
    const key = `${c.cardTitle}|${locLine}`;
    const n = (seenKeys.get(key) || 0) + 1;
    seenKeys.set(key, n);
    if (n > 1) c.cardTitle = `${c.cardTitle} (Unit ${n})`;
  });

  return cards;
}

function cardHtml(c) {
  const highlightClass = c.isUrgent ? ' highlight' : '';
  return `        <div class="listing-card" data-category="${c.category}">
          <span class="card-badge ${c.badgeClass}">${c.badgeText}</span>
          <div class="card-header">
            <div class="card-type-row">
              <span class="card-type">${c.cardType}</span>
              <span class="card-type-dot"></span>
              <span class="card-subtype">${c.subtype}</span>
            </div>
            <div class="card-title">${c.cardTitle}</div>
            <div class="card-location">📍 ${c.hasSpecificLocality ? `${c.locality}, ` : ''}Bengaluru-${c.pin}</div>
          </div>
          <div class="card-body">
            <div class="card-price-row">
              <span class="card-price-label">Reserve</span>
              <span class="card-price">${c.reserveStr}</span>
            </div>
            <div class="card-details">
              <div class="card-detail-item">
                <span class="card-detail-label">Bank</span>
                <span class="card-detail-value">${c.bank}</span>
              </div>
              <div class="card-detail-item">
                <span class="card-detail-label">Auction Date</span>
                <span class="card-detail-value${highlightClass}">${c.dateStr}</span>
              </div>
              <div class="card-detail-item">
                <span class="card-detail-label">Auction ID</span>
                <span class="card-detail-value">${c.auctionId}</span>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <a href="contact.html" class="card-cta-primary">Talk to Advisor</a>
          </div>
        </div>`;
}

// -------------------- File splicing --------------------

// Finds `<div class="CLASSNAME">` and returns the [start, end) byte range of that
// whole element, using div-depth counting so nested divs don't confuse the match.
function findBalancedDiv(content, className) {
  const openTag = `<div class="${className}">`;
  const start = content.indexOf(openTag);
  if (start === -1) return null;
  let depth = 0;
  let i = start;
  const tagRe = /<div\b[^>]*>|<\/div>/g;
  tagRe.lastIndex = start;
  let m;
  while ((m = tagRe.exec(content))) {
    if (m[0].startsWith('<div')) depth++;
    else depth--;
    if (depth === 0) return { start, end: m.index + m[0].length };
  }
  return null;
}

function replaceMarkerRegion(content, startMarker, endMarker, replacement) {
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`Markers not found or out of order: ${startMarker} / ${endMarker}`);
  }
  const before = content.slice(0, startIdx + startMarker.length);
  const after = content.slice(endIdx);
  return `${before}\n${replacement}\n\n        ${after}`;
}

function buildStatsBlock(cards) {
  const banks = new Set(cards.map(c => c.bank));
  const lowest = Math.min(...cards.map(c => c.reserveCrore)).toFixed(2);
  const highest = Math.max(...cards.map(c => c.reserveCrore)).toFixed(2);
  const now = new Date();
  const monthYear = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  return `<div class="auction-stats">
        <div class="auction-stat"><strong>${cards.length}</strong> Active listings</div>
        <div class="auction-stat"><strong>${banks.size}</strong> Banks represented</div>
        <div class="auction-stat"><strong>₹${lowest} Cr</strong> Lowest reserve</div>
        <div class="auction-stat"><strong>₹${highest} Cr</strong> Highest reserve</div>
        <span class="updated-badge">Last updated: ${monthYear}</span>
      </div>`;
}

// -------------------- Main --------------------

async function main() {
  const today = new Date();
  const aucDateFrom = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
  // Keep a rolling ~18-month forward window so the range never goes stale between runs.
  const aucDateTo = `31-12-${today.getFullYear() + 1}`;

  console.log(`Fetching BaankNet listings (date range ${aucDateFrom} to ${aucDateTo})...`);
  const { token, cookie } = await fetchTokenAndCookie();
  const html = await searchAuctions(token, cookie, aucDateFrom, aucDateTo);

  let listings = parseListings(html);
  const beforeSkipCount = listings.length;
  listings = listings.filter(item => !SKIP_KEYWORDS.some(kw => item.title.toUpperCase().includes(kw)));
  const skipped = beforeSkipCount - listings.length;

  if (listings.length === 0) {
    throw new Error('No listings parsed from BaankNet response — aborting without touching auctions.html');
  }

  const cards = buildCards(listings, today);
  const cardsHtml = cards.map(cardHtml).join('\n\n');

  let content = fs.readFileSync(AUCTIONS_HTML_PATH, 'utf-8');

  const statsRange = findBalancedDiv(content, 'auction-stats');
  if (!statsRange) throw new Error('Could not locate .auction-stats block in auctions.html');
  const newStats = buildStatsBlock(cards);
  content = content.slice(0, statsRange.start) + newStats + content.slice(statsRange.end);

  content = replaceMarkerRegion(
    content,
    '<!-- AUCTION-CARDS-START (auto-generated by scripts/refresh-auctions.js — do not hand-edit between these markers) -->',
    '<!-- AUCTION-CARDS-END -->',
    cardsHtml
  );

  fs.writeFileSync(AUCTIONS_HTML_PATH, content, 'utf-8');

  console.log(`Wrote ${cards.length} listings (${skipped} skipped as non-real-estate) to auctions.html`);
  console.log(`Banks: ${[...new Set(cards.map(c => c.bank))].join(', ')}`);
}

main().catch(err => {
  console.error('refresh-auctions failed:', err);
  process.exit(1);
});
