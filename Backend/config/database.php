<?php

use Illuminate\Support\Str;

/**
 * Database configuration.
 * On Render, DATABASE_URL is set automatically when a PostgreSQL DB is attached.
 *
 * IMPORTANT: conn_max_age is set to 0 (no persistent connections) to prevent
 * PostgreSQL's "cached plan must not change result type" error, which occurs
 * when a connection reuses a prepared statement cache after schema changes.
 */
$dbUrl = env('DATABASE_URL', env('DB_URL', null));

return [

    'default' => env('DB_CONNECTION', 'pgsql'),

    'connections' => [

        'pgsql' => [
            'driver'      => 'pgsql',
            'url'         => $dbUrl,
            'host'        => env('DB_HOST', '127.0.0.1'),
            'port'        => env('DB_PORT', '5432'),
            'database'    => env('DB_DATABASE', 'kmc_grn'),
            'username'    => env('DB_USERNAME', 'kmc'),
            'password'    => env('DB_PASSWORD', ''),
            'charset'     => 'utf8',
            'prefix'      => '',
            'schema'      => 'public',
            'sslmode'     => env('DB_SSLMODE', 'prefer'),
            // DO NOT use persistent connections on Render PostgreSQL.
            // Persistent connections (conn_max_age > 0) cause PostgreSQL to
            // cache prepared statement plans. After a schema change (new columns),
            // these cached plans go stale and throw:
            // "SQLSTATE[0A000]: cached plan must not change result type"
            // Setting to 0 forces a fresh connection per request — solves it.
            'options'     => [
                \PDO::ATTR_PERSISTENT => false,
            ],
        ],

        'sqlite' => [
            'driver'                  => 'sqlite',
            'database'                => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix'                  => '',
            'foreign_key_constraints' => true,
        ],

    ],

    'migrations' => [
        'table'                  => 'migrations',
        'update_date_on_publish' => true,
    ],

    'redis' => [
        'client'  => env('REDIS_CLIENT', 'phpredis'),
        'default' => [
            'host'     => env('REDIS_HOST', '127.0.0.1'),
            'password' => env('REDIS_PASSWORD', null),
            'port'     => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_DB', '0'),
        ],
    ],

];
