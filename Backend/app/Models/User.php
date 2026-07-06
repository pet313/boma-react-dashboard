<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name', 'employee_id', 'email', 'password',
        'role', 'location', 'is_active', 'can_manual_weight', 'last_seen',
        'failed_attempts', 'locked_until',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'is_active'         => 'boolean',
        'can_manual_weight' => 'boolean',
        'last_seen'         => 'datetime',
        'locked_until'      => 'datetime',
        'password'          => 'hashed',
    ];

    public function mobs(): HasMany
    {
        return $this->hasMany(Mob::class, 'received_by');
    }

    /** Touch last_seen — called by AuthController on every authenticated request. */
    public function touchLastSeen(): void
    {
        $this->timestamps = false;

        $data = ['last_seen' => now()];

        // Defensive check: only update security columns if they exist in the DB
        // This prevents crashes if migrations haven't run yet in production.
        if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'failed_attempts')) {
            $data['failed_attempts'] = 0;
            $data['locked_until']    = null;
        }

        $this->update($data);
        $this->timestamps = true;
    }

    public function isLocked(): bool
    {
        if (!\Illuminate\Support\Facades\Schema::hasColumn('users', 'locked_until')) {
            return false;
        }
        return $this->locked_until && $this->locked_until->isFuture();
    }
}
