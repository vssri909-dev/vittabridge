# VittaBridge Website — Cloudflare Pages

## Project Structure
```
vittabridge/
├── index.html          ← Home page
├── about.html          ← About Us
├── services.html       ← Services (NRI / Auction / Management)
├── insights.html       ← Blog listing page
├── contact.html        ← Contact with 3 forms
├── css/
│   └── style.css       ← All styles (brand colours, components)
├── js/
│   └── main.js         ← Navigation, forms, animations
├── posts/
│   └── how-nris-can-buy-bank-auction-properties.html  ← Blog post template
└── images/
    └── favicon.png     ← Upload your favicon here
```

---

## Deploying to Cloudflare Pages

### Step 1 — Upload to GitHub
1. Go to github.com → New Repository → name it `vittabridge`
2. Upload all these files (drag & drop the entire folder)
3. Commit

### Step 2 — Connect to Cloudflare Pages
1. Go to Cloudflare Dashboard → Pages → Create Project
2. Connect to Git → Select your GitHub repo `vittabridge`
3. Build settings:
   - **Framework preset:** None
   - **Build command:** (leave blank)
   - **Build output directory:** `/` (root)
4. Click Deploy

### Step 3 — Connect Custom Domain
1. In Cloudflare Pages → your project → Custom Domains
2. Add `vittabridge.com` and `www.vittabridge.com`
3. Cloudflare handles SSL automatically

---

## Writing Blog Posts

### To add a new blog post:
1. Copy `posts/how-nris-can-buy-bank-auction-properties.html`
2. Rename it (e.g. `posts/fema-rules-nri-property.html`)
3. Edit these parts:
   - `<title>` tag — your post title
   - `<meta name="description">` — 150-char summary
   - The `<span class="section-label">` — category name
   - The `<h1>` — post title
   - The `<article class="post-body">` — your content
   - Update sidebar "Related Insights" links
4. Add a card for it in `insights.html`
5. Upload to GitHub → auto-deploys in 60 seconds ✅

### Blog categories available:
- `auction` → Auction Properties 101
- `nri` → NRI Buyer's Guide
- `legal` → Legal & Compliance
- `tax` → Tax & Finance
- `market` → Market Insights
- `perspectives` → VittaBridge Perspectives

---

## Contact Forms — Formspree Setup

The contact forms use Formspree (free, no backend needed).

1. Go to formspree.io → Sign up free
2. Create 3 forms:
   - Buyer Enquiry
   - Property Owner Enquiry
   - Partnership Enquiry
3. Replace `YOUR_FORM_ID`, `YOUR_FORM_ID_2`, `YOUR_FORM_ID_3` in `contact.html`
4. Formspree sends submissions to your email automatically

---

## Updating Contact Details

Search and replace across all files:
- `hello@vittabridge.com` → your real email
- `+91 99999 99999` → your real phone
- `919999999999` → your WhatsApp number (no + or spaces)

---

## Google Analytics

Add this before `</head>` in every HTML file:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```
Replace `G-XXXXXXXXXX` with your GA4 Measurement ID.
