<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Goods Received Note - {{ $mob->grn_number }}</title>
<style>
  @page { margin: 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Helvetica", "Arial", sans-serif;
    font-size: 9pt;
    color: #1a1a1a;
    line-height: 1.2;
  }
  .page { padding: 5mm; position: relative; }

  /* Typography */
  h1 { font-family: "Georgia", serif; font-size: 18pt; font-weight: bold; color: #003893; margin-bottom: 2pt; }
  h2 { font-size: 12pt; font-weight: bold; color: #C8102E; text-transform: uppercase; letter-spacing: 1pt; }
  .text-bold { font-weight: bold; }
  .text-uppercase { text-transform: uppercase; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }

  /* Layout Tables */
  .w-100 { width: 100%; }
  table.layout { border-collapse: collapse; border: none; }
  table.layout td { vertical-align: top; border: none; }

  /* Header */
  .header-table { margin-bottom: 5mm; border-bottom: 2pt solid #003893; padding-bottom: 3mm; }
  .address-block { font-size: 7.5pt; color: #444; line-height: 1.4; }
  .address-block strong { color: #003893; }

  .title-section { margin: 5mm 0; border-top: 1pt solid #eee; border-bottom: 1pt solid #eee; padding: 3mm 0; }

  /* Info Grid */
  .info-table { margin-bottom: 5mm; }
  .info-box { border: 1pt solid #000; padding: 3mm; min-height: 25mm; }
  .label { color: #003893; font-weight: bold; width: 25mm; display: inline-block; }
  .value { font-weight: bold; border-bottom: 0.5pt solid #ddd; padding-left: 2mm; }

  .copy-badge {
    background: #fdf2f2; color: #C8102E; padding: 2mm; text-align: center;
    font-weight: 800; border: 1pt solid #f8d7da; margin-bottom: 5mm;
    text-transform: uppercase; font-size: 10pt;
  }

  /* Data Table */
  table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
  table.data-table th {
    background: #f0f4ff; color: #003893; padding: 3mm 2mm;
    font-weight: bold; text-transform: uppercase; font-size: 8pt;
    border: 1pt solid #000;
  }
  table.data-table td { padding: 3mm 2mm; border: 1pt solid #000; font-size: 8.5pt; }
  table.data-table tr.even { background: #f9f9f9; }

  /* Totals */
  .totals-table { margin-bottom: 5mm; }
  .total-row td { padding: 2mm; font-size: 11pt; font-weight: 900; color: #003893; }
  .total-value { border-bottom: 2pt double #003893; width: 40mm; }

  /* Signatures */
  table.sig-table { width: 100%; border-collapse: collapse; margin-top: 5mm; }
  table.sig-table td { border: 1pt solid #000; height: 18mm; vertical-align: top; padding: 2mm; width: 33.33%; }
  .sig-label { font-size: 7.5pt; font-weight: bold; color: #003893; text-transform: uppercase; margin-bottom: 10mm; }

  .footer {
    position: absolute; bottom: 0; left: 0; right: 0;
    border-top: 1pt solid #003893; padding-top: 2mm;
    font-size: 7.5pt; color: #666;
  }

  .qr-section { margin-top: 5mm; }
</style>
</head>
<body>
<div class="page">

  {{-- Header --}}
  <table class="w-100 layout header-table">
    <tr>
      <td style="width: 25%;">
        {{-- If logo file exists, use it --}}
        <div style="font-family: Georgia, serif; font-size: 28pt; font-weight: 900; color: #003893; border: 4pt solid #003893; padding: 2mm; display: inline-block;">KMC</div>
      </td>
      <td style="width: 50%;" class="text-center">
        <h1>KENYA MEAT COMMISSION</h1>
        <p style="font-weight: bold; font-style: italic; color: #C8102E; font-size: 8pt;">"A Cut Above The Best"</p>
      </td>
      <td style="width: 25%;" class="text-right address-block">
        <strong>Headquarters</strong><br>
        Athi River, P.O Box 2-00204<br>
        Tel: +254 45 6626041<br>
        accounts@kenyameat.co.ke
      </td>
    </tr>
  </table>

  <div class="title-section text-center">
    <h2>Goods Received Note (GRN)</h2>
  </div>

  <div class="copy-badge">{{ strtoupper($copy) }}'S COPY</div>

  {{-- Info Grid --}}
  <table class="w-100 layout info-table" style="border-spacing: 5mm 0; margin-left: -5mm; width: calc(100% + 10mm);">
    <tr>
      <td style="width: 55%;">
        <div class="info-box">
          <p class="sig-label">Supplier Details</p>
          <p><span class="label">Name:</span> <span class="value text-uppercase">{{ $mob->supplier->name }}</span></p>
          <p><span class="label">Farmer No:</span> <span class="value">{{ $mob->supplier->farmer_no }}</span></p>
          <p><span class="label">ID Number:</span> <span class="value">{{ $mob->supplier->id_number }}</span></p>
          <p><span class="label">Phone:</span> <span class="value">{{ $mob->supplier->phone }}</span></p>
        </div>
      </td>
      <td style="width: 45%;">
        <div class="info-box">
          <p class="sig-label">Reference Information</p>
          <p><span class="label">GRN No:</span> <span class="value" style="color: #C8102E;">{{ $mob->grn_number }}</span></p>
          <p><span class="label">MOB No:</span> <span class="value">{{ $mob->mob_number }}</span></p>
          <p><span class="label">Location:</span> <span class="value">{{ $mob->location }}</span></p>
          <p><span class="label">Date:</span> <span class="value">{{ $mob->received_date->format('d/m/Y') }}</span></p>
        </div>
      </td>
    </tr>
  </table>

  {{-- Meta fields --}}
  <table class="w-100 layout" style="margin-bottom: 5mm; font-size: 8pt; border: 0.5pt solid #ddd; padding: 2mm; background: #fafafa;">
    <tr>
      <td><strong>Storage:</strong> {{ $mob->storage ?: 'N/A' }}</td>
      <td><strong>AR No:</strong> {{ $mob->ar_number ?: 'N/A' }}</td>
      <td><strong>Inv No:</strong> {{ $mob->supplier_inv_no ?: 'N/A' }}</td>
      <td><strong>Order No:</strong> {{ $mob->order_no ?: 'N/A' }}</td>
    </tr>
  </table>

  {{-- Data Table --}}
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 8%;">#</th>
        <th style="width: 20%;">Tag / Unit Code</th>
        <th>Item Description</th>
        <th style="width: 18%;" class="text-right">Weight (KG)</th>
        <th style="width: 18%;" class="text-right">Value (KES)</th>
      </tr>
    </thead>
    <tbody>
      @foreach($mob->livestock as $index => $animal)
      <tr class="{{ $index % 2 == 1 ? 'even' : '' }}">
        <td class="text-center">{{ $animal->item_no ?: $index + 1 }}</td>
        <td class="text-center text-bold">{{ $animal->livestock_number ?: $animal->unit_code }}</td>
        <td>{{ $animal->item_description ?: 'Livestock Consignment' }}</td>
        <td class="text-right">{{ number_format($animal->weight, 3) }}</td>
        <td class="text-right">{{ number_format($animal->value, 2) }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>

  {{-- Totals --}}
  <table class="w-100 layout totals-table">
    <tr>
      <td style="width: 50%;">
        <div class="qr-section">
          @if(isset($qrCode))
            <img src="{{ $qrCode }}" style="width: 25mm; height: 25mm;" />
          @endif
          <p style="font-size: 6pt; font-weight: bold; color: #666; margin-top: 1mm; text-transform: uppercase;">Digital Verification QR Code</p>
        </div>
      </td>
      <td style="width: 50%;">
        <table class="w-100 layout">
          <tr class="total-row">
            <td class="text-right">TOTAL LIVE WEIGHT:</td>
            <td class="text-right total-value">{{ number_format($mob->total_weight, 3) }} KG</td>
          </tr>
          <tr class="total-row">
            <td class="text-right">TOTAL NET VALUE:</td>
            <td class="text-right total-value">KES {{ number_format($mob->total_amount, 2) }}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  {{-- Signatures --}}
  <table class="sig-table">
    <tr>
      <td>
        <div class="sig-label">Received By (Measuring Officer)</div>
        <p style="font-size: 8pt;">Name: {{ $mob->officer->name }}</p>
        <p style="font-size: 8pt; margin-top: 2mm; border-top: 0.5pt solid #000; padding-top: 1mm;">Sign/Date:</p>
      </td>
      <td>
        <div class="sig-label">Verified By (Audit/Accounts)</div>
        <p style="font-size: 8pt; margin-top: 8mm; border-top: 0.5pt solid #000; padding-top: 1mm;">Sign/Date:</p>
      </td>
      <td>
        <div class="sig-label">Supplier Acceptance</div>
        <p style="font-size: 8pt; margin-top: 8mm; border-top: 0.5pt solid #000; padding-top: 1mm;">Sign/Date:</p>
      </td>
    </tr>
  </table>

  <div style="margin-top: 5mm; font-size: 8pt; color: #444; font-style: italic;">
    <strong>Note:</strong> This is a system-generated document. Official hard copies with security stamps are available at the Livestock Department.
  </div>

  <div class="footer">
    <table class="w-100 layout">
      <tr>
        <td>System GRN Ref: {{ $mob->grn_number }}</td>
        <td class="text-center">KMC Livestock Tracking System v3.0</td>
        <td class="text-right">Generated: {{ date('d/m/Y H:i') }}</td>
      </tr>
    </table>
  </div>

</div>
</body>
</html>
