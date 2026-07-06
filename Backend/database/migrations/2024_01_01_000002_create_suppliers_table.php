<?php
// database/migrations/2024_01_01_000002_create_suppliers_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('suppliers')) return;
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('farmer_no')->unique(); // e.g. KMCF00001
            $table->string('name');
            $table->string('id_number')->unique(); // National ID
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('location'); // county / sub-county
            $table->string('bank_name')->nullable();
            $table->string('bank_account')->nullable();
            $table->string('kra_pin')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
