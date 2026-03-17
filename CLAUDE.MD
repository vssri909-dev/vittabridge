# VittaBridge — Claude Code Instructions

## What This Project Is
VittaBridge is a premium NRI real estate advisory website. It is a **content-led authority site** — no property listings. Trust is built through deep educational blog content, a premium brand presentation and clear calls to action.

**Live site:** https://vittabridge.com  
**GitHub repo:** https://github.com/vssri909-dev/vittabridge  
**Deployed via:** Cloudflare Pages (auto-deploys on every push)

---

## Brand Identity

**Name:** VittaBridge — "Vitta" (Sanskrit for wealth/purpose) + Bridge (connection between NRIs and India)  
**Tagline:** Your Trusted Bridge to Indian Real Estate  
**Positioning:** The wealth manager equivalent for NRI real estate — premium, specialist, content-driven, trust-based  
**Target audience:** NRIs in USA, UK, UAE, Canada, Australia, Singapore investing in Indian real estate

**Brand colours:**
- Deep forest green: `#0d2820`
- Rich gold: `#b8963e`
- Cream: `#f0ead8`

**Fonts:** Libre Baskerville (headings) + Josefin Sans (body)  
**Tone:** Sophisticated, trustworthy, expert, culturally resonant. Never salesy. Always educational.

---

## Contact Details
- Email: Sri@vittabridge.com
- Phone/WhatsApp: +91 97403 11355
- WhatsApp link: https://wa.me/919740311355
- Location: Bengaluru, India
- LinkedIn: https://linkedin.com/company/vittabridge

---

## Site Structure

```
vittabridge/
├── index.html          — Home page
├── about.html          — About Us
├── services.html       — Services (3 services)
├── insights.html       — Blog listing page
├── contact.html        — Contact with 3 forms
├── privacy.html        — Privacy Policy
├── 404.html            — 404 page
├── sitemap.xml         — Sitemap
├── robots.txt          — Robots file
├── css/
│   └── style.css       — All styles
├── js/
│   ├── main.js         — Navigation, forms, animations
│   └── analytics.js    — Google Analytics (G-75XM8KSW9Q)
└── posts/
    └── [blog posts].html
```

---

## Services

1. **NRI Buyer Advisory** — Property search, due diligence, FEMA compliance, POA, TDS, registration support
2. **Auction Property Advisory** — Bank and court auction property identification, due diligence, bidding support
3. **Property Management** — Tenant sourcing, rent collection, maintenance, reporting for NRI-owned properties

---

## Analytics & SEO

**Google Analytics ID:** G-75XM8KSW9Q  
**Analytics file:** `js/analytics.js` — already configured with the GA ID

**Google Search Console:** Verified for vittabridge.com. Sitemap submitted.

---

## Rules for Every HTML File

### Analytics — MANDATORY
Every HTML file must include the analytics script before `</head>`:

**Root folder files** (`index.html`, `about.html` etc.):
```html
<script src="js/analytics.js"></script>
```

**Posts folder files** (`posts/*.html`):
```html
<script src="../js/analytics.js"></script>
```

### SEO Tags — MANDATORY for every page
Every `<head>` must include:

1. **Font preconnect** (speeds up Google Fonts loading):
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

2. **Canonical tag** (prevents duplicate content):
```html
<link rel="canonical" href="https://vittabridge.com/posts/[filename].html" />
```

3. **Open Graph tags** (controls WhatsApp/LinkedIn share previews):
```html
<meta property="og:title" content="[Post Title] | VittaBridge" />
<meta property="og:description" content="[150 char description]" />
<meta property="og:url" content="https://vittabridge.com/posts/[filename].html" />
<meta property="og:type" content="article" />
<meta property="og:image" content="https://vittabridge.com/images/og-vittabridge.jpg" />
<meta property="og:site_name" content="VittaBridge" />
```

