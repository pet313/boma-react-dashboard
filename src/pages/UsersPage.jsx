import { useState } from "react";
import { KPI } from "../components/common/KPI";
import { Btn } from "../components/common/Btn";
import { Icon } from "../components/common/Icon";
import { DataTable, TD } from "../components/common/DataTable";
import { Avatar } from "../components/common/Avatar";
import { Chip } from "../components/common/Chip";
import { Modal } from "../components/common/Modal";
import { FormField } from "../components/common/FormField";
import { Toggle } from "../components/common/Toggle";
import { C, ROLE_META, USER_ROLES } from "../utils/constants";
import { fmtTimestamp } from "../utils/helpers";
import { usersApi } from "../api";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const PASSWORD_ERROR_MSG = "Password must be at least 8 characters, include uppercase, lowercase, a number and a symbol (@$!%*?&)";

export function AddUserModal({ onClose, onCreated, toast }) {
  const [form, setForm] = useState({ name: "", employee_id: "", email: "", role: "officer", location: "", password: "" });
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name || !form.employee_id || !form.password) return toast("Name, Employee ID and password are required.", "error");
    if (!PASSWORD_REGEX.test(form.password)) {
      return toast(PASSWORD_ERROR_MSG, "error");
    }
    setBusy(true);
    try {
      const user = await usersApi.create({
        name: form.name, employee_id: form.employee_id.toUpperCase().replace(/-/g, ""),
        email: form.email || null, role: form.role, location: form.location || null,
        password: form.password,
      });
      onCreated(user); onClose();
      toast("User created successfully.", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Full name"><input value={form.name} onChange={set("name")} placeholder="e.g. John Kamau" /></FormField>
        <FormField label="Employee ID"><input value={form.employee_id} onChange={set("employee_id")} placeholder="e.g. KMCOFF002" /></FormField>
        <FormField label="Email address"><input type="email" value={form.email} onChange={set("email")} placeholder="john@kmc.go.ke" /></FormField>
        <FormField label="Location"><input value={form.location} onChange={set("location")} placeholder="e.g. Nairobi" /></FormField>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Role">
          <select value={form.role} onChange={set("role")}>
            {USER_ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label || r}</option>)}
          </select>
        </FormField>
        <FormField label="Password"><input type="password" value={form.password} onChange={set("password")} placeholder="Min 8 characters" /></FormField>
      </div>
      <div style={{ marginTop: 8, padding: "10px 14px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", fontSize: 12, color: "var(--color-text-secondary)" }}>
        <strong>Role permissions:</strong> Admin : full access , Officer : create/close MOBs , Accounts : view GRNs , Viewer : read-only
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={busy}>{busy ? "Creating…" : "Create user"}</Btn>
      </div>
    </div>
  );
}

