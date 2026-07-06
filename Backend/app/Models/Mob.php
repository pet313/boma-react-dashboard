<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Mob extends Model
{
    /**
     * Append computed attributes to JSON representations.
     */
    protected $appends = ['can_add_animals'];

    protected $fillable = [
        'mob_number', 'supplier_id', 'received_by', 'location',
        'cost_center', 'ar_number', 'supplier_inv_no', 'adv_no', 'order_no',
        'storage', 'received_date',
        'mob_status', 'closed_at', 'closed_by', // Status (OPEN/CLOSED)
        'status', // Keep for legacy sync support
        // GRN tracking
        'grn_number', 'grn_generated', 'pdf_path',
        'email_status', 'email_sent_at', 'email_error',
        // Totals
        'total_weight', 'total_amount', 'synced',
    ];

    /**
     * Default values for attributes.
     */
    protected $attributes = [
        'mob_status' => 'OPEN',
        'status'     => 'draft', // Explicitly satisfy legacy PGSQL check constraints
    ];

    protected $casts = [
        'received_date'  => 'datetime',
        'closed_at'      => 'datetime',
        'email_sent_at'  => 'datetime',
        'total_weight'   => 'decimal:3',
        'total_amount'   => 'decimal:2',
        'synced'         => 'boolean',
        'grn_generated'  => 'boolean',
    ];

    /**
     * Auto-generate mob_number and grn_number after insert.
     * Default mob_status = OPEN.
     */
    protected static function booted(): void
    {
        static::created(function (Mob $mob) {
            $year            = now()->format('Y');
            $padded          = str_pad($mob->id, 6, '0', STR_PAD_LEFT);
            $mob->mob_number = "MOB{$padded}";
            $mob->grn_number = "KMC/GRN/{$year}/{$padded}";
            $mob->saveQuietly();
        });
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    /** Convenience: is this MOB currently open to new animals? */
    public function isOpen(): bool
    {
        return $this->mob_status === 'OPEN';
    }

    /** Whether the UI should allow adding animals to this MOB. */
    public function getCanAddAnimalsAttribute(): bool
    {
        return $this->mob_status !== 'CLOSED';
    }

    /** Convenience: has the GRN PDF already been generated? */
    public function grnReady(): bool
    {
        return (bool) $this->grn_generated;
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function officer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function closedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function livestock(): HasMany
    {
        return $this->hasMany(Livestock::class);
    }
}
