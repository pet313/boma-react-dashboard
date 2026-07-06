<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('employee_id')->unique();
                $table->string('email')->nullable()->unique();
                $table->string('password');
                $table->enum('role', ['admin', 'officer', 'accounts'])->default('officer');
                $table->string('location')->nullable();
                $table->boolean('is_active')->default(true);
                $table->boolean('can_manual_weight')->default(false);
                $table->timestamp('last_seen')->nullable();
                $table->rememberToken();
                $table->timestamps();
            });
        } else {
            // Table exists — add any missing columns safely
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'can_manual_weight')) {
                    $table->boolean('can_manual_weight')->default(false)->after('is_active');
                }
                if (! Schema::hasColumn('users', 'last_seen')) {
                    $table->timestamp('last_seen')->nullable()->after('can_manual_weight');
                }
                if (! Schema::hasColumn('users', 'email')) {
                    $table->string('email')->nullable()->after('employee_id');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