export function EditRightsModal({ user, onClose, onUpdated, toast }) {
  const [form, setForm]     = useState({
    name: user.name || "",
    email: user.email || "",
    employee_id: user.employee_id || "",
    location: user.location || "",
  });
  const [role, setRole]     = useState(user.role || "officer");
  const [manual, setManual] = useState(!!user.can_manual_weight);
  const [active, setActive] = useState(!!user.is_active);
  const [busy, setBusy]     = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    try {
      if (usersApi.update) {
        await usersApi.update(user.id, { ...form, role, can_manual_weight: manual, is_active: active });
      } else {
        if (role !== user.role) await usersApi.updateRole(user.id, role);
        if (manual !== !!user.can_manual_weight) await usersApi.setManualWeight(user.id, manual);
        if (active !== !!user.is_active) await usersApi.toggle(user.id);
      }
      onUpdated({ ...user, ...form, role, can_manual_weight: manual, is_active: active });
      onClose();
      toast("User rights updated.", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setBusy(false); }
  };

  const meta = ROLE_META[role] || ROLE_META.viewer;
  const ROLE_CAPS = {
    admin:    ["Full dashboard access", "Manage users & permissions", "Create/close MOBs", "View & print all GRNs", "Send & resend GRN emails", "Delete MOBs"],
    officer:  ["Create & close MOBs",  "Add livestock to MOBs",       "View own GRNs", "Offline sync", "Manual weight (if granted)"],
    accounts: ["View all GRNs",        "Print GRN documents",        "View MOB list", "View supplier list"],
    viewer:   ["View dashboard overview","View MOB list (read-only)", "View livestock data"],
  };

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px", background: "var(--color-background-secondary)",
        borderRadius: "var(--border-radius-md)", marginBottom: 16,
      }}>
        <Avatar name={form.name} role={role} size={40} />
        <div>
          <div style={{ fontWeight: 600 }}>{form.name || "Unnamed User"}</div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{form.employee_id || "No ID"} · {form.email}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Full name"><input value={form.name} onChange={set("name")} /></FormField>
        <FormField label="Employee ID"><input value={form.employee_id} onChange={set("employee_id")} /></FormField>
        <FormField label="Email address"><input type="email" value={form.email} onChange={set("email")} /></FormField>
        <FormField label="Location"><input value={form.location} onChange={set("location")} /></FormField>
      </div>

      <FormField label="Access Role">
        <select value={role} onChange={e => setRole(e.target.value)}>
          {USER_ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label || r}</option>)}
        </select>
      </FormField>

      <div style={{
        padding: "10px 14px", borderRadius: "var(--border-radius-md)",
        background: meta.bg, marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: meta.color, marginBottom: 6 }}>
          {ROLE_META[role]?.label} capabilities:
        </div>
        {(ROLE_CAPS[role] || []).map(c => (
          <div key={c} style={{ fontSize: 12, color: meta.color, display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <Icon name="Check" size={12} /> {c}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {[
          { label: "Manual weight entry", desc: "Allow entering weights when scale unavailable. Entry reason required.", val: manual, set: setManual, disabled: role === "admin" },
          { label: "Account active",      desc: "Inactive users cannot sign in. Their token will be revoked.", val: active, set: setActive, disabled: user.role === "admin" },
        ].map(p => (
          <div key={p.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 0", borderBottom: "0.5px solid var(--color-border-tertiary)",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{p.desc}</div>
            </div>
            <Toggle on={p.val} onChange={p.set} disabled={p.disabled} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Btn>
      </div>
    </div>
  );
}

export function UsersPage({ users, setUsers, toast, loading }) {
  const [showAdd, setShowAdd]         = useState(false);
  const [editUser, setEditUser]       = useState(null);
  const [resetUser, setResetUser]     = useState(null);
  const [busy, setBusy]               = useState({});
  const [newPw, setNewPw]             = useState("");
  const [search, setSearch]           = useState("");
  const [filterRole, setFilterRole]   = useState("all");

  const filtered = users.filter(u => {
    if (!u) return false;
    const searchLower = String(search || "").toLowerCase();
    const nameMatch = String(u.name || "").toLowerCase().includes(searchLower);
    const idMatch = String(u.employee_id || "").toLowerCase().includes(searchLower);
    const matchSearch = !search || nameMatch || idMatch;
    const matchRole   = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleDelete = async u => {
    if (!window.confirm(`Permanently delete ${u.name}? This cannot be undone.`)) return;
    setBusy(b => ({ ...b, [u.id]: true }));
    try {
      await usersApi.delete(u.id);
      setUsers(p => p.filter(x => x.id !== u.id));
      toast("User deleted.", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setBusy(b => ({ ...b, [u.id]: false })); }
  };

  const handleResetPw = async () => {
    if (!PASSWORD_REGEX.test(newPw)) {
      return toast(PASSWORD_ERROR_MSG, "error");
    }
    setBusy(b => ({ ...b, [resetUser.id]: true }));
    try {
      await usersApi.resetPassword(resetUser.id, newPw);
      setResetUser(null); setNewPw("");
      toast("Password reset. User must log in again.", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setBusy(b => ({ ...b, [resetUser.id]: false })); }
  };

  const onlineCount  = users.filter(u => u.is_online).length;
  const activeCount  = users.filter(u => u.is_active).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="responsive-grid-4">
        <KPI label="Total users"      value={users.length}   icon="Users" theme="blue" />
        <KPI label="Active accounts"  value={activeCount}    icon="UserCheck" sub="Can sign in" theme="green" />
        <KPI label="Online now"       value={onlineCount}    icon="Wifi"   sub="Last 5 minutes" theme="amber" />
        <KPI label="Field Officers"   value={users.filter(u => u.role === "officer").length} icon="Contact" theme="purple" />
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Icon name="Search" size={14} color="var(--color-text-tertiary)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or employee ID…"
            style={{ paddingLeft: 34 }} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
          <option value="all">All roles</option>
          {USER_ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label}</option>)}
        </select>
        <Btn variant="primary" icon="UserPlus" onClick={() => setShowAdd(true)}>Add user</Btn>
      </div>

      <div className="card">
        <DataTable
          cols={["User", "Employee ID", "Role", "Status", "Manual weight", "Last Activity", "Actions"]}
          empty="No users match your search."
          rows={loading ? [...Array(6)].map((_, i) => (
            <tr key={`skel-${i}`}>
              <TD>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton-box" style={{ height: 12, width: "120px", marginBottom: 6 }} />
                    <div className="skeleton-box" style={{ height: 10, width: "160px" }} />
                  </div>
                </div>
              </TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "80px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 20, width: "70px", borderRadius: 20 }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 20, width: "60px", borderRadius: 20 }} /></TD>
              <TD center><div className="skeleton-box" style={{ height: 20, width: "60px", borderRadius: 20, margin: "0 auto" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "100px" }} /></TD>
              <TD>
                <div style={{ display: "flex", gap: 5 }}>
                  <div className="skeleton-box" style={{ height: 28, width: "60px", borderRadius: 8 }} />
                  <div className="skeleton-box" style={{ height: 28, width: "60px", borderRadius: 8 }} />
                </div>
              </TD>
            </tr>
          )) : filtered.map((u, idx) => {
            if (!u) return null;
            const meta = ROLE_META[u.role] || ROLE_META.viewer;
            return (
              <tr key={u.id || idx} style={{ opacity: u.is_active ? 1 : 0.55 }}>
                <TD>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={u.name} role={u.role} size={32} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{u.email || ""}</div>
                    </div>
                  </div>
                </TD>
                <TD mono>{u.employee_id || "None"}</TD>
                <TD>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                    background: meta.bg, color: meta.color,
                  }}>{meta.label}</span>
                </TD>
                <TD>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: u.is_online ? C.green : "var(--color-border-secondary)" }}>●</span>
                    <Chip text={u.is_active ? "Active" : "Inactive"} color={u.is_active ? "green" : "gray"} />
                  </div>
                </TD>
                <TD center>
                  {u.can_manual_weight
                    ? <Chip text="Granted" color="green" />
                    : <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>None</span>}
                </TD>
                <TD>{u.last_seen ? fmtTimestamp(u.last_seen) : <span style={{ color: "var(--color-text-tertiary)" }}>Never</span>}</TD>
                <TD>
                  <div style={{ display: "flex", gap: 5 }}>
                    <Btn small icon="Edit" onClick={() => setEditUser(u)}>Manage</Btn>
                    <Btn small icon="Key" onClick={() => { setResetUser(u); setNewPw(""); }}>Reset pw</Btn>
                    <Btn small icon="Trash2" variant="danger" onClick={() => handleDelete(u)} disabled={!!busy[u.id]}>Delete</Btn>
                  </div>
                </TD>
              </tr>
            );
          })}
        />
      </div>

      {showAdd && <Modal title="Add new user" onClose={() => setShowAdd(false)} wide>
        <AddUserModal onClose={() => setShowAdd(false)} onCreated={u => setUsers(p => [...p, u])} toast={toast} />
      </Modal>}

      {editUser && <Modal title={`Manage User — ${editUser.name}`} onClose={() => setEditUser(null)} wide>
        <EditRightsModal user={editUser} onClose={() => setEditUser(null)}
          onUpdated={u => { setUsers(p => p.map(x => x.id === u.id ? u : x)); setEditUser(null); }}
          toast={toast} />
      </Modal>}

      {resetUser && <Modal title={`Reset password — ${resetUser.name}`} onClose={() => setResetUser(null)}>
        <FormField label="New password" hint="Min 8 characters. User must log in again after reset.">
          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password" />
        </FormField>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <Btn onClick={() => setResetUser(null)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleResetPw} disabled={busy[resetUser.id]}>Reset password</Btn>
        </div>
      </Modal>}
    </div>
  );
}
