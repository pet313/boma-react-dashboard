import { useState, useMemo } from "react";
import { KPI } from "../components/common/KPI";
import { Icon } from "../components/common/Icon";
import { DataTable, TD } from "../components/common/DataTable";
import { Chip } from "../components/common/Chip";
import { ExportButton } from "../components/common/ExportButton";
import { Btn } from "../components/common/Btn";
import { Modal } from "../components/common/Modal";
import { FormField } from "../components/common/FormField";
import { DateRangeFilter } from "../components/common/DateRangeFilter";
import { s } from "../utils/constants";
import { suppliersApi } from "../api";

export function AddFarmerModal({ onClose, onCreated, toast }) {
  const [form, setForm] = useState({
    farmer_no: "",
    name: "",
    id_number: "",
    phone: "",
    email: "",
    location: "",
    bank_name: "",
    bank_account: "",
    kra_pin: "",
  });
  const [busy, setBusy] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(true);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name || !form.id_number || !form.phone || !form.location) {
      return toast("Name, ID Number, Phone, and Location are required.", "error");
    }

    // If not auto-generating, farmer_no is required
    if (!autoGenerate && !form.farmer_no) {
      return toast("Farmer number is required when not auto-generating.", "error");
    }

    setBusy(true);
    try {
      const data = { ...form };
      if (autoGenerate) {
        delete data.farmer_no; // Let backend auto-generate
      }
      const farmer = await suppliersApi.create(data);
      onCreated(farmer);
      onClose();
      toast(`Farmer registered successfully${autoGenerate ? ` with number: ${farmer.farmer_no}` : ""}.`, "success");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Full name" required>
          <input value={form.name} onChange={set("name")} placeholder="e.g. John Kamau" />
        </FormField>
        <FormField label="ID Number" required>
          <input value={form.id_number} onChange={set("id_number")} placeholder="e.g. 12345678" />
        </FormField>
        <FormField label="Phone" required>
          <input value={form.phone} onChange={set("phone")} placeholder="e.g. 0712345678" />
        </FormField>
        <FormField label="Location" required>
          <input value={form.location} onChange={set("location")} placeholder="e.g. Nairobi" />
        </FormField>
        <FormField label="Email address">
          <input type="email" value={form.email} onChange={set("email")} placeholder="john@example.com" />
        </FormField>
        <FormField label="Bank name">
          <input value={form.bank_name} onChange={set("bank_name")} placeholder="e.g. KCB" />
        </FormField>
        <FormField label="Bank account">
          <input value={form.bank_account} onChange={set("bank_account")} placeholder="e.g. 1234567890" />
        </FormField>
        <FormField label="KRA PIN">
          <input value={form.kra_pin} onChange={set("kra_pin")} placeholder="e.g. A123456789X" />
        </FormField>
      </div>

      {/* Farmer Number Section */}
      <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <input
            type="checkbox"
            id="autoGenerate"
            checked={autoGenerate}
            onChange={e => setAutoGenerate(e.target.checked)}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
          <label htmlFor="autoGenerate" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", cursor: "pointer" }}>
            Auto-generate farmer number
          </label>
        </div>
        {!autoGenerate && (
          <FormField label="Farmer number" hint="Enter a unique farmer number (e.g. KMCF00001)">
            <input
              value={form.farmer_no}
              onChange={set("farmer_no")}
              placeholder="e.g. KMCF00001"
              style={{ width: "100%" }}
            />
          </FormField>
        )}
        {autoGenerate && (
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
            System will automatically assign a farmer number in format: KMCF00001
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={busy}>
          {busy ? "Registering…" : "Register farmer"}
        </Btn>
      </div>
    </div>
  );
}

export function SuppliersPage({ suppliers, setSuppliers, loading, toast }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Filter by date range
  const dateFiltered = useMemo(() => {
    if (!startDate && !endDate) return suppliers;
    return suppliers.filter(s => {
      const timestamp = new Date(s.created_at || s.updated_at).getTime();
      if (startDate && timestamp < new Date(startDate).getTime()) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (timestamp > end.getTime()) return false;
      }
      return true;
    });
  }, [suppliers, startDate, endDate]);

  const filtered = dateFiltered.filter(s => {
    if (!s) return false;
    const searchLower = String(search || "").toLowerCase();
    const nameMatch = String(s.name || "").toLowerCase().includes(searchLower);
    const idMatch = String(s.farmer_no || "").toLowerCase().includes(searchLower);
    return !search || nameMatch || idMatch;
  });

  const withEmail = dateFiltered.filter(s => s.email).length;

  const exportData = useMemo(() => {
    return filtered.map(s => ({
      "Farmer No": s.farmer_no,
      "Name": s.name,
      "ID Number": s.id_number,
      "Phone": s.phone,
      "Email": s.email || "N/A",
      "Location": s.location,
      "Bank Name": s.bank_name || "N/A",
      "Bank Account": s.bank_account || "N/A",
      "KRA PIN": s.kra_pin || "N/A",
      "Status": s.is_active !== false ? "Active" : "Inactive"
    }));
  }, [filtered]);

  const exportOptions = useMemo(() => ({
    title: "KMC Supplier Directory Report",
    sheetName: "Suppliers",
    summaryData: {
      "Report Period": `${startDate || 'Start'} to ${endDate || 'Present'}`,
      "Total Suppliers": dateFiltered.length,
      "With Email": withEmail,
      "Without Email": dateFiltered.length - withEmail,
      "Active Suppliers": dateFiltered.filter(s => s.is_active !== false).length
    }
  }), [dateFiltered, withEmail, startDate, endDate]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="responsive-grid-4">
        <KPI label="Total suppliers" value={dateFiltered.length}   icon="Store" theme="blue" loading={loading} />
        <KPI label="With email"      value={withEmail}          icon="Mail"  sub="Can receive GRN" theme="green" loading={loading} />
        <KPI label="Without email"   value={dateFiltered.length - withEmail} icon="MailX" theme="amber" loading={loading} />
        <KPI label="Active"          value={dateFiltered.filter(s => s.is_active !== false).length} icon="Check" theme="purple" loading={loading} />
      </div>

      <div style={{ ...s.row, gap: 10 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Icon name="Search" size={14} color="var(--color-text-tertiary)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers…" style={{ paddingLeft: 34 }} />
        </div>
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClear={() => { setStartDate(""); setEndDate(""); }}
        />
        <Btn variant="primary" icon="UserPlus" onClick={() => setShowAdd(true)}>
          Register farmer
        </Btn>
        <ExportButton
          data={exportData}
          fileName="KMC_Supplier_Directory"
          options={exportOptions}
        />
      </div>

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Supplier directory : {filtered.length} records</div>
        <DataTable
          cols={["Farmer No.", "Name", "Phone", "Location", "Email", "Bank", "Status"]}
          empty="No suppliers found."
          rows={loading ? Array(8).fill(0).map((_, i) => (
            <tr key={`skel-sup-${i}`}>
              <TD><div className="skeleton-box" style={{ height: 12, width: "80px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "150px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "100px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "90px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "140px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "100px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 20, width: "60px", borderRadius: 20 }} /></TD>
            </tr>
          )) : filtered.map((s, i) => (
            <tr key={s.id || i}>
              <TD mono>{s.farmer_no || "None"}</TD>
              <TD>{s.name}</TD>
              <TD>{s.phone || "None"}</TD>
              <TD>{s.location || "None"}</TD>
              <TD>{s.email || <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>No email</span>}</TD>
              <TD>{s.bank_name || <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>None</span>}</TD>
              <TD><Chip text={s.is_active !== false ? "Active" : "Inactive"} color={s.is_active !== false ? "green" : "gray"} /></TD>
            </tr>
          ))}
        />
      </div>

      {showAdd && (
        <Modal title="Register new farmer" onClose={() => setShowAdd(false)} wide>
          <AddFarmerModal
            onClose={() => setShowAdd(false)}
            onCreated={farmer => setSuppliers(p => [...p, farmer])}
            toast={toast}
          />
        </Modal>
      )}
    </div>
  );
}