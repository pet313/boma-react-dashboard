<?php

/**
 * KMC GRN — Mail Configuration
 *
 * RENDER ENVIRONMENT VARIABLES REQUIRED:
 * ─────────────────────────────────────────────────────────
 *   MAIL_MAILER       = smtp
 *   MAIL_HOST         = smtp.gmail.com
 *   MAIL_PORT         = 587
 *   MAIL_ENCRYPTION   = tls
 *   MAIL_USERNAME     = your-gmail@gmail.com
 *   MAIL_PASSWORD     = your-16-char-app-password
 *   MAIL_FROM_ADDRESS = your-gmail@gmail.com
 *   MAIL_FROM_NAME    = Kenya Meat Commission
 * ─────────────────────────────────────────────────────────
 *
 * IMPORTANT: Do NOT set MAIL_MAILER=log in Render.
 * The log driver writes emails to the log file instead of sending them.
 * This is why "sent successfully" appeared in logs but no email arrived.
 */

return [

    // Default mailer — reads MAIL_MAILER from Render env vars
    // Fallback is 'smtp' NOT 'log' to prevent silent email loss
    'default' => env('MAIL_MAILER', 'smtp'),

    'mailers' => [

        'smtp' => [
            'transport'    => 'smtp',
            'host'         => env('MAIL_HOST', 'smtp.gmail.com'),
            'port'         => (int) env('MAIL_PORT', 587),
            'encryption'   => env('MAIL_ENCRYPTION', 'tls'),
            'username'     => env('MAIL_USERNAME'),
            'password'     => env('MAIL_PASSWORD'),
            'timeout'      => 30,
            // local_domain is used in the EHLO handshake.
            // Setting it explicitly avoids issues on Render where
            // parse_url(APP_URL) may return an internal hostname.
            'local_domain' => env('MAIL_EHLO_DOMAIN', 'gmail.com'),
            // Stream context — required on some hosting providers
            // that have stricter SSL verification
            'stream' => [
                'ssl' => [
                    'allow_self_signed' => true,
                    'verify_peer'       => false,
                    'verify_peer_name'  => false,
                ],
            ],
        ],

        // log driver — only used for local development
        // Never set MAIL_MAILER=log in production/Render
        'log' => [
            'transport' => 'log',
            'channel'   => env('MAIL_LOG_CHANNEL', 'stack'),
        ],

        'array' => [
            'transport' => 'array',
        ],

        // failover: tries smtp first, falls back to log if smtp fails completely
        // Use MAIL_MAILER=failover during testing to see both attempts in logs
        'failover' => [
            'transport' => 'failover',
            'mailers'   => ['smtp', 'log'],
        ],

    ],

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'noreply@kmc.go.ke'),
        'name'    => env('MAIL_FROM_NAME',    'Kenya Meat Commission'),
    ],

];
