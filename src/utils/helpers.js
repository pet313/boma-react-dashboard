
export const getInitials = n => String(n || "?").split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase();
export const extractArray = j => !j?[]:Array.isArray(j)?j:Array.isArray(j.data)?j.data:[];
export const fmtWeight = w => Number(w||0).toFixed(3)+" KG";
export const fmtDate = d => d?new Date(d).toLocaleDateString("en-GB"):"Not specified";
export const fmtTimestamp = d => d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not specified";

export const getMobLivestockCount = mob => {
  if (!mob) return null;
  if (Array.isArray(mob.livestock)) return mob.livestock.length;
  if (mob.animal_count === undefined || mob.animal_count === null || mob.animal_count === "") return null;
  const count = Number(mob.animal_count);
  return Number.isFinite(count) ? count : null;
};

export const getMobLocation = mob => {
  return mob?.location || mob?.supplier?.location || mob?.supplier?.address || "None";
};

/* 
Note: The printGRN logic in App.jsx is the primary implementation. 
Updating this version in helpers.js to match the new minimalist layout.
*/
export function printGRN(grnData, mob) {
  const w = window.open("", "_blank");
  if (!w) return alert("Allow popups to print GRN");
  const data = grnData || mob;
  const animals = data.livestock || [];
  const supplier = data.supplier || mob.supplier || {};
  const officer = data.officer || mob.officer || {};
  
  const qrData = [
    `GRN: ${data.grn_number || mob.grn_number || 'PENDING'}`,
    `MOB: ${data.mob_number || mob.mob_number || 'N/A'}`,
    `Supplier: ${supplier.name || 'N/A'}`,
    `Farmer No: ${supplier.farmer_no || 'N/A'}`,
    `Weight: ${Number(data.total_weight || mob.total_weight || 0).toFixed(3)} KG`,
    `Value: KES ${Number(data.total_amount || mob.total_amount || 0).toLocaleString()}`,
    `Date: ${new Date().toLocaleString('en-GB')}`
  ].join(' | ');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>GRN ${data.grn_number||mob.grn_number}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;color:#111;font-size:10pt;padding:15mm}
  .hdr{border-bottom:1px solid #eee;padding-bottom:12px;display:flex;justify-content:space-between;align-items:center}
  .hdr h1{font-size:18pt;color:#000}
  .hdr p{font-size:8pt;color:#666}
  .copy-label{text-align:center;color:#888;padding:12px;font-size:9pt;text-transform:uppercase;letter-spacing:1px}
  .section{padding:12px 0;border-bottom:1px solid #f9f9f9}
  .section h2{font-size:10pt;font-weight:bold;color:#003893;margin-bottom:8px;text-transform:uppercase;letter-spacing:.04em}
  .grid{display:flex;gap:20px}
  .box{flex:1;background:#fafafa;padding:12px;border-radius:4px}
  .row{display:flex;font-size:9pt;margin-bottom:4px}
  .lbl{color:#888;width:100px;font-weight:bold}
  table{width:100%;border-collapse:collapse;margin:15px 0}
  th{border-bottom:2px solid #eee;padding:10px 8px;text-align:left;color:#888;font-size:8pt}
  td{padding:10px 8px;border-bottom:1px solid #f5f5f5}
  .total{font-weight:bold;border-top:2px solid #eee;background:#fff}
  .sigs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;margin-top:30px}
  .sig{border-bottom:1px solid #eee;padding-bottom:10px}
  .footer{display:flex;justify-content:space-between;font-size:8pt;color:#aaa;margin-top:40px;border-top:1px solid #eee;padding-top:10px}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="hdr">
  <div>
    <h1>KENYA MEAT COMMISSION</h1>
    <p>Athi River HQ | Nairobi Depot | Mombasa Branch</p>
  </div>
</div>
<div class="copy-label">GOODS RECEIVED NOTE</div>
<div class="section">
  <div class="grid">
    <div class="box">
      <h2 style="color:#C8102E">Supplier</h2>
      <div class="row"><span class="lbl">Name:</span>${(supplier.name||"").toUpperCase()}</div>
      <div class="row"><span class="lbl">Farmer No:</span>${supplier.farmer_no||"N/A"}</div>
    </div>
    <div class="box">
      <h2 style="color:#C8102E">Reference</h2>
      <div class="row"><span class="lbl">MOB No:</span>${data.mob_number||"N/A"}</div>
      <div class="row"><span class="lbl">Location:</span>${getMobLocation(data)}</div>
    </div>
  </div>
</div>
<table>
  <thead><tr><th>#</th><th>Tag / Code</th><th>Description</th><th style="text-align:right">Weight (KG)</th><th style="text-align:right">Value (KES)</th></tr></thead>
  <tbody>
    ${animals.map((a,i)=>`<tr><td>${i+1}</td><td>${a.unit_code||a.livestock_number}</td><td>Livestock Entry</td><td style="text-align:right">${Number(a.weight||0).toFixed(3)}</td><td style="text-align:right">${Number(a.value||0).toLocaleString()}</td></tr>`).join("")}
  </tbody>
  <tfoot>
    <tr class="total"><td colspan="3">TOTAL</td><td style="text-align:right">${Number(data.total_weight||0).toFixed(3)} KG</td><td style="text-align:right">KES ${Number(data.total_amount||0).toLocaleString()}</td></tr>
  </tfoot>
</table>
<div class="sigs">
  <div class="sig"><p style="color:#003893;font-weight:bold;font-size:8pt">OFFICER: ${officer.name||"________"}</p><p>Sign: _________</p></div>
  <div class="sig"><p style="color:#003893;font-weight:bold;font-size:8pt">SUPPLIER SIGNATURE</p><p>Sign: _________</p></div>
  <div class="sig"><p style="color:#003893;font-weight:bold;font-size:8pt">VERIFIED BY</p><p>Sign: _________</p></div>
</div>
<div style="display:flex;justify-content:center;padding:15px">
  <div style="text-align:center">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrData)}" width="80" height="80" alt="QR Code" />
    <p style="font-size:7pt;color:#888;margin-top:4px;font-weight:bold;text-transform:uppercase">Scan to Verify</p>
  </div>
</div>
<div class="footer"><span>LTS Dashboard v3.0</span><span>Ref: ${data.grn_number}</span></div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`;
  w.document.write(html);
  w.document.close();
}
