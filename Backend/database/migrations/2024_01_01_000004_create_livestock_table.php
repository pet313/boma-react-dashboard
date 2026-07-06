<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('livestock')) return;
        Schema::create('livestock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mob_id')->constrained('mobs')->onDelete('cascade');
            $table->string('livestock_number');     // LIV001, LIV002...
            $table->enum('species', ['cattle','sheep','goat','camel']);
            $table->enum('gender', ['male','female']);
            $table->string('unit_code')->nullable();
            $table->string('unit', 5)->default('KG');
            $table->decimal('weight', 8, 3);
            $table->boolean('weight_locked')->default(true);
            $table->string('scale_device_id')->nullable();
            $table->decimal('unit_price', 10, 2)->default(0); // 0 at boma — filled at office
            $table->decimal('value', 12, 2)->default(0);
            $table->integer('item_no')->default(1);
            $table->string('item_description')->nullable();    // e.g. CATTLE BULL
            $table->timestamps();
            $table->index(['mob_id', 'item_no']);
        });
    }
    public function down(): void { Schema::dropIfExists('livestock'); }
};
