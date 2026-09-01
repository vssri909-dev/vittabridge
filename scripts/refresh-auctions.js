// Refreshes the auction listings on auctions.html with live data from BaankNet.
// Run manually with: node scripts/refresh-auctions.js
// Run automatically daily via scripts/refresh-and-push.ps1 (Windows Task Scheduler).
//
// BaankNet was rebuilt as a React SPA in August 2026. The old server-rendered
// /eauction-psb/* pages now 308-redirect to /auction-listing/property and no longer exist,
// so this reads the JSON API the SPA itself calls. That API returns every field the old
// auction-notice pages had to be scraped for (exact reserve, EMD, deadlines, inspection
// window, authoritative property type), so the per-listing notice fetch is gone.
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const AUCTIONS_HTML_PATH = path.join(__dirname, '..', 'auctions.html');

const API_HOST = 'baanknet.com';
const LISTING_API_PATH = '/api/v1/auction/detail/auction-listing';
const LISTING_PAGE_URL = 'https://baanknet.com/auction-listing/property';

const STATE_ID = 16; // Karnataka

// Every BaankNet city entry whose name contains "Bengaluru"/"Bangalore", found by walking
// /api/v1/common/districts?stateId=16 (all 31 Karnataka districts) then
// /api/v1/common/cities?districtId={id} for each one. Only two districts have a match —
// "Bengaluru" itself is filed under Bengaluru Urban, while Bengaluru Rural separately lists
// a "BENGALURU" city AND a "Vijayapura Bengaluru Rural" city. All three must be queried to
// cover every listing BaankNet files under a Bengaluru-named city, since a single cityId
// silently missed the other two. (These IDs survived the August 2026 rewrite unchanged.)
const BENGALURU_CITY_TARGETS = [
  { districtId: 280, cityId: 3974, cityName: 'Bengaluru' },                       // Bengaluru Urban
  { districtId: 279, cityId: 8349, cityName: 'BENGALURU' },                       // Bengaluru Rural
  { districtId: 279, cityId: 3973, cityName: 'Vijayapura Bengaluru Rural' },      // Bengaluru Rural
];

const PRICE_FROM = 15000000; // Rs 1.5 Crore
const SKIP_KEYWORDS = ['MACHINERY'];
const MIN_DAYS_OUT = 4; // Exclude auctions less than this many days from today — not enough lead time for EMD/diligence.
const PER_PAGE = 50;
const MAX_PAGES_PER_CITY = 20; // safety cap: 20 pages * 50/page = 1000 results per city, far beyond any realistic count

// -------------------- HTTP helpers --------------------

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.setTimeout(30000, () => req.destroy(new Error(`request to ${options.path} timed out after 30s`)));
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// -------------------- Listing API --------------------

// The SPA posts { search, range, sort, page, limit, auctionStatus }: `search` holds the
// exact-match filters, `range` the min/max and date-window ones. The public listing search
// needs no auth, CSRF token or session cookie.
async function searchAuctions(districtId, cityId, auctionDateStart, auctionDateEnd, page) {
  const payload = JSON.stringify({
    search: { stateId: STATE_ID, districtId, cityId },
    range: { reservePriceMin: PRICE_FROM, auctionDateStart, auctionDateEnd },
    sort: { type: 'closest' },
    page,
    limit: PER_PAGE,
    auctionStatus: 'upcoming', // excludes live, closed and cancelled auctions
  });
  const res = await httpRequest({
    hostname: API_HOST,
    path: LISTING_API_PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Referer': LISTING_PAGE_URL,
      'Content-Length': Buffer.byteLength(payload),
    },
  }, payload);
  if (res.statusCode !== 200) {
    // BaankNet's WAF serves a bare 403 to some datacenter IPs (e.g. GitHub-hosted runners) —
    // surface the status and body so an IP block isn't mistaken for an API change.
    throw new Error(`${LISTING_API_PATH} returned HTTP ${res.statusCode}: ${res.body.slice(0, 200).replace(/\s+/g, ' ').trim()}`);
  }
  let json;
  try {
    json = JSON.parse(res.body);
  } catch (err) {
    throw new Error(`${LISTING_API_PATH} returned non-JSON: ${res.body.slice(0, 200).replace(/\s+/g, ' ').trim()}`);
  }
  const data = json && json.data;
  if (!data || !Array.isArray(data.data)) {
    throw new Error(`${LISTING_API_PATH} response has no data.data array — the API shape has changed`);
  }
  return { hits: data.data, total: typeof data.total === 'number' ? data.total : null };
}

