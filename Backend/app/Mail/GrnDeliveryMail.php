<?php

namespace App\Mail;

use App\Models\Mob;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;


class GrnDeliveryMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Mob $mob
    ) {}

    public function envelope(): Envelope
    {
        $grnNumber = $this->mob->grn_number ?? 'GRN';

        return new Envelope(
            subject: "KMC Goods Received Note: {$grnNumber}",
        );
    }

    public function content(): Content
    {
        // Always reload relations — SerializesModels drops them
        $mob = $this->mob;
        $mob->loadMissing(['supplier', 'livestock', 'officer']);

        // Null-safe extraction of every value
        $supplierName = $mob->supplier?->name ?? 'Valued Supplier';
        $officerName  = $mob->officer?->name  ?? '';
        $mobNumber    = $mob->mob_number       ?? '';
        $grnNumber    = $mob->grn_number       ?? '';

        // Animal count — safe regardless of relation load state
        try {
            $totalAnimals = $mob->relationLoaded('livestock')
                ? $mob->livestock->count()
                : $mob->livestock()->count();
        } catch (\Throwable $e) {
            Log::warning("GrnDeliveryMail: Could not count livestock for mob #{$mob->id}: " . $e->getMessage());
            $totalAnimals = 0;
        }

        // Weight — safe cast
        $totalWeight = '0.000';
        try {
            $totalWeight = number_format((float) ($mob->total_weight ?? 0), 3);
        } catch (\Throwable $e) {
            $totalWeight = '0.000';
        }

        // Received date — safe format
        $receivedDate = '';
        try {
            if ($mob->received_date !== null) {
                $receivedDate = is_string($mob->received_date)
                    ? $mob->received_date
                    : $mob->received_date->format('d/m/Y');
            }
        } catch (\Throwable $e) {
            $receivedDate = '';
        }

        return new Content(
            view: 'emails.grn_delivery',
            with: [
                'mob'          => $mob,
                'supplierName' => $supplierName,
                'mobNumber'    => $mobNumber,
                'grnNumber'    => $grnNumber,
                'totalAnimals' => $totalAnimals,
                'totalWeight'  => $totalWeight,
                'receivedDate' => $receivedDate,
                'officer'      => $officerName,
            ],
        );
    }

    /** @return array<int, Attachment> */
    public function attachments(): array
    {
        $pdfPath = $this->mob->pdf_path ?? null;
        $diskName = config('filesystems.grn_disk', 'public');

        if (empty($pdfPath)) {
            Log::warning("GrnDeliveryMail: No pdf_path set on mob #{$this->mob->id} — sending without attachment.");
            return [];
        }

        // Check via configured storage disk
        if (Storage::disk($diskName)->exists($pdfPath)) {
            $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $this->mob->grn_number ?? 'GRN');
            return [
                Attachment::fromStorageDisk($diskName, $pdfPath)
                    ->as("GRN_{$safeName}.pdf")
                    ->withMime('application/pdf'),
            ];
        }

        Log::error("GrnDeliveryMail: PDF not found on disk [{$diskName}] at [{$pdfPath}] for mob #{$this->mob->id}");
        return [];
    }
}