4. **Twitter card**:
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[Post Title] | VittaBridge" />
<meta name="twitter:description" content="[150 char description]" />
```

5. **Article schema** (for blog posts only):
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Post Title]",
  "description": "[Description]",
  "url": "https://vittabridge.com/posts/[filename].html",
  "publisher": {
    "@type": "Organization",
    "name": "VittaBridge",
    "url": "https://vittabridge.com"
  },
  "author": {
    "@type": "Organization",
    "name": "VittaBridge Advisory"
  }
}
</script>
```

---

## Blog Post Template

When creating a new blog post, use this exact structure:

### File naming convention
- Lowercase, hyphen-separated, descriptive
- Example: `posts/nri-home-loan-guide-india.html`

### Required `<head>` structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>[Post Title] | VittaBridge</title>
  <meta name="description" content="[150 char SEO description]" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="canonical" href="https://vittabridge.com/posts/[filename].html" />
  <meta property="og:title" content="[Post Title] | VittaBridge" />
  <meta property="og:description" content="[150 char description]" />
  <meta property="og:url" content="https://vittabridge.com/posts/[filename].html" />
  <meta property="og:type" content="article" />
  <meta property="og:image" content="https://vittabridge.com/images/og-vittabridge.jpg" />
  <meta property="og:site_name" content="VittaBridge" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="[Post Title] | VittaBridge" />
  <meta name="twitter:description" content="[150 char description]" />
  <link rel="stylesheet" href="../css/style.css" />
  <link rel="icon" type="image/png" href="../images/favicon.png" />
  <script src="../js/analytics.js"></script>
  <style>
    /* Post-specific styles go here */
    .post-hero { padding: 5rem 0 3rem; border-bottom: 1px solid rgba(184,150,62,0.1); }
    .post-layout { display: grid; grid-template-columns: 1fr 320px; gap: 4rem; align-items: start; padding: 4rem 0; }
    .post-body h2 { font-size: 1.6rem; margin: 2.5rem 0 1rem; color: var(--cream); }
    .post-body h3 { font-size: 1.2rem; margin: 2rem 0 0.75rem; color: var(--gold-light); }
    .post-body p { font-size: 0.95rem; line-height: 1.9; opacity: 0.82; margin-bottom: 1.25rem; }
    .post-body ul, .post-body ol { padding-left: 1.5rem; margin-bottom: 1.5rem; }
    .post-body li { font-size: 0.95rem; line-height: 1.8; opacity: 0.8; margin-bottom: 0.5rem; }
    .post-body li::marker { color: var(--gold); }
    .post-callout { background: var(--green-deeper); border-left: 3px solid var(--gold); padding: 1.5rem 2rem; margin: 2rem 0; }
    .post-callout p { margin: 0; font-style: italic; }
    .post-sidebar { position: sticky; top: 100px; }
    .sidebar-card { background: var(--green-deeper); border: 1px solid rgba(184,150,62,0.12); padding: 2rem; margin-bottom: 1.5rem; }
    .sidebar-card h4 { font-size: 0.75rem; letter-spacing: 3px; text-transform: uppercase; color: var(--gold); margin-bottom: 1.2rem; }
    .related-post { padding: 0.75rem 0; border-bottom: 1px solid rgba(184,150,62,0.08); font-size: 0.85rem; }
    .related-post:last-child { border-bottom: none; }
    .related-post a { color: var(--cream); opacity: 0.7; }
    .related-post a:hover { opacity: 1; color: var(--gold); }
    .post-meta-bar { display: flex; gap: 2rem; align-items: center; flex-wrap: wrap; margin-bottom: 2rem; font-size: 0.75rem; letter-spacing: 1.5px; opacity: 0.5; }
    @media (max-width: 900px) { .post-layout { grid-template-columns: 1fr; } .post-sidebar { position: static; } }
  </style>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "[Post Title]",
    "description": "[Description]",
    "url": "https://vittabridge.com/posts/[filename].html",
    "publisher": {
      "@type": "Organization",
      "name": "VittaBridge",
      "url": "https://vittabridge.com"
    },
    "author": {
      "@type": "Organization",
      "name": "VittaBridge Advisory"
    }
  }
  </script>