// Pages through a single (districtId, cityId) target until every result is fetched —
// stops when the collected count reaches BaankNet's own total, or a page comes back
// empty, or MAX_PAGES_PER_CITY is hit as a hard safety backstop against an infinite loop.
async function fetchAllListingsForCity(districtId, cityId, auctionDateStart, auctionDateEnd) {
  let page = 1;
  let total = null;
  let hits = [];
  while (true) {
    const res = await searchAuctions(districtId, cityId, auctionDateStart, auctionDateEnd, page);
    if (res.total !== null) total = res.total;
    if (res.hits.length === 0) break;
    hits = hits.concat(res.hits);
    if (total !== null && hits.length >= total) break;
    page++;
    if (page > MAX_PAGES_PER_CITY) {
      console.warn(`  WARNING: hit MAX_PAGES_PER_CITY (${MAX_PAGES_PER_CITY}) for district ${districtId}/city ${cityId} — results may be incomplete.`);
      break;
    }
    await sleep(200); // stay polite to the portal
  }
  return hits;
}

// -------------------- Normalisation --------------------

// BaankNet returns UTC ISO timestamps; every date and time shown on the site is IST.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// "2026-09-07T05:00:00.000Z" -> { day: Date at local midnight on the IST calendar day, time: '10:30' }
// Anchoring `day` to local midnight keeps the day arithmetic below correct whatever
// timezone the machine running this is set to.
function istDateTime(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const s = new Date(t + IST_OFFSET_MS);
  return {
    day: new Date(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()),
    time: `${String(s.getUTCHours()).padStart(2, '0')}:${String(s.getUTCMinutes()).padStart(2, '0')}`,
  };
}

