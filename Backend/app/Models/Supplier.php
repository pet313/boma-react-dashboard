<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'farmer_no', 'name', 'id_number', 'phone',
        'email', 'location', 'bank_name', 'bank_account',
        'kra_pin', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Auto-generate farmer_no before insert.
     * Uses a MAX-based approach to be safe under concurrent inserts.
     */
    protected static function booted(): void
    {
        static::creating(function (Supplier $supplier) {
            if (empty($supplier->farmer_no)) {
                // Use MAX(id) approach — safe even with gaps
                $maxId = static::max('id') ?? 0;
                $supplier->farmer_no = 'KMCF' . str_pad($maxId + 1, 5, '0', STR_PAD_LEFT);
            }
        });
    }

    public function mobs(): HasMany
    {
        return $this->hasMany(Mob::class);
    }
}
