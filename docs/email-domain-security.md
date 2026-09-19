# Email Domain Security: SPF, DKIM & DMARC Guide

This guide explains how to configure email authentication for CardMax's notification system. Proper SPF, DKIM, and DMARC configuration is essential for deliverability and protecting against email spoofing.

---

## 1. Overview

| Protocol | Purpose | Record Type | Host |
|---|---|---|---|
| **SPF** | Authorises servers to send email from your domain | TXT | `@` (root) |
| **DKIM** | Cryptographic signature proving email authenticity | TXT | `{selector}._domainkey` |
| **DMARC** | Policy for handling SPF/DKIM failures + reporting | TXT | `_dmarc` |

---

## 2. SPF Record

SPF tells receiving servers which mail servers are authorised to send email from `cardmax.com`.

### For SMTP provider
```
Type: TXT
Host: @
Value: v=spf1 include:mail.cardmax.com ~all
TTL: 3600
```

### For Resend
```
Type: TXT
Host: @
Value: v=spf1 include:sendgrid.net ~all
TTL: 3600
```

> **Note**: Only one SPF record should exist per domain. If you have multiple sending sources, combine them: `v=spf1 include:mail.cardmax.com include:sendgrid.net ~all`

---

## 3. DKIM Configuration

DKIM signs outgoing emails with a private key. Recipients verify the signature using your public key published as a DNS TXT record.

### Generating a DKIM Keypair

```bash
# Generate private key (2048-bit RSA)
openssl genrsa -out dkim_private.key 2048

# Extract public key
openssl rsa -in dkim_private.key -pubout -out dkim_public.key

# Display the public key (raw, no headers)
openssl rsa -in dkim_private.key -pubout | grep -v "^--" | tr -d '\n'
```

### DNS Record for DKIM

```
Type: TXT
Host: cardmax._domainkey.cardmax.com
Value: v=DKIM1; k=rsa; p=<base64-encoded-public-key>
TTL: 3600
```

Replace `cardmax` with your `DKIM_KEY_SELECTOR` env value.

### Environment Variables

```env
DKIM_DOMAIN=cardmax.com
DKIM_KEY_SELECTOR=cardmax
DKIM_PRIVATE_KEY=<paste multi-line private key with literal \n>
```

> **Tip**: When storing multiline keys in `.env`, replace actual newlines with `\n`: `-----BEGIN RSA PRIVATE KEY-----\nMIIE...`

---

## 4. DMARC — Phased Deployment

DMARC tells receiving servers what to do with emails that fail SPF or DKIM alignment.

> [!IMPORTANT]
> **Always start at `p=none`** (monitoring mode). Moving directly to `p=reject` without monitoring will cause legitimate emails to be silently dropped.

### Phase 1: Monitoring (Deploy First)

```
Type: TXT
Host: _dmarc.cardmax.com
Value: v=DMARC1; p=none; rua=mailto:dmarc-reports@cardmax.com; aspf=r; adkim=r
TTL: 3600
```

- **`p=none`**: No action taken on failures. All mail is delivered.
- **`rua=`**: Aggregate reports sent to this address daily.
- **`aspf=r`**: Relaxed SPF alignment (subdomain matching allowed).
- **`adkim=r`**: Relaxed DKIM alignment.

**Duration**: Run for **2–4 weeks** while reviewing aggregate reports.

### Reading DMARC Reports

Reports are XML files emailed to `dmarc-reports@cardmax.com`. Key fields:

```xml
<record>
  <row>
    <source_ip>198.51.100.0</source_ip>
    <count>150</count>
    <policy_evaluated>
      <disposition>none</disposition>
      <dkim>pass</dkim>
      <spf>pass</spf>
    </policy_evaluated>
  </row>
</record>
```

**Goal**: ≥ 95% of records show `dkim=pass` AND `spf=pass` before moving to Phase 2.

---

### Phase 2: Quarantine

Once alignment is confirmed in reports:

```
v=DMARC1; p=quarantine; pct=10; rua=mailto:dmarc-reports@cardmax.com; aspf=r; adkim=r
```

- **`p=quarantine`**: Non-aligned messages go to spam folder.
- **`pct=10`**: Apply policy to only 10% of messages initially.
- Increase `pct` gradually: 10 → 25 → 50 → 100 over 2–3 weeks.

---

### Phase 3: Reject (Full Enforcement)

After 2–4 weeks of clean quarantine reports:

```
v=DMARC1; p=reject; rua=mailto:dmarc-reports@cardmax.com; ruf=mailto:dmarc-forensics@cardmax.com; aspf=r; adkim=r
```

- **`p=reject`**: Non-aligned messages are rejected outright.
- **`ruf=`**: Forensic reports for individual failures (optional).

---

## 5. Verification Checklist

| Step | Tool | Expected Result |
|---|---|---|
| SPF lookup | `dig TXT cardmax.com` | Should return exactly one SPF record |
| DKIM lookup | `dig TXT cardmax._domainkey.cardmax.com` | Should return `v=DKIM1; k=rsa; p=...` |
| DMARC lookup | `dig TXT _dmarc.cardmax.com` | Should return your current DMARC policy |
| Online validator | [mxtoolbox.com/dmarc](https://mxtoolbox.com/dmarc.aspx) | All three green ✓ |

---

## 6. CardMax Health Endpoint

```
GET /api/notifications/email-domain-health
Authorization: Admin session required
```

Returns the current DNS record recommendations based on your active `EMAIL_PROVIDER` and `DKIM_*` env configuration.

---

## 7. Common Mistakes

| Mistake | Impact | Fix |
|---|---|---|
| Multiple SPF records | All SPF checks fail | Merge into one `v=spf1` record |
| Moving to `p=reject` without monitoring | Legitimate emails dropped | Always start at `p=none` |
| DKIM private key with literal newlines in `.env` | Signing fails silently | Use `\n` escape sequences |
| DKIM public key with headers | DNS record invalid | Strip `-----BEGIN PUBLIC KEY-----` lines |
| Forgetting `pct` in quarantine phase | Full impact immediately | Add `pct=10` to ramp gradually |
