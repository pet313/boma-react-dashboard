<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('mobs')) {
            // Safely add missing columns for Features 2 & 3 if they don't exist yet
            Schema::table('mobs', function (Blueprint $table) {
                if (!Schema::hasColumn('mobs', 'grn_generated')) {
                    $table->boolean('grn_generated')->default(false);
                    $table->string('pdf_path')->nullable();
                    $table->enum('email_status', ['PENDING', 'SENT', 'FAILED'])->default('PENDING');
                    $table->timestamp('email_sent_at')->nullable();
                    $table->text('email_error')->nullable();
                }
                if (!Schema::hasColumn('mobs', 'total_weight')) {
                    $table->decimal('total_weight', 10, 3)->default(0);
                }
            });
            return;
        }

        Schema::create('mobs', function (Blueprint $table) {
            $table->id();
            $table->string('mob_number')->nullable();          // auto-generated after insert
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('restrict');
            $table->foreignId('received_by')->constrained('users')->onDelete('restrict');
            $table->string('location');
            $table->string('cost_center')->nullable();
            $table->string('ar_number')->nullable();
            $table->string('supplier_inv_no')->nullable();
            $table->string('adv_no')->nullable();
            $table->string('order_no')->nullable();
            $table->string('storage')->nullable();
            $table->date('received_date');
            $table->string('grn_number')->nullable();          // auto-generated after insert

            // ── Feature 1: MOB status (replaces old draft/submitted enum) ──
            $table->enum('mob_status', ['OPEN', 'CLOSED'])->default('OPEN');
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();

            // ── Feature 2+3: GRN + email tracking ──────────────────────────
            $table->boolean('grn_generated')->default(false);
            $table->string('pdf_path')->nullable();
            $table->enum('email_status', ['PENDING', 'SENT', 'FAILED'])->default('PENDING');
            $table->timestamp('email_sent_at')->nullable();
            $table->text('email_error')->nullable();

            $table->decimal('total_weight', 10, 3)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->boolean('synced')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mobs');
    }
};
