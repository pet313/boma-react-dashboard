import { useState } from "react";
import { KPI } from "../components/common/KPI";
import { Btn } from "../components/common/Btn";
import { Chip } from "../components/common/Chip";
import { DataTable, TD } from "../components/common/DataTable";
import { Modal } from "../components/common/Modal";
import { Icon } from "../components/common/Icon";
import { C } from "../utils/constants";
import { getMobLivestockCount } from "../utils/helpers";
import { mobsApi } from "../api";
import { printGRN } from "../utils/grnPrinter";
import kmclogo from '../assets/kmclogo.jpg'
import kmcslogan from '../assets/kmcslogan.png'

export function GrnPage({ mobs, setMobs, toast, currentUser }) {
  const [filter, setFilter]       = useState("all");
  const [busy, setBusy]           = useState({});
  const [grnModal, setGrnModal]   = useState(null);
  const [loadingGrn, setLoadingGrn] = useState({});

  const filtered = mobs.filter(m => {
    if (filter === "failed")  return m.email_status === "FAILED";
    if (filter === "sent")    return m.email_status === "SENT";
    if (filter === "pending") return m.email_status === "PENDING";
    if (filter === "closed")  return m.mob_status === "CLOSED";
    return m.mob_status === "CLOSED"; // default: all closed mobs
  });

  const handleRetry = async mob => {
    setBusy(b => ({ ...b, [mob.id]: "retry" }));
    try {
      await mobsApi.retryEmail(mob.id, { force: true });
      // Update local state immediately so the user sees the "SENT" badge
      setMobs(prev => prev.map(m =>
        m.id === mob.id ? { ...m, email_status: "SENT" } : m
      ));

      toast(`Email resent successfully to ${mob.supplier?.name || 'supplier'}`, "success");
    } catch (e) {
      toast("Retry failed: " + e.message, "error");
    } finally {
      setBusy(b => ({ ...b, [mob.id]: null }));
    }
  };

  const handlePrint = async mob => {
    setLoadingGrn(l => ({ ...l, [mob.id]: true }));
    try {
      const data = await mobsApi.getGrnData(mob.id);
      printGRN(data, mob);
    } catch {
      printGRN(null, mob); // fallback to local data
    } finally {
      setLoadingGrn(l => ({ ...l, [mob.id]: false }));
    }
  };

  const handlePreview = async mob => {
    setLoadingGrn(l => ({ ...l, [mob.id]: true }));
    try {
      const data = await mobsApi.getGrnData(mob.id);
      setGrnModal({ data, mob });
    } catch {
      setGrnModal({ data: null, mob });
    } finally {
      setLoadingGrn(l => ({ ...l, [mob.id]: false }));
    }
  };

  const closedMobs = mobs.filter(m => m.mob_status === "CLOSED");
  const sentCount    = closedMobs.filter(m => m.email_status === "SENT").length;
  const failedCount  = closedMobs.filter(m => m.email_status === "FAILED").length;
  const pendingCount = closedMobs.filter(m => m.email_status === "PENDING").length;

  const canPrint  = ["admin", "officer", "accounts"].includes(currentUser?.role);
  const canResend = ["admin", "accounts"].includes(currentUser?.role);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="responsive-grid-4">
        <KPI label="GRNs generated"  value={closedMobs.length} icon="FileBadge" theme="black" />
        <KPI label="Email sent"      value={sentCount}    icon="MailCheck"  sub={`${closedMobs.length ? Math.round(sentCount/closedMobs.length*100) : 0}% success`} theme="green" />
        <KPI label="Email failed"    value={failedCount}  icon="MailX"    sub={failedCount > 0 ? "Needs retry" : "All clear"} theme="red" />
        <KPI label="Pending send"    value={pendingCount} icon="MailPlus" theme="amber" />
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { k: "all",     label: "All closed MOBs", count: closedMobs.length },
          { k: "failed",  label: "Failed",          count: failedCount,  color: "red"   },
          { k: "sent",    label: "Sent",             count: sentCount,    color: "green" },
          { k: "pending", label: "Pending",          count: pendingCount, color: "amber" },
        ].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
            border: `0.5px solid ${filter === f.k ? C.blue : "var(--color-border-secondary)"}`,
            background: filter === f.k ? C.blueBg : "var(--color-background-primary)",
            color: filter === f.k ? C.blueDark : "var(--color-text-secondary)",
            cursor: "pointer",
          }}>
            {f.label} <span style={{ opacity: 0.6 }}>({f.count})</span>
          </button>
        ))}
      </div>

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>
          GRN records — {filtered.length} {filter === "all" ? "closed MOBs" : filter}
        </div>
        <DataTable
          cols={["MOB No.", "Supplier", "GRN Number", "Livestock", "Weight", "Email status", "Actions"]}
          empty="No GRN records match this filter."
          rows={filtered.map(m => (
            <tr key={m.id} style={{ cursor: "default" }}>
              <TD mono>{m.mob_number || m.id}</TD>
              <TD>{m.supplier?.name || "None"}</TD>
              <TD mono style={{ fontSize: 11 }}>{m.grn_number || "None"}</TD>
              <TD>{getMobLivestockCount(m) ?? "None"}</TD>
              <TD>{Number(m.total_weight || 0).toFixed(3)} KG</TD>
              <TD>
                {m.email_status === "SENT"    && <Chip text="✓ Sent"    color="green" />}
                {m.email_status === "FAILED"  && <Chip text="✗ Failed"  color="red"   />}
                {m.email_status === "PENDING" && <Chip text="Pending"   color="amber" />}
                {!m.email_status              && <span style={{ color: "var(--color-text-tertiary)" }}>None</span>}
              </TD>
              <TD>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn small icon="Eye" onClick={() => handlePreview(m)} loading={loadingGrn[m.id]}>Preview</Btn>
                  <Btn small icon="Printer" variant="ghost" onClick={() => handlePrint(m)} disabled={loadingGrn[m.id]}>
                    Print
                  </Btn>
                  {currentUser?.role === "admin" && (
                    <Btn small icon="Send" variant="success" onClick={() => handleRetry(m)} loading={busy[m.id] === "retry"}>
                      {busy[m.id] === "retry" ? "Sending…" : "Resend"}
                    </Btn>
                  )}
                </div>
              </TD>
            </tr>
          ))}
        />
      </div>

      {/* GRN Preview Modal */}
      {grnModal && (
        <Modal title={`GRN Preview — ${grnModal.mob.grn_number || grnModal.mob.mob_number}`} wide onClose={() => setGrnModal(null)}>
          <GrnPreview data={grnModal.data} mob={grnModal.mob} />
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
            <Btn icon="Printer" variant="primary" onClick={() => { printGRN(grnModal.data, grnModal.mob); }} locked={!canPrint}>
              Print GRN
            </Btn>
            <Btn icon="Send" variant="success" onClick={() => { handleRetry(grnModal.mob); setGrnModal(null); }} locked={!canResend} loading={busy[grnModal.mob.id] === "retry"}>
              Resend Email
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function GrnPreview({ data, mob }) {
  const d = data || mob;
  const animals = d?.livestock || [];
  const supplier = d?.supplier || mob.supplier || {};
  const officer = d?.officer || mob.officer || {};

  const qrData = [
    `GRN: ${d?.grn_number || mob.grn_number || 'PENDING'}`,
    `MOB: ${d?.mob_number || mob.mob_number || 'N/A'}`,
    `Supplier: ${supplier.name || 'N/A'}`,
    `Farmer No: ${supplier.farmer_no || 'N/A'}`,
    `Weight: ${Number(d?.total_weight || mob.total_weight || 0).toFixed(3)} KG`,
    `Date: ${new Date().toLocaleDateString('en-GB')}`
  ].join(' | ');

  return (
    <div style={{ fontSize: '9pt', fontFamily: 'Arial, sans-serif', color: '#333', background: '#fff', border: '1px solid #ddd', padding: '8mm', maxWidth: '850px', margin: '0 auto' }}>
      {/* Header logic perfectly identical to printGRN */}
      <div style={{ display: 'flex', borderBottom: '2pt solid #000000', paddingBottom: '3mm', marginBottom: '4mm' }}>
        <div style={{ width: '22mm', display: 'flex', alignItems: 'center' }}></div>
        <div style={{ flex: 1, display: 'flex', gap: '3mm', fontSize: '7pt', padding: '0 3mm' }}>
          <img src={kmclogo} alt="KMC" style={{ width: '20mm', height: '20mm', objectFit: 'contain', marginRight: '3mm' }} />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '7.5pt', color: '#003893' }}>Headquarters</strong>
            P.O.Box 2-00204 Athi River<br/>Tel: +254 45 6626041/3/4<br/>Email: accounts@kenyameat.co.ke
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '7.5pt', color: '#003893' }}>Landhies RAd Depot</strong>
            P.O.Box 30414-00100 Nairobi<br/>Tel: +254 20 2013426/31<br/>Email: Landhies@kenyameat.co.ke
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '7.5pt', color: '#003893' }}>Mombasa Branch</strong>
            P.O.Box 87080-80100 Mombasa<br/>Tel: +254 20 3542623<br/>Email: kmcmombasa@kenyameat.co.ke
          </div>
        </div>
      </div>

      <div style={{ margin: '4mm 0 2mm' }}>
        <div style={{ fontSize: '14pt', fontWeight: 900, color: '#003893' }}>KENYA MEAT COMMISSION</div>
        <div style={{ fontSize: '11pt', fontWeight: 'bold', textDecoration: 'underline', marginTop: '1mm', color: '#C8102E' }}>GOODS RECEIVED NOTE</div>
      </div>

      <div style={{ display: 'flex', gap: '4mm', marginBottom: '4mm' }}>
        <div style={{ flex: 1, border: '1pt solid #000000', padding: '3mm', fontSize: '10pt', fontWeight: 'bold' }}>
          <div>Supplier:&nbsp;&nbsp;<span style={{ textTransform: 'uppercase', color: '#333' }}>{supplier.name || 'N/A'}</span></div>
        <div style={{ fontSize: '8pt', marginTop: '2mm', display: 'flex', flexDirection: 'column', gap: '1mm', fontWeight: 'normal' }}>
            <span>GRN No: <strong>{d?.grn_number || mob.grn_number || 'PENDING'}</strong></span>
            <span>MOB No: <strong>{d?.mob_number || mob.mob_number || 'N/A'}</strong></span>
          <span>Farmer No: <strong>{supplier.farmer_no || 'N/A'}</strong></span>
            <span>Boma: <strong>{d?.location || mob.location || 'N/A'}</strong></span>
          <span>ID No: <strong>{supplier.id_number || 'N/A'}</strong></span>
          <span>Phone: <strong>{supplier.phone || 'N/A'}</strong></span>
          </div>
        </div>
        <div style={{ width: '50mm', border: '1pt solid #000000', padding: '2mm 3mm', fontSize: '9pt', display: 'flex', alignItems: 'center', gap: '4mm' }}>
          <span style={{ fontWeight: 'bold', color: '#000000' }}>Date</span>
        <span style={{ flex: 1, fontWeight: 'bold' }}>{new Date(d?.received_date || mob.received_date || Date.now()).toLocaleDateString('en-GB')}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '11pt', fontWeight: 900, textDecoration: 'underline', textTransform: 'uppercase', margin: '4mm 0', color: '#C8102E', letterSpacing: '1pt' }}>FARMERS COPY</div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2mm' }}>
        <thead style={{ background: '#003893', color: '#fff', fontSize: '8pt' }}>
          <tr>
            <th style={{ border: '0.75pt solid #000000', padding: '2mm', width: '12%' }}>Item No.</th>
            <th style={{ border: '0.75pt solid #000000', padding: '2mm', width: '18%' }}>Tag Code</th>
            <th style={{ border: '0.75pt solid #000000', padding: '2mm', width: '10%' }}>Unit</th>
            <th style={{ border: '0.75pt solid #000000', padding: '2mm' }}>Description</th>
            <th style={{ border: '0.75pt solid #000000', padding: '2mm', width: '18%' }}>Weight (KG)</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '9pt' }}>
          {animals.map((a, i) => (
            <tr key={i}>
              <td style={{ border: '0.75pt solid #000000', padding: '1.5mm 2mm', textAlign: 'center' }}>{a.item_no || i + 1}</td>
              <td style={{ border: '0.75pt solid #000000', padding: '1.5mm 2mm', textAlign: 'center', fontWeight: 'bold' }}>{a.unit_code || a.livestock_number || 'N/A'}</td>
              <td style={{ border: '0.75pt solid #000000', padding: '1.5mm 2mm', textAlign: 'center' }}>KG</td>
              <td style={{ border: '0.75pt solid #000000', padding: '1.5mm 2mm', fontWeight: 'bold', textAlign: 'center' }}>{a.item_description || 'Livestock Entry'}</td>
              <td style={{ border: '0.75pt solid #000000', padding: '1.5mm 2mm', textAlign: 'right' }}>{Number(a.weight || 0).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', marginTop: '4mm' }}>
        <table style={{ marginLeft: 'auto', width: '80mm', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ border: '1pt solid #000000', padding: '2mm 3mm', fontSize: '9pt', fontWeight: 'bold', color: '#000000', width: '42mm' }}>Total Weight</td>
              <td style={{ border: '1pt solid #000000', padding: '2mm 3mm', fontSize: '9pt', fontWeight: 'bold', textAlign: 'right' }}>{Number(d?.total_weight || mob.total_weight || 0).toFixed(2)}</td>
              <td style={{ border: '1pt solid #000000', padding: '2mm', fontSize: '7.5pt', textAlign: 'center', width: '10mm' }}>KG</td>
            </tr>
            <tr>
              <td style={{ border: '1pt solid #000000', padding: '2mm 3mm', fontSize: '9pt', fontWeight: 'bold', color: '#000000' }}>Total Head Count</td>
              <td style={{ border: '1pt solid #000000', padding: '2mm 3mm', fontSize: '9pt', fontWeight: 'bold', textAlign: 'right' }}>{animals.length}</td>
              <td style={{ border: '1pt solid #000000', padding: '2mm', fontSize: '7.5pt', textAlign: 'center' }}>HEAD</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '6mm', marginTop: '4mm' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', border: '1pt solid #000000', borderBottom: 'none', background: '#E8EDFF', fontSize: '8pt', fontWeight: 'bold', color: '#003893' }}>
            <div style={{ flex: 1, padding: '1.5mm 2mm', borderRight: '0.75pt solid #003893' }}>FOR STORES USE</div>
            <div style={{ width: '20mm', padding: '1.5mm 2mm', borderRight: '0.75pt solid #003893', textAlign: 'center' }}>INITIALS</div>
            <div style={{ width: '20mm', padding: '1.5mm 2mm', borderRight: '0.75pt solid #003893', textAlign: 'center' }}>SIGNATURE</div>
            <div style={{ width: '20mm', padding: '1.5mm 2mm', textAlign: 'center' }}>DATE</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1pt solid #000000' }}>
            <tbody>
              {['Received By', 'Verified By'].map(label => (
                <tr key={label}>
                  <td style={{ border: '0.75pt solid #000000', padding: '1.5mm 2mm', fontSize: '7.5pt', color: '#C8102E', fontWeight: 'bold', height: '9mm' }}>{label}</td>
                  <td style={{ border: '0.75pt solid #000000', width: '20mm' }}></td>
                  <td style={{ border: '0.75pt solid #000000', width: '20mm' }}></td>
                  <td style={{ border: '0.75pt solid #000000', width: '20mm' }}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ width: '75mm', display: 'flex', flexDirection: 'column', gap: '4mm' }}>
          <div style={{ border: '0.75pt solid #000000', padding: '2mm 3mm', fontSize: '7.5pt', lineHeight: 1.6 }}>
            <p style={{ fontWeight: 'bold', borderBottom: '1pt solid #003893', paddingBottom: '1mm', marginBottom: '2mm' }}>NOTES</p>
            <p>1. These are live weights of the livestock as measured at receiving bay.</p>
            <p>2. This serves as a temporary GRN.</p>
            <p>3. Unit conversion applied where applicable.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10mm', marginTop: '5mm' }}>
        <div style={{ textAlign: 'center' }}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`} alt="QR" style={{ width: '24mm', height: '24mm' }} />
          <p style={{ fontSize: '7pt', color: '#555', marginTop: '1mm', fontWeight: 'bold' }}>Digital Verification QR</p>
          <p style={{ fontSize: '6pt', color: '#999' }}>Ref: {d?.grn_number || 'PENDING'}</p>
        </div>
        <div style={{ fontSize: '7pt', lineHeight: '1.4' }}>
          <strong>Measuring Officer:</strong> {officer.name || 'N/A'}<br/>
          <strong>Farmer No:</strong> {supplier.farmer_no || 'N/A'}<br/>
          <strong>Supplier ID:</strong> {supplier.id_number || 'N/A'}<br/>
          <strong>Phone:</strong> {supplier.phone || 'N/A'}
        </div>
      </div>

      <div style={{ marginTop: '6mm', borderTop: '1pt solid #3b3b3b', paddingTop: '2mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '7.5pt', color: '#333' }}>
        <span>System GRN Ref: {d?.grn_number || 'PENDING'}</span>
        <img src={kmcslogan} alt="Slogan" style={{ height: '10mm', objectFit: 'contain' }} />
        <span>KMC Livestock Tracking System &nbsp;|&nbsp; Generated: {new Date().toLocaleString('en-GB')}</span>
      </div>

    </div>
  );
}
