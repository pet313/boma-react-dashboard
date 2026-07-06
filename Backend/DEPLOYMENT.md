# KMC Livestock GRN — Production Deployment Guide

## Prerequisites
- PHP 8.2+, Composer, MySQL 8+, Redis (optional but recommended)

## Steps

### 1. Environment Setup
```bash
cp .env.example .env
# Edit .env — set APP_KEY, DB credentials, APP_URL
php artisan key:generate
```

### 2. Install Dependencies
```bash
composer install --optimize-autoloader --no-dev
```

### 3. Database
```bash
php artisan migrate --force
php artisan db:seed --force   # Creates default admin + sample farmers
```

### 4. Optimise
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 5. Permissions
```bash
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

### 6. Nginx (example)
```nginx
location /api/ {
    try_files $uri $uri/ /index.php?$query_string;
}
```

## Default Credentials (change immediately after first login)
| Role     | Employee ID | Password       |
|----------|-------------|----------------|
| Admin    | KMCADMIN001 | Admin@1234     |
| Officer  | KMCOFF001   | Officer@1234   |
| Accounts | KMCACC001   | Accounts@1234  |

## Security Checklist
- [ ] Change all default passwords
- [ ] Set APP_DEBUG=false
- [ ] Rotate APP_KEY
- [ ] Restrict DB user to only `kmc_grn` database
- [ ] Enable HTTPS
- [ ] Set SANCTUM_STATEFUL_DOMAINS to your actual domain
