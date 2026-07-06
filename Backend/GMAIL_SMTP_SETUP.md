# Gmail SMTP Configuration Guide — KMC GRN System

## Step 1 — Get a Gmail App Password
Google now requires **App Passwords** (not your normal Gmail password).

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** (required)
3. Go to **Security → App Passwords**
4. Click **Select app → Mail**, **Select device → Other** → type "KMC Server"
5. Click **Generate** — copy the 16-character password shown

## Step 2 — Update your `.env` file
Open `backend/.env` and set these values:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-kmc-email@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx     # the 16-char App Password (spaces OK)
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-kmc-email@gmail.com
MAIL_FROM_NAME="Kenya Meat Commission"
```

## Step 3 — Clear config cache
```bash
php artisan config:clear
php artisan cache:clear
```

## Step 4 — Test email delivery
```bash
php artisan tinker
>>> Mail::raw('KMC test', fn($m) => $m->to('test@example.com')->subject('Test'));
```

## Step 5 — Ensure storage/grns directory exists
```bash
mkdir -p storage/app/grns
chmod 775 storage/app/grns
php artisan storage:link
```

## Troubleshooting
| Problem | Fix |
|---|---|
| `Failed to authenticate` | Re-generate App Password; ensure 2FA is on |
| `Connection timeout` | Port 587 blocked — try port 465 with `MAIL_ENCRYPTION=ssl` |
| `PDF not found` | Run `mkdir -p storage/app/grns` and check disk space |
| Email sends but PDF missing | Check `MAIL_MAILER` is not `log` in production |

## Email Status Flow
```
MOB CLOSED → GRN PDF generated → Email sent
                                      ↓
                               email_status = SENT ✓
                               OR
                               email_status = FAILED ✗
                                      ↓
                               POST /mobs/{id}/retry-email (via app or cron)
```

## Production Cron for Retry (optional)
Add to `app/Console/Kernel.php`:
```php
$schedule->call(function () {
    \App\Models\Mob::where('mob_status', 'CLOSED')
        ->where('email_status', 'FAILED')
        ->where('grn_generated', true)
        ->get()
        ->each(fn($mob) => app(\App\Http\Controllers\Api\MobController::class)
            ->retryEmailDirect($mob));
})->hourly();
```