</head>
```

### Nav block (copy exactly — note `../` paths for posts folder)
```html
<body>
  <div class="topbar">
    <div class="container">
      <div class="topbar-inner">
        <ul class="topbar-contact">
          <li><a href="mailto:Sri@vittabridge.com">✉ Sri@vittabridge.com</a></li>
          <li><a href="tel:+919740311355">✆ +91 97403 11355</a></li>
        </ul>
        <div class="topbar-social">
          <a href="https://linkedin.com/company/vittabridge" target="_blank">LINKEDIN</a>
          <a href="https://wa.me/919740311355" target="_blank">WHATSAPP</a>
        </div>
      </div>
    </div>
  </div>
  <header class="header">
    <div class="container">
      <div class="header-inner">
        <a href="../index.html" class="logo">
          <svg class="logo-mark" viewBox="0 0 100 100" fill="none">
            <polygon points="50,4 90,50 50,96 10,50" fill="none" stroke="#b8963e" stroke-width="2" opacity="0.8"/>
            <polygon points="50,24 70,50 50,76 30,50" fill="url(#gdNAME)"/>
            <defs><linearGradient id="gdNAME" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f0d98a"/><stop offset="100%" stop-color="#a07828"/></linearGradient></defs>
            <polygon points="50,1 54,4 50,7 46,4" fill="#b8963e"/>
            <polygon points="93,47 96,50 93,53 90,50" fill="#b8963e"/>
            <polygon points="50,93 54,96 50,99 46,96" fill="#b8963e"/>
            <polygon points="7,47 10,50 7,53 4,50" fill="#b8963e"/>
            <text x="50" y="58" font-family="Georgia,serif" font-weight="700" font-size="32" fill="#0d2820" text-anchor="middle">V</text>
          </svg>
          <div class="logo-text">
            <span class="logo-name">VittaBridge</span>
            <span class="logo-tagline">Real Estate Advisory</span>
          </div>
        </a>
        <nav>
          <ul class="nav">
            <li><a href="../index.html">Home</a></li>
            <li><a href="../about.html">About Us</a></li>
            <li><a href="../services.html">Services</a></li>
            <li><a href="../insights.html" class="active">Insights</a></li>
            <li><a href="../contact.html" class="nav-cta">Contact Us</a></li>
          </ul>
        </nav>
        <div class="hamburger"><span></span><span></span><span></span></div>
      </div>
    </div>
  </header>
```

### Post hero section
```html
  <section class="post-hero">
    <div class="container">
      <a href="../insights.html" style="font-size:0.7rem; letter-spacing:2px; text-transform:uppercase; color:var(--gold); opacity:0.7;">← Back to Insights</a>
      <div style="margin-top:1.5rem;">
        <span class="section-label">[Category]</span>
        <h1 style="max-width:800px; margin-top:0.5rem;">[Post Title]</h1>
        <div class="post-meta-bar">
          <span>[X] min read</span><span>·</span><span>VittaBridge Advisory</span><span>·</span><span>[Category]</span>
        </div>
        <div class="divider"></div>
      </div>
    </div>
  </section>
