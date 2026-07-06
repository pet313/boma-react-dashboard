<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Livestock extends Model
{
    protected $table = 'livestock';

    protected $fillable = [
        'mob_id', 'livestock_number', 'species', 'gender',
        'unit_code', 'unit', 'weight', 'weight_locked',
        'scale_device_id', 'manual_entry', 'manual_reason',
        'unit_price', 'value', 'item_no', 'item_description',
    ];

    protected $casts = [
        'weight'        => 'decimal:3',
        'unit_price'    => 'decimal:2',
        'value'         => 'decimal:2',
        'weight_locked' => 'boolean',
        'manual_entry'  => 'boolean',
    ];

    public function mob(): BelongsTo
    {
        return $this->belongsTo(Mob::class);
    }
}
