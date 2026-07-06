# ─────────────────────────────────────────────────────────────────────────────
# KMC Livestock GRN — Render Deployment Dockerfile
# PHP 8.4 + PostgreSQL + DomPDF
# ─────────────────────────────────────────────────────────────────────────────
FROM php:8.4-cli

WORKDIR /app

ENV COMPOSER_MEMORY_LIMIT=-1

# System deps: PostgreSQL client libs + GD + zip + git + mbstring + intl
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    libpq-dev \
    libgd-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libonig-dev \
    libicu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pdo_mysql \
        gd \
        zip \
        opcache \
        mbstring \
        intl \
        pcntl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy composer binary from official image
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Copy project files
COPY . .

# Delete stale lock file to ensure compatibility with PHP 8.4
RUN rm -f composer.lock

# Install PHP dependencies
# --no-scripts is CRITICAL here to prevent artisan from running before setup
RUN COMPOSER_ALLOW_SUPERUSER=1 composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --prefer-dist \
    --no-scripts

# Create required Laravel directories and set permissions
RUN mkdir -p \
        storage/app/grns \
        storage/app/public \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Copy .env.example to .env
#no need to copy .env.example since render-start.sh will generate .env from env vars at runtime

# Note: artisan key:generate and package:discover are handled in render-start.sh

EXPOSE 10000

# Start via the render-start script
CMD ["bash", "render-start.sh"]
