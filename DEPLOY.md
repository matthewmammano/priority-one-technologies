# Deploy

Static site, no build step. Both pages ship from the same repo root:

- `/index.html` - Priority One Technologies
- `/iiq/index.html` - Inventory IQ

## 1. Form endpoint

Both pages post to one Formspree form. The endpoint lives in exactly one place:
`script.js` -> `FORM_ENDPOINT`.

Set to the live Formspree form `mnpprrna`.

Every submission carries, on top of the four typed fields:

| field | value |
| --- | --- |
| `_subject` | `New inquiry from <page title>` - so the email subject names the page |
| `source_page` / `source_url` / `source_path` | which page the form was sent from |
| `product` | `Inventory IQ` (product page only) |
| `referrer` | the page they arrived from, or `direct` |
| `utm_*`, `gclid`, `fbclid`, `msclkid` | only the campaign params actually present in the URL |
| `submitted_at`, `seconds_on_page` | ISO timestamp and dwell time |
| `timezone`, `language` | from the browser |
| `screen`, `viewport`, `touch_device` | device shape |
| `user_agent` | full UA string |

Formspree additionally records the sender IP and its own receipt timestamp server side.

`_gotcha` is a hidden honeypot; Formspree drops anything that fills it.

## 2. GitHub Pages

```bash
cd /home/mvv/dev/claude-sandbox/priority-one-technologies
git init -b main
git add -A
git commit -m "feat: priority one technologies site and inventory iq product page"
gh repo create priority-one-technologies --public --source=. --push
```

Then in the repo: Settings -> Pages -> Source: `Deploy from a branch`, Branch: `main` / `/ (root)`.

`.nojekyll` is already present so Jekyll does not eat the paths. `CNAME` already
contains `priorityonetechnologies.com`.

## 3. Custom domain DNS

At the registrar for `priorityonetechnologies.com`:

| type | name | value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `<your-github-username>.github.io.` |

Back in Settings -> Pages, confirm the custom domain reads
`priorityonetechnologies.com` and tick **Enforce HTTPS** once the cert issues
(usually under an hour).

Add the live domain to Formspree's allowed-domains list, or submissions from the
real site get rejected.
