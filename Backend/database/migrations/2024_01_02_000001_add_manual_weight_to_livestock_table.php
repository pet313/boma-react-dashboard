<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('livestock', 'manual_entry')) return;
        Schema::table('livestock', function (Blueprint $table) {
            $table->boolean('manual_entry')->default(false)->after('scale_device_id');
            $table->string('manual_reason')->nullable()->after('manual_entry');
        });
    }

    public function down(): void
    {
        Schema::table('livestock', function (Blueprint $table) {
            $table->dropColumn(['manual_entry', 'manual_reason']);
        });
    }
};
