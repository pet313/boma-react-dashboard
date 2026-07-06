# KMC Livestock GRN — API Documentation (v8)

Base URL: `http://<server>:8000/api`
Auth: Bearer token via `Authorization: Bearer {token}` header

---

## Authentication
| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| POST | `/auth/login` | `{employee_id, password}` | Returns `{token, user}` |
| POST | `/auth/logout` | — | Invalidates token |
| GET | `/auth/me` | — | Returns current user |

---

## MOBs

### List MOBs
`GET /mobs?mob_status=OPEN|CLOSED&supplier_id=&date_from=&date_to=`

### Create MOB
`POST /mobs`
```json
{
  "supplier_id": 1, "location": "Nairobi", "received_date": "2026-05-01",
  "cost_center": null, "ar_number": null, "storage": null
}
```
Response: MOB object with `mob_status: "OPEN"`

### Get MOB
`GET /mobs/{id}` — includes supplier, livestock, officer, closedByUser

### Update MOB
`PUT /mobs/{id}` — blocked if `mob_status = CLOSED` (unless admin)

### Delete MOB
`DELETE /mobs/{id}` — blocked if `mob_status = CLOSED`

---

## ★ Close MOB (Feature 1 + 2 + 3)
`POST /mobs/{id}/close`

No request body required.

**Permissions:** `officer` or `admin` role only.

**What happens atomically:**
1. MOB marked `CLOSED` with `closed_at`, `closed_by`
2. GRN PDF generated and saved to `storage/app/grns/`
3. GRN PDF emailed to supplier automatically

**Response (200):**
```json
{
  "message": "MOB closed successfully. GRN generated and emailed to supplier.",
  "mob_status": "CLOSED",
  "closed_at": "2026-05-01T10:30:00Z",
  "closed_by": "John Doe",
  "grn_number": "KMC/GRN/2026/000001",
  "grn_generated": true,
  "pdf_path": "grns/GRN_KMC_GRN_2026_000001_farmer.pdf",
  "email_status": "SENT",
  "email_message": null,
  "total_animals": 25,
  "total_weight": 3450.750
}
```

**Error (422):** MOB already closed / MOB is empty  
**Error (403):** User is not an officer or admin

---

## ★ Retry GRN Email
`POST /mobs/{id}/retry-email`

Retries failed GRN email delivery. Only for CLOSED mobs with `email_status = FAILED`.

**Response (200):**
```json
{ "message": "GRN email sent successfully.", "email_status": "SENT" }
```

---

## GRN (read-only — CLOSED mobs only)
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/mobs/{id}/grn-data` | JSON summary for app display |
| GET | `/mobs/{id}/grn?copy=farmer\|commission` | Download PDF |

Both return **422** if MOB is still OPEN.

---

## Livestock (blocked for CLOSED mobs)
| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/mobs/{mob}/livestock` | 422 if MOB is CLOSED |
| PUT | `/mobs/{mob}/livestock/{id}` | 422 if MOB is CLOSED |
| DELETE | `/mobs/{mob}/livestock/{id}` | 422 if MOB is CLOSED |

---

## Sync (offline MOBs)
`POST /sync/mobs` — bulk create from Android offline queue

---

## MOB Status Flow
```
CREATE → mob_status = OPEN
           │
           │  Add animals freely
           │
         POST /close
           │
           ↓
        mob_status = CLOSED
           │ grn_generated = true
           │ pdf_path = "grns/..."
           │ email_status = SENT | FAILED
           │
         (if FAILED)
         POST /retry-email
```

---

## MOB Object Fields (v8 additions)
| Field | Type | Description |
|-------|------|-------------|
| `mob_status` | enum | `OPEN` or `CLOSED` |
| `closed_at` | datetime | When MOB was closed |
| `closed_by` | int | User ID who closed it |
| `grn_generated` | bool | Whether PDF was created |
| `pdf_path` | string | Relative path to stored PDF |
| `email_status` | enum | `PENDING`, `SENT`, `FAILED` |
| `email_sent_at` | datetime | When email was sent |
| `email_error` | string | Error message if FAILED |