// Today's date in IST, at local midnight — the baseline every "days away" figure counts from.
function istToday() {
  const s = new Date(Date.now() + IST_OFFSET_MS);
  return new Date(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
}

// "5460000.00000" -> 5460000
function parseAmount(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// One search hit -> the flat shape the card builder works with.
function normaliseListing(hit) {
  const s = hit && hit._source;
  if (!s || !s.auctionId) return null;
  return {
    auctionId: String(s.auctionId),
    title: (s.propertyHeading || '').replace(/\s+/g, ' ').trim(),
    bank: (s.propertyBankName || '').replace(/\s+/g, ' ').trim(),
    reserveRupees: parseAmount(s.reservePrice),
    emdRupees: parseAmount(s.emd),
    propertyType: s.propertyType || '',
    propertySubType: s.propertySubType || '',
    locality: (s.locality || '').replace(/\s+/g, ' ').trim(),
    pincode: (s.pincode || '').trim(),
    address: s.address || '',
    noOfRooms: s.noOfRooms,
    auctionStart: istDateTime(s.auctionFrom),
    auctionEnd: istDateTime(s.auctionTo),
    emdEnd: istDateTime(s.emdEnd),
    inspectionFrom: istDateTime(s.inspectionStart),
    inspectionTo: istDateTime(s.inspectionEnd),
  };
}

// -------------------- Classification / card building --------------------

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
function fmtLongDate(d) {
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtShortBadge(d) {
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]}`;
}

// Rupees -> compact display: >= 1 Cr as Cr, else Lakh
function fmtMoney(rupees) {
  if (rupees >= 1e7) return `₹${(rupees / 1e7).toFixed(2)} Cr`;
  return `₹${(rupees / 1e5).toFixed(2)} Lakh`;
}

// "... Latitude- 12.59240N Longitude- 77.36109E ..." -> { lat, lng }
function parseCoordinates(addressText) {
  if (!addressText) return null;
  const m = addressText.match(/Latitude-?\s*([\d.]+)\s*N[\s\S]*?Longitude-?\s*([\d.]+)\s*E/i);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  // sanity: rough bounding box for Karnataka
  if (lat < 11 || lat > 19 || lng < 74 || lng > 79) return null;
  return { lat, lng };
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
  const pin = /^\d{6}$/.test(item.pincode) ? item.pincode : '560001';

  // The API's own locality field is authoritative; fall back to the tail of the
  // "<area> <subtype> for sale in <locality> Bengaluru" heading when it comes back null.
  let locality = item.locality;
  if (!locality) {
    const m = item.title.match(/for sale in\s+(.+)$/i);
    locality = m ? m[1] : '';
  }
  locality = locality
    .replace(/\s*\bBengaluru\b\s*$/i, '')
    .replace(/[,\s]*\d{6}\s*$/, '')
    .replace(/^Nil,\s*/i, '')
    .replace(/[,\s]+$/, '')
    .trim();

  if (!locality || /^bengaluru$/i.test(locality)) {
    return { locality: 'Bengaluru', pin, hasSpecificLocality: false };
  }
  const segs = locality.split(',').map(s => s.trim()).filter(Boolean);
  const shortLocality = segs.slice(0, 2).join(', ');
  return { locality: cleanLocality(shortLocality), pin, hasSpecificLocality: true };
}

function classify(item) {
  // The bank's own Property Type / Sub Type is authoritative; fall back to the
  // heading only when the API leaves both blank.
  const typeText = `${item.propertyType} ${item.propertySubType}`.trim();
  const t = (typeText || item.title).toUpperCase();
  if (t.includes('INDUSTRIAL')) return { category: 'industrial', subtype: 'Industrial Plot', cardType: 'Industrial' };
  if (t.includes('OFFICE')) return { category: 'commercial', subtype: 'Office', cardType: 'Commercial' };
  if (t.includes('COMMERCIAL')) return { category: 'commercial', subtype: 'Residential Cum Commercial', cardType: 'Commercial' };
  if (t.includes('PLOT') || t.includes('LAND')) return { category: 'land', subtype: 'Plot', cardType: 'Land / Plot' };
  if (t.includes('VILLA')) return { category: 'residential', subtype: 'Villa', cardType: 'Residential' };
  if (t.includes('FLAT') || t.includes('APARTMENT')) return { category: 'residential', subtype: 'Flat', cardType: 'Residential' };
  if (t.includes('HOUSE')) return { category: 'residential', subtype: 'Independent House', cardType: 'Residential' };
  return { category: 'residential', subtype: 'Property', cardType: 'Residential' };
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function extractBhkPrefix(item) {
  const rooms = Number(item.noOfRooms);
  if (Number.isInteger(rooms) && rooms > 0) return `${rooms} BHK`;
  const m = item.title.match(/(\d+)\s*BHK\b/i);
  return m ? `${m[1]} BHK` : null;
}

function buildCards(rawListings, today) {
  const cards = rawListings.map(item => {
    const date = item.auctionStart.day;
    const daysAway = daysBetween(today, date);
    const { locality, pin, hasSpecificLocality } = extractLocalityAndPin(item);
    const { category, subtype, cardType } = classify(item);
    const bhk = extractBhkPrefix(item);
    const reserveCrore = item.reserveRupees / 1e7;

    // Each of these stays null when BaankNet leaves the underlying field blank, and the
    // card simply omits that row.
    const emdStr = item.emdRupees ? fmtMoney(item.emdRupees) : null;
    const emdCloseStr = item.emdEnd
      ? `${fmtShortBadge(item.emdEnd.day)} ${item.emdEnd.day.getFullYear()}, ${item.emdEnd.time}`
      : null;
    const auctionTimeStr = item.auctionEnd ? `${item.auctionStart.time} – ${item.auctionEnd.time} IST` : null;
    const inspectionStr = item.inspectionFrom && item.inspectionTo
      ? `${fmtShortBadge(item.inspectionFrom.day)} – ${fmtShortBadge(item.inspectionTo.day)} ${item.inspectionTo.day.getFullYear()}`
      : null;
    const coords = parseCoordinates(item.address);

    let badgeClass, badgeText, isUrgent = false;
    if (category === 'commercial') {
      badgeClass = 'badge-new'; badgeText = 'Mixed-Use';
    } else if (reserveCrore >= 8) {
      badgeClass = 'badge-new'; badgeText = 'High Value';
    } else if (daysAway <= 7) {
      badgeClass = 'badge-urgent'; badgeText = `${fmtShortBadge(date)} — Urgent`; isUrgent = true;
    } else {
      badgeClass = 'badge-upcoming'; badgeText = `${fmtShortBadge(date)} ${date.getFullYear()}`;
    }

    const titlePrefix = bhk ? `${bhk} ${subtype}` : subtype;
    const cardTitle = `${titlePrefix} — ${locality}`;
    const reserveStr = `₹${reserveCrore.toFixed(2)} Cr`;

    return {
      category, cardType, subtype, cardTitle, locality, pin, hasSpecificLocality,
      bank: item.bank, reserveStr, dateStr: fmtLongDate(date),
      auctionId: item.auctionId, badgeClass, badgeText, isUrgent, reserveCrore,
      auctionDate: date, emdStr, emdCloseStr, auctionTimeStr, inspectionStr, coords,
    };
  });

  // Soonest auction first — most actionable at the top
  cards.sort((a, b) => a.auctionDate - b.auctionDate || a.reserveCrore - b.reserveCrore);

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
  const mapLink = c.coords
    ? ` <a href="https://www.google.com/maps?q=${c.coords.lat},${c.coords.lng}" target="_blank" rel="noopener" style="color:var(--gold); font-size:0.72rem; letter-spacing:1px;">MAP ↗</a>`
    : '';

  const detailItems = [
    { label: 'Bank', value: escapeHtml(c.bank) },
    { label: 'Auction Date', value: c.dateStr, extraClass: highlightClass },
  ];
  if (c.auctionTimeStr) detailItems.push({ label: 'Auction Time', value: c.auctionTimeStr });
  if (c.emdStr) detailItems.push({ label: 'EMD Amount', value: c.emdStr });
  if (c.emdCloseStr) detailItems.push({ label: 'EMD Closes', value: c.emdCloseStr, extraClass: highlightClass });
  if (c.inspectionStr) detailItems.push({ label: 'Inspection', value: c.inspectionStr });
  detailItems.push({ label: 'Auction ID', value: c.auctionId });

  const detailsHtml = detailItems.map(d => `              <div class="card-detail-item">
                <span class="card-detail-label">${d.label}</span>
                <span class="card-detail-value${d.extraClass || ''}">${d.value}</span>
              </div>`).join('\n');

  return `        <div class="listing-card" data-category="${c.category}">
          <span class="card-badge ${c.badgeClass}">${c.badgeText}</span>
          <div class="card-header">
            <div class="card-type-row">
              <span class="card-type">${c.cardType}</span>
              <span class="card-type-dot"></span>
              <span class="card-subtype">${escapeHtml(c.subtype)}</span>
            </div>
            <div class="card-title">${escapeHtml(c.cardTitle)}</div>
            <div class="card-location">📍 ${escapeHtml(c.hasSpecificLocality ? `${c.locality}, ` : '')}Bengaluru-${c.pin}${mapLink}</div>
          </div>
          <div class="card-body">
            <div class="card-price-row">
              <span class="card-price-label">Reserve</span>
              <span class="card-price">${c.reserveStr}</span>
            </div>
            <div class="card-details">
${detailsHtml}
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
  const now = istToday();
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

// Date-only, IST calendar day: "2026-09-05"
function fmtApiDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function main() {
  const today = istToday();
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + MIN_DAYS_OUT);
  const auctionDateStart = fmtApiDate(minDate);
  // Keep a rolling ~18-month forward window so the range never goes stale between runs.
  const auctionDateEnd = `${today.getFullYear() + 1}-12-31`;

  console.log(`Fetching BaankNet listings (date range ${auctionDateStart} to ${auctionDateEnd}) across ${BENGALURU_CITY_TARGETS.length} Bengaluru city entries...`);

  let listings = [];
  for (const target of BENGALURU_CITY_TARGETS) {
    const hits = await fetchAllListingsForCity(target.districtId, target.cityId, auctionDateStart, auctionDateEnd);
    const cityListings = hits.map(normaliseListing).filter(Boolean);
    console.log(`  ${target.cityName} (district ${target.districtId}, city ${target.cityId}): ${cityListings.length} listing(s)`);
    listings = listings.concat(cityListings);
  }

  const beforeDedupeCount = listings.length;
  const seenAuctionIds = new Set();
  listings = listings.filter(item => {
    if (seenAuctionIds.has(item.auctionId)) return false;
    seenAuctionIds.add(item.auctionId);
    return true;
  });
  const dedupedCount = beforeDedupeCount - listings.length;

  const beforeSkipCount = listings.length;
  listings = listings.filter(item => {
    const haystack = `${item.title} ${item.propertyType} ${item.propertySubType}`.toUpperCase();
    return !SKIP_KEYWORDS.some(kw => haystack.includes(kw));
  });
  const skippedNonRealEstate = beforeSkipCount - listings.length;

  // A card can't be rendered without an auction date and a reserve price.
  const beforeIncompleteCount = listings.length;
  listings = listings.filter(item => item.auctionStart && item.reserveRupees);
  const skippedIncomplete = beforeIncompleteCount - listings.length;

  // Defensive re-check: don't rely solely on BaankNet's own date filter for the 4-day gap.
  const beforeDateFilterCount = listings.length;
  listings = listings.filter(item => daysBetween(today, item.auctionStart.day) >= MIN_DAYS_OUT);
  const skippedTooSoon = beforeDateFilterCount - listings.length;

  if (listings.length === 0) {
    throw new Error('No listings returned by BaankNet — aborting without touching auctions.html');
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

  console.log(`Wrote ${cards.length} listings (${dedupedCount} duplicate(s) across city queries, ${skippedNonRealEstate} skipped as non-real-estate, ${skippedIncomplete} skipped as incomplete, ${skippedTooSoon} skipped as < ${MIN_DAYS_OUT} days out) to auctions.html`);
  console.log(`Banks: ${[...new Set(cards.map(c => c.bank))].join(', ')}`);
}

main().catch(err => {
  console.error('refresh-auctions failed:', err);
  process.exit(1);
});