```

### Post body + sidebar layout
```html
  <div class="container">
    <div class="post-layout">
      <article class="post-body">
        <!-- Article content here -->
        <!-- End with CTA box -->
        <div style="margin-top:2.5rem; padding:2rem; border:1px solid rgba(184,150,62,0.2); background:var(--green-deeper);">
          <div style="font-size:0.7rem; letter-spacing:3px; text-transform:uppercase; color:var(--gold); margin-bottom:1rem;">Talk to Our Advisors</div>
          <p style="font-size:0.9rem; margin-bottom:1.5rem;">Have questions? Book a free consultation.</p>
          <a href="../contact.html" class="btn btn-primary">Book a Free Consultation</a>
        </div>
      </article>
      <aside class="post-sidebar">
        <div class="sidebar-card">
          <h4>Quick Contact</h4>
          <p style="font-size:0.82rem; opacity:0.65; margin-bottom:1.2rem;">Speak directly with our NRI property advisors.</p>
          <a href="../contact.html" class="btn btn-primary" style="display:block; text-align:center; width:100%;">Talk to Us</a>
          <a href="https://wa.me/919740311355" target="_blank" class="btn btn-outline" style="display:block; text-align:center; width:100%; margin-top:0.75rem;">WhatsApp</a>
        </div>
        <div class="sidebar-card">
          <h4>Related Insights</h4>
          <!-- Add 3-4 related post links -->
          <div class="related-post"><a href="[related-post].html">[Related Post Title]</a></div>
        </div>
        <div class="sidebar-card">
          <h4>Categories</h4>
          <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
            <a href="../insights.html" style="font-size:0.78rem; color:var(--cream); opacity:0.6; padding:0.4rem 0; border-bottom:1px solid rgba(184,150,62,0.06);">NRI Buyer's Guide</a>
            <a href="../insights.html" style="font-size:0.78rem; color:var(--cream); opacity:0.6; padding:0.4rem 0; border-bottom:1px solid rgba(184,150,62,0.06);">Auction Properties 101</a>
            <a href="../insights.html" style="font-size:0.78rem; color:var(--cream); opacity:0.6; padding:0.4rem 0; border-bottom:1px solid rgba(184,150,62,0.06);">Legal & Compliance</a>
            <a href="../insights.html" style="font-size:0.78rem; color:var(--cream); opacity:0.6; padding:0.4rem 0; border-bottom:1px solid rgba(184,150,62,0.06);">Tax & Finance</a>
            <a href="../insights.html" style="font-size:0.78rem; color:var(--cream); opacity:0.6; padding:0.4rem 0;">Market Insights</a>
          </div>
        </div>
      </aside>
    </div>
  </div>
```

### Footer (copy exactly for posts)
```html
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="../index.html" class="logo" style="margin-bottom:1rem; display:inline-flex;">
            <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
              <polygon points="50,4 90,50 50,96 10,50" fill="none" stroke="#b8963e" stroke-width="2"/>
              <polygon points="50,24 70,50 50,76 30,50" fill="url(#gdfNAME)"/>
              <defs><linearGradient id="gdfNAME" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f0d98a"/><stop offset="100%" stop-color="#a07828"/></linearGradient></defs>
              <text x="50" y="58" font-family="Georgia,serif" font-weight="700" font-size="32" fill="#0d2820" text-anchor="middle">V</text>
            </svg>
            <span style="font-family:var(--font-heading); font-size:1.2rem; color:var(--cream); margin-left:0.75rem; align-self:center;">VittaBridge</span>
          </a>
          <p>Your trusted bridge to Indian real estate. Specialists in NRI investments and auction properties across India.</p>
        </div>
        <div class="footer-col"><h4>Navigate</h4><ul class="footer-links">
          <li><a href="../about.html">About Us</a></li>
          <li><a href="../services.html">Services</a></li>
          <li><a href="../insights.html">Insights</a></li>
          <li><a href="../contact.html">Contact Us</a></li>
          <li><a href="../privacy.html">Privacy Policy</a></li>
        </ul></div>
        <div class="footer-col"><h4>Services</h4><ul class="footer-links">
          <li><a href="../services.html#nri">NRI Buyer Advisory</a></li>
          <li><a href="../services.html#auction">Auction Properties</a></li>
          <li><a href="../services.html#management">Property Management</a></li>
        </ul></div>
        <div class="footer-col"><h4>Contact</h4>
          <div class="footer-contact-item">✉ Sri@vittabridge.com</div>
          <div class="footer-contact-item">✆ +91 97403 11355</div>
          <div class="footer-contact-item">📍 Bengaluru, India</div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 VittaBridge. All rights reserved. · <a href="../privacy.html" style="color:inherit; opacity:0.6;">Privacy Policy</a></span>
        <span>NRI & Auction Specialists · India</span>
      </div>
    </div>
  </footer>
  <a href="https://wa.me/919740311355" class="whatsapp-float" target="_blank" aria-label="Chat on WhatsApp">
    <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  </a>
  <script src="../js/main.js"></script>
