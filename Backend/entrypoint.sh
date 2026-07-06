#!/bin/sh

# Manually clear compiled classes and cached config to prevent version mismatch errors
rm -f bootstrap/cache/config.php
rm -f bootstrap/cache/packages.php
rm -f bootstrap/cache/services.php
rm -f bootstrap/cache/routes.php

# Clear cache and optimize
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Run migrations (force for production environment)
php artisan migrate --force --seed

# Start PHP-FPM in the background
php-fpm -D

# Start Nginx in the foreground
nginx -g "daemon off;"
