<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (config('database.default') === 'pgsql' && Schema::hasTable('mobs')) {
            // 1. Drop the problematic legacy check constraint on the 'status' column
            DB::statement("ALTER TABLE mobs DROP CONSTRAINT IF EXISTS mobs_status_check");

            // 2. If the legacy 'status' column exists, ensure its default is 'draft'
            //    and update any existing 'OPEN' values to 'draft' to prevent future issues.
            if (Schema::hasColumn('mobs', 'status')) {
                DB::statement("ALTER TABLE mobs ALTER COLUMN status SET DEFAULT 'draft'");
                DB::statement("UPDATE mobs SET status = 'draft' WHERE status = 'OPEN'");
            }

            // 3. Ensure the 'mob_status' column has its correct check constraint.
            //    This handles cases where the constraint might have been dropped or misconfigured.
            DB::statement("ALTER TABLE mobs DROP CONSTRAINT IF EXISTS mobs_mob_status_check");
            DB::statement("ALTER TABLE mobs ADD CONSTRAINT mobs_mob_status_check CHECK (mob_status IN ('OPEN', 'CLOSED'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reversing this migration would involve re-adding the old constraint,
        // which is not recommended as it caused issues.
        // For safety, we'll leave this empty or add a warning.
        // If needed, manual rollback would be required.
    }
};