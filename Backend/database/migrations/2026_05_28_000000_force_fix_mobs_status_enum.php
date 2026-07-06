<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fixes the 'Check violation' on PostgreSQL by dropping any old/invalid
     * enum constraints and recreating them with the correct UPPERCASE values.
     */
    public function up(): void
    {
        // 1. Drop known constraint names that Laravel/Postgres might have generated
        DB::statement('ALTER TABLE mobs DROP CONSTRAINT IF EXISTS mobs_mob_status_check');
        DB::statement('ALTER TABLE mobs DROP CONSTRAINT IF EXISTS mobs_status_check');

        // 2. Force the column to be a standard VARCHAR(20) to avoid ENUM type issues
        DB::statement('ALTER TABLE mobs ALTER COLUMN mob_status TYPE VARCHAR(20)');

        // 3. Set the default value to uppercase OPEN
        DB::statement("ALTER TABLE mobs ALTER COLUMN mob_status SET DEFAULT 'OPEN'");

        // 4. Add the definitive check constraint
        DB::statement("ALTER TABLE mobs ADD CONSTRAINT mobs_mob_status_check CHECK (mob_status IN ('OPEN', 'CLOSED'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE mobs DROP CONSTRAINT IF EXISTS mobs_mob_status_check');
    }
};
