<?php

namespace App\Jobs;

use App\Mail\GrnDeliveryMail;
use App\Models\Mob;
use Barryvdh\DomPDF\Facade\Pdf;
use chillerlan\QRCode\QRCode;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class GenerateAndSendGrn implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Mob $mob
    ) {}

    public function handle(): void
    {
        $mob = $this->mob;
        $mob->load(['supplier', 'officer', 'livestock']);

        // 1. Generate PDF if not already generated or missing
        $diskName = config('filesystems.grn_disk', 'public');
        $disk = Storage::disk($diskName);

        if (!$mob->pdf_path || !$disk->exists($mob->pdf_path)) {
            try {
                $qrData = "GRN: {$mob->grn_number} | MOB: {$mob->mob_number} | Supplier: {$mob->supplier->name} | Weight: " . number_format($mob->total_weight, 3) . " KG | Date: " . $mob->received_date->format('d/m/Y');
                $qrCode = (new QRCode)->render($qrData);

                $pdf = Pdf::loadView('grn.goods_received_note', [
                    'mob'    => $mob,
                    'copy'   => 'farmer',
                    'qrCode' => $qrCode,
                ])->setPaper('a4', 'portrait');

                $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $mob->grn_number);
                $relPath  = 'grns/GRN_' . $safeName . '_farmer.pdf';

                $disk->makeDirectory('grns');
                $disk->put($relPath, $pdf->output());

                $mob->update([
                    'grn_generated' => true,
                    'pdf_path'      => $relPath,
                ]);

                Log::info("Job: GRN PDF generated for mob #{$mob->id}");
            } catch (\Throwable $e) {
                Log::error("Job: GRN PDF failed for mob #{$mob->id}: " . $e->getMessage());
                $this->updateEmailStatus('FAILED', $e->getMessage());
                return;
            }
        }

        // 2. Send Email
        $supplierEmail = $mob->supplier?->email;
        if (!$supplierEmail || !filter_var($supplierEmail, FILTER_VALIDATE_EMAIL)) {
            $this->updateEmailStatus('FAILED', 'Invalid or missing supplier email.');
            return;
        }

        if (config('mail.default') === 'log') {
            Log::warning("Job: Mail driver is 'log' for mob #{$mob->id}");
            $this->updateEmailStatus('FAILED', "Mail driver is 'log'.");
            return;
        }

        try {
            Mail::to($supplierEmail)->send(new GrnDeliveryMail($mob));
            $this->updateEmailStatus('SENT');
            Log::info("Job: GRN email sent for mob #{$mob->id} to {$supplierEmail}");
        } catch (\Throwable $e) {
            Log::error("Job: GRN email failed for mob #{$mob->id}: " . $e->getMessage());
            $this->updateEmailStatus('FAILED', $e->getMessage());
        }
    }

    private function updateEmailStatus(string $status, ?string $error = null): void
    {
        DB::table('mobs')->where('id', $this->mob->id)->update([
            'email_status'  => $status,
            'email_sent_at' => $status === 'SENT' ? now() : null,
            'email_error'   => $error ? mb_strcut($error, 0, 500) : null,
            'updated_at'    => now(),
        ]);
    }
}