</body>
</html>
```

---

## Blog Categories

| Category slug | Display name | data-category |
|---|---|---|
| NRI Buyer's Guide | NRI Buyer's Guide | `nri` |
| Auction Properties 101 | Auction Properties 101 | `auction` |
| Legal & Compliance | Legal & Compliance | `legal` |
| Tax & Finance | Tax & Finance | `tax` |
| Market Insights | Market Insights | `market` |
| VittaBridge Perspectives | VB Perspectives | `perspectives` |

---

## Existing Blog Posts

| File | Category | Title |
|---|---|---|
| `how-nris-can-buy-bank-auction-properties.html` | auction | How NRIs Can Buy Bank Auction Properties in India |
| `fema-rules-nri-property.html` | legal | FEMA Rules Every NRI Property Investor Must Know |
| `buy-property-india-from-abroad.html` | nri | Step-by-Step: How to Buy Property in India from Abroad |
| `auction-properties-investment-secret.html` | auction | Why Auction Properties Are India's Best Kept Investment Secret |
| `tds-nri-property-purchase.html` | tax | TDS on Property Purchase — A Complete NRI Guide |
| `power-of-attorney-nri.html` | legal | Power of Attorney for NRIs — What You Must Get Right |
| `top-cities-nri-investment-2026.html` | market | Top 5 Cities NRIs Are Betting On in 2026 |
| `repatriating-property-proceeds-nri.html` | tax | Repatriating Property Sale Proceeds — The Full Picture |
| `why-nri-property-deals-go-wrong.html` | perspectives | Why Most NRI Property Deals Go Wrong (And How to Avoid It) |

---

## After Creating a New Blog Post

### 1. Add a card to `insights.html`
Add this card inside the `.insights-grid` div:
```html
<div class="insight-card" data-category="[category]">
  <div class="insight-card-img-placeholder">
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><polygon points="24,4 44,24 24,44 4,24" fill="none" stroke="#b8963e" stroke-width="1.5" opacity="0.4"/><polygon points="24,12 36,24 24,36 12,24" fill="#b8963e" opacity="0.2"/></svg>
  </div>
  <div class="insight-card-body">
    <span class="insight-category">[Category Display Name]</span>
    <h3>[Post Title]</h3>
    <p>[2-line description]</p>
    <div class="insight-meta">
      <span>[X] min read</span>
      <a href="posts/[filename].html" style="color:var(--gold); font-size:0.7rem; letter-spacing:1.5px;">READ →</a>
    </div>
  </div>
</div>
```

### 2. Update sitemap.xml
Add a new `<url>` block:
```xml
<url>
  <loc>https://vittabridge.com/posts/[filename].html</loc>
  <lastmod>[YYYY-MM-DD]</lastmod>
  <changefreq>yearly</changefreq>
  <priority>0.7</priority>
</url>
```

### 3. Commit and push
```bash
git add .
git commit -m "Add new blog post: [post title]"
git push
```

Cloudflare auto-deploys within 60 seconds.

---

## Writing Style Guidelines

- Write in third person from the firm's perspective ("We have seen...", "Our clients...")
- Sentences are direct, no filler words
- Use British English spelling (recognised, specialised, behaviour)
- Never use em-dashes (—) — use full stops or restructure the sentence instead
- Each H2 should address one specific question or concept
- Include at least one `.post-callout` box per article with a key insight or warning
- End every article with a CTA box linking to contact.html
- Reading time: aim for 5-8 minutes (800-1400 words)
- Do not use phrases like "In conclusion" or "To summarise"

---

## SEO Guidelines for Blog Posts

- **Title tag:** `[Post Title] | VittaBridge` — keep under 60 characters
- **Meta description:** 140-155 characters, include primary keyword naturally
- **Primary keyword:** Include in H1, first paragraph, one H2, and meta description
- **Target keywords for VittaBridge:** NRI real estate India, NRI property investment, bank auction properties India, FEMA property rules NRI, NRI buy property India
- **Internal links:** Every post should link to at least 2 other posts in the sidebar
- **H1:** Only one per page — the post title
- **H2/H3:** Use for logical section breaks — Google reads these for topic understanding
