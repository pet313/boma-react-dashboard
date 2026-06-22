import kmclogo from '../assets/kmclogo.jpg'
import kmcslogan from '../assets/kmcslogan.png'

export function printGRN(grnData, mob) {
  const w = window.open("", "_blank");
  if (!w) return alert("Allow popups to print GRN");
  const data      = grnData || mob;
  const animals   = data.livestock || [];
  const supplier  = data.supplier  || mob.supplier || {};
  const officer   = data.officer   || mob.officer  || {};

  // ── QR payload (keep security feature) ──────────────────────────────────
  const qrData = [
    `GRN: ${data.grn_number  || mob.grn_number  || 'PENDING'}`,
    `MOB: ${data.mob_number  || mob.mob_number  || 'N/A'}`,
    `Supplier: ${supplier.name || 'N/A'}`,
    `Farmer No: ${supplier.farmer_no || 'N/A'}`,
    `Weight: ${Number(data.total_weight || mob.total_weight || 0).toFixed(3)} KG`,
  ].join(' | ');

  // ── Signature rows ───────────────────────────────────────────────────────
  const sigRows = [
    'Received By',
    'Verified By',
  ].map(label => `
    <tr>
      <td class="sig-label-cell">${label}</td>
      <td class="sig-cell"></td>
      <td class="sig-cell"></td>
      <td class="sig-cell"></td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>GRN - ${data.grn_number || 'PENDING'}</title>
<style>
  @page { margin: 8mm 10mm; size: A4 portrait; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9pt;
    color: #333;
    line-height: 1.25;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Layout helpers ───────────────────────────────────── */
  .page { padding: 0; }
  .flex  { display: flex; }
  .w100  { width: 100%; }
  .tr    { text-align: right; }
  .tc    { text-align: center; }
  .bold  { font-weight: bold; }
  .upper { text-transform: uppercase; }

  /* ── Header ───────────────────────────────────────────── */
  .hdr-wrap {
    display: flex;
    align-items: flex-start;
    border-bottom: 2pt solid #000000;
    padding-bottom: 3mm;
    margin-bottom: 3mm;
  }
  .hdr-logo {
    width: 22mm;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .hdr-addresses {
    flex: 1;
    display: flex;
    gap: 3mm;
    font-size: 7pt;
    line-height: 1.4;
    padding: 0 3mm;
  }
  .hdr-addr-col { flex: 1; }
  .hdr-addr-col strong { display: block; font-size: 7.5pt; color: #003893; }

  .hdr-ref {
    width: 52mm;
    flex-shrink: 0;
    font-size: 8pt;
    border: 1pt solid #000000;
    padding: 2mm;
  }
  .hdr-ref table { width: 100%; border-collapse: collapse; }
  .hdr-ref td { padding: 1mm 1.5mm; vertical-align: top; }
  .hdr-ref .rlabel { font-weight: bold; white-space: nowrap; width: 22mm; color: #003893; }
  .hdr-ref .rvalue { border-bottom: 0.5pt solid #000000; font-weight: bold; }

  /* ── Title ────────────────────────────────────────────── */
  .title-block { margin: 3mm 0 2mm; }
  .title-org   { font-size: 14pt; font-weight: 900; letter-spacing: 0.5pt; color: #003893; }
  .title-doc   { font-size: 11pt; font-weight: bold; text-decoration: underline; margin-top: 1mm; color: #C8102E; }

  /* ── Supplier box ─────────────────────────────────────── */
  .supplier-row {
    display: flex;
    gap: 4mm;
    margin-bottom: 3mm;
    align-items: stretch;
  }
  .supplier-box {
    flex: 1;
    border: 1pt solid #000000;
    padding: 2mm 3mm;
    font-size: 9pt;
    font-weight: bold;
    width:100mm;
    display: flex;
    align-items: center;
  }
  .date-box {
    width: 50mm;
    
    padding: 2mm 3mm;
    font-size: 9pt;
    display: flex;
    align-items: center;
    gap: 4mm;
  }
  .date-box .dlabel { font-weight: bold; min-width: 12mm; color: #000000; }
  .date-box .dvalue { flex:1; font-weight: bold; }

  /* ── Farmers copy ─────────────────────────────────────── */
  .farmers-copy {
    text-align: center;
    font-size: 11pt;
    font-weight: 900;
    text-decoration: underline;
    text-transform: uppercase;
    margin: 3mm 0;
    letter-spacing: 1pt;
    color: #C8102E;
  }

  /* ── Reference row ────────────────────────────────────── */
  .ref-row-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0;
  }
  .ref-row-table th, .ref-row-table td {
    border: 0.75pt solid #000000;
    padding: 1.5mm 2mm;
    font-size: 8pt;
    text-align: left;
  }
  .ref-row-table th { font-weight: bold; background: #E8EDFF; color: #003893; }

  /* ── Data table ───────────────────────────────────────── */
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0;
  }
  table.data-table th {
    border: 0.75pt solid #000000;
    padding: 2mm 2mm;
    font-weight: bold;
    font-size: 8pt;
    text-align: center;
    background: #003893;
    color: #fff;
    vertical-align: middle;
  }
  table.data-table td {
    border: 0.75pt solid #000000;
    padding: 1.5mm 2mm;
    font-size: 8.5pt;
    vertical-align: middle;
  }
  .col-no    { width: 8mm;  text-align: center; }
  .col-unit  { width: 12mm; text-align: center; }
  .col-code  { width: 14mm; text-align: center; }
  .col-desc  { text-align: center; }
  .col-qty   { width: 18mm; text-align: right; }
  .col-unit-lbl { width: 12mm; text-align: center; font-size: 7pt; color: #003893; font-weight: bold; }

  /* ── Totals ───────────────────────────────────────────── */
  .totals-section {
    display: flex;
    margin-bottom: 3mm;
  }
  .totals-right {
    margin-left: auto;
    width: 80mm;
    border-collapse: collapse;
  }
  .totals-right td {
    border: 1pt solid #000000;
    padding: 2mm 3mm;
    font-size: 9pt;
    font-weight: bold;
    color: #000000;
  }
  .totals-right .t-label { text-align: left; width: 42mm; }
  .totals-right .t-value { text-align: right; }
  .totals-right .t-unit  { width: 10mm; text-align: center; font-size: 7.5pt; font-weight: normal; }

  /* ── Bottom section ───────────────────────────────────── */
  .bottom-section {
    display: flex;
    gap: 5mm;
    margin-top: 2mm;
  }

  /* Signature table (left) */
  .sig-outer { flex: 1; }
  .sig-header-row {
    display: flex;
    border: 1pt solid #000000;
    border-bottom: none;
    background: #E8EDFF;
  }
  .sig-header-row .sh-label { flex: 1; padding: 1.5mm 2mm; font-weight: bold; font-size: 8pt; border-right: 0.75pt solid #003893; color: #003893; }
  .sig-header-row .sh-col   { width: 20mm; text-align: center; padding: 1.5mm 2mm; font-weight: bold; font-size: 8pt; border-right: 0.75pt solid #003893; color: #003893; }
  .sig-header-row .sh-col:last-child { border-right: none; }
  table.sig-table { width: 100%; border-collapse: collapse; }
  table.sig-table td { border: 0.75pt solid #000000; padding: 1.5mm 2mm; font-size: 7.5pt; vertical-align: middle; height: 9mm; }
  .sig-label-cell { font-size: 7.5pt; color: #C8102E; font-weight: bold; }
  .sig-cell { width: 20mm; }

  /* Notes (right) */
  .notes-block {
    width: 72mm;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 3mm;
  }
  .notes-box {
    border: 0.75pt solid #000000;
    padding: 2mm 3mm;
    font-size: 7.5pt;
    line-height: 1.6;
  }
  .notes-box p { margin-bottom: 1mm; }

  .verify-row {
    display: flex;
    align-items: center;
    gap: 10mm;
    margin-top: 5mm;
  }
  /* QR */
  .qr-block { text-align: center; margin-top: 0; }
  .qr-block img { width: 22mm; height: 22mm; }
  .qr-block p { font-size: 6pt; color: #555; margin-top: 1mm; }

  /* ── Form footer ──────────────────────────────────────── */
  .form-footer {
    margin-top: 6mm;
    border-top: 1pt solid #3b3b3b;
    padding-top: 2mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.5pt;
    color: #333;
  }

  @media print {
    body { -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- ══════════════════════════════════════════════════════
       HEADER — logo | addresses | ref box
  ══════════════════════════════════════════════════════ -->
  <div class="hdr-wrap">

    <div class="hdr-logo"></div>

    <!-- Three address columns -->
    <div class="hdr-addresses">
      <img src="${kmclogo}" style="width: 20mm; height: 20mm; object-fit: contain; margin-right: 3mm;" />
      <div class="hdr-addr-col">
        <strong>Headquarters</strong>
        P.O.Box 2-00204 Athi River<br>
        Tel: +254 45 6626041/3/4<br>
        Fax: +254 45 6626520<br>
        Email: accounts@kenyameat.co.ke
      </div>
      <div class="hdr-addr-col">
        <strong>Landhies RAd Depot</strong>
        P.O.Box 30414-00100<br>
        Nairobi GPO<br>
        Tel: +254 20 2013426/31<br>
        Fax: +254 20 2013426<br>
        Email: Landhies@kenyameat.co.ke
      </div>
      <div class="hdr-addr-col">
        <strong>Mombasa Branch</strong>
        P.O.Box 87080-80100<br>
        Mombasa GPO<br>
        Tel: +254 20 3542623<br>
        Fax: +254 20 3542623<br>
        Email: kmcmombasa@kenyameat.co.ke
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════
       TITLE
  ══════════════════════════════════════════════════════ -->
  <div class="title-block">
    <div class="title-org">KENYA MEAT COMMISSION</div>
    <div class="title-doc">GOODS RECEIVED NOTE</div>
  </div>

  <!-- ══════════════════════════════════════════════════════
       SUPPLIER + DATE ROW
  ══════════════════════════════════════════════════════ -->
  <div class="supplier-row" style="margin-top:3mm;">
    <div class="supplier-box" style="display: block;">
      <div>Supplier:&nbsp;&nbsp;<span style="text-transform:uppercase;">${supplier.name || 'N/A'}</span></div>
      <div style="font-size: 8pt; margin-top: 2mm; display: flex; flex-direction: column; gap: 1mm; font-weight: normal;">
        <span>GRN No: <strong>${data.grn_number || mob.grn_number || 'PENDING'}</strong></span>
        <span>MOB No: <strong>${data.mob_number || mob.mob_number || 'N/A'}</strong></span>
        <span>Farmer No: <strong>${supplier.farmer_no || 'N/A'}</strong></span>
        <span>Boma: <strong>${data.location || mob.location || 'N/A'}</strong></span>
        <span>ID No: <strong>${supplier.id_number || 'N/A'}</strong></span>
        <span>Phone: <strong>${supplier.phone || 'N/A'}</strong></span>
      </div>
    </div>
    <div class="date-box">
      <span class="dlabel">Date</span>
      <span class="dvalue">${(() => {
        const d = data.received_date || mob.received_date;
        if (!d) return new Date().toLocaleDateString('en-GB');
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? d : parsed.toLocaleDateString('en-GB');
      })()}</span>
    </div>
  </div>


  <!-- ══════════════════════════════════════════════════════
       FARMERS COPY
  ══════════════════════════════════════════════════════ -->
  <div class="farmers-copy">FARMERS COPY</div>

  <!-- ══════════════════════════════════════════════════════
       LINE ITEMS TABLE
       Matches photo: Stores Item No | Unit Code | Item Description | QTY |
  ══════════════════════════════════════════════════════ -->
  <table class="data-table" style="margin-top: 2mm;">
    <thead>
      <tr>
        <th class="col-no">Stores™<br>Item No.</th>
        <th class="col-code">Tag<br>Code</th>
        <th class="col-unit">Unit</th>
        <th class="col-desc">Item Description</th>
        <th class="col-qty">Weight (KG)</th>
      </tr>
    </thead>
    <tbody>
      ${animals.map((a, i) => {
        const qty        = Number(a.weight || a.qty || 0);
        return `<tr>
          <td class="col-no">${a.item_no || i + 1}</td>
          <td class="col-code" style="text-align:center;font-weight:bold;">${a.unit_code || a.livestock_number || 'N/A'}</td>
          <td class="col-unit" style="text-align:center;">KG</td>
          <td class="col-desc" style="text-align:center;font-weight:bold;">${a.item_description || 'Livestock Entry'}</td>
          <td class="col-qty">${qty.toFixed(3)}</td>
        </tr>`;
      }).join('')}
      ${animals.length === 0
        ? '<tr><td colspan="5" style="text-align:center;padding:4mm;">No livestock records attached</td></tr>'
        : ''}
    </tbody>
  </table>

  <!-- ══════════════════════════════════════════════════════
       TOTALS — right-aligned, matching photo layout
  ══════════════════════════════════════════════════════ -->
  <div class="totals-section">
    <table class="totals-right">
      <tr>
        <td class="t-label">Total Weight</td>
        <td class="t-value">${Number(data.total_weight || mob.total_weight || 0).toFixed(2)}</td>
        <td class="t-unit">KG</td>
      </tr>
      <tr>
        <td class="t-label">Total Head Count</td>
        <td class="t-value">${animals.length}</td>
        <td class="t-unit">HEAD</td>
      </tr>
    </table>
  </div>

  <!-- ══════════════════════════════════════════════════════
       BOTTOM signature table (left) + notes (right)
  ══════════════════════════════════════════════════════ -->
  <div class="bottom-section">

    <!-- Signature table  -->
    <div class="sig-outer">
      <div class="sig-header-row">
        <div class="sh-label">1. FOR STORES USE</div>
        <div class="sh-col">INITIALS</div>
        <div class="sh-col">SIGNATURE</div>
        <div class="sh-col">DATE</div>
      </div>
      <table class="sig-table">
        ${sigRows}
      </table>
    </div>

    <!-- Notes  -->
    <div class="notes-block">
      <div class="notes-box">
        <p><strong>NOTE</strong></p>
        <p>1. These are live weights of the livestock as measured at receiving bay.</p>
        <p>2. This serves as a temporary GRN.</p>
        <p>3. Unit conversion applied where applicable.</p>
      </div>
    </div>
  </div>

  <div class="verify-row">
    <div class="qr-block">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}" />
      <p><strong>Use the QR code above to verify this GRN</strong></p>
      <p style="font-size:6pt;color:#888;">${data.grn_number || 'PENDING'}</p>
    </div>
    <div style="font-size:7pt; line-height:1.4;">
      <strong>Receiving Officer:</strong> ${officer.name || 'N/A'}<br>

    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════
       FORM FOOTER
  ══════════════════════════════════════════════════════ -->
  <div class="form-footer">
    <span>System GRN Ref: ${data.grn_number || 'PENDING'}</span>
    <img src="${kmcslogan}" style="height: 10mm; object-fit: contain;" />
    <span>KMC Livestock Tracking System &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('en-GB')}</span>
  </div>

</div>
<script>window.onload = () => { window.print(); }</script>
</body></html>`;

  w.document.write(html);
  w.document.close();
}
