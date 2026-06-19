import { useState, Fragment } from "react";
import { DataTable, TD } from "../components/common/DataTable";
import { Avatar } from "../components/common/Avatar";
import { Toggle } from "../components/common/Toggle";
import { Icon } from "../components/common/Icon";
import { C, s, USER_ROLES, ROLE_META } from "../utils/constants";
import { usersApi } from "../api";

export function PermissionsPage({ users, setUsers, toast }) {
  const officers = users.filter(u => u.role === "officer");
  const [busy, setBusy] = useState({});

  const toggleManual = async u => {
    const newVal = !u.can_manual_weight;
    setBusy(b => ({ ...b, [u.id]: true }));
    try {
      await usersApi.setManualWeight(u.id, newVal);
      setUsers(p => p.map(x => x.id === u.id ? { ...x, can_manual_weight: newVal } : x));
      toast(`Manual weight ${newVal ? "granted to" : "revoked from"} ${u.name}.`, "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setBusy(b => ({ ...b, [u.id]: false })); }
  };

  const MATRIX = [
    { section: "General Access", action: "Sign in & view dashboard", admin: true, officer: true,  accounts: true,  viewer: true  },
    { section: "General Access", action: "View MOB / Supplier lists", admin: true, officer: true,  accounts: true,  viewer: true  },

    { section: "Field Operations", action: "Create new MOBs",          admin: true, officer: true,  accounts: false, viewer: false },
    { section: "Field Operations", action: "Add livestock data",       admin: true, officer: true,  accounts: false, viewer: false },
    { section: "Field Operations", action: "Manual weight entry",      admin: true, officer: "Grant", accounts: false, viewer: false },

    { section: "Processing", action: "Close MOB & Generate GRN", admin: true, officer: true,  accounts: false, viewer: false },
    { section: "Processing", action: "View & Download GRNs",     admin: true, officer: true,  accounts: true,  viewer: false },
    { section: "Processing", action: "Print GRN Documents",      admin: true, officer: true,  accounts: true,  viewer: false },
    { section: "Processing", action: "Resend GRN Emails",        admin: true, officer: false, accounts: true,  viewer: false },

    { section: "Administration", action: "Manage users & roles",     admin: true, officer: false, accounts: false, viewer: false },
    { section: "Administration", action: "Revoke/Delete records",    admin: true, officer: false, accounts: false, viewer: false },
  ];

  const cell = v => {
    const style = { display: 'inline-flex', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.02em' };
    if (v === true) return <span style={{ ...style, background: C.greenBg, color: C.greenDark }}>YES</span>;
    if (v === false) return <span style={{ ...style, background: 'var(--color-background-tertiary)', color: 'var(--color-text-tertiary)' }}>NO</span>;
    return <span style={{ ...style, background: C.amberBg, color: C.amberDark }}>{String(v).toUpperCase()}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="responsive-grid-2">
        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Role capability matrix (Field Officer)</div>
          <DataTable
            cols={["Action", "Admin", "Field Officer", "Accounts", "Viewer"]}
            rows={MATRIX.map((r, i) => (
              <Fragment key={i}>
                { (i === 0 || MATRIX[i-1].section !== r.section) && (
                  <tr style={{ background: 'var(--color-background-secondary)' }}>
                    <TD colSpan={5} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-tertiary)', padding: '8px 16px' }}>
                      {r.section}
                    </TD>
                  </tr>
                )}
                <tr>
                  <TD style={{ fontSize: 12, fontWeight: 500 }}>{r.action}</TD>
                  <TD center>{cell(r.admin)}</TD>
                  <TD center>{cell(r.officer)}</TD>
                  <TD center>{cell(r.accounts)}</TD>
                  <TD center>{cell(r.viewer)}</TD>
                </tr>
              </Fragment>
            ))}
          />
        </div>

        <div className="responsive-grid-2">
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Manual weight ;per Field Officer</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 12 }}>
              Field Officers with this permission can enter weights manually when the Bluetooth scale is unavailable.
            </div>
            {officers.length === 0
              ? <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>No Field Officers found.</div>
              : officers.map(u => (
                  <div key={u.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 0", borderBottom: "0.5px solid var(--color-border-tertiary)",
                  }}>
                    <Avatar name={u.name} role={u.role} size={28} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{u.employee_id}</div>
                    </div>
                    <Toggle on={!!u.can_manual_weight} onChange={() => toggleManual(u)} disabled={!!busy[u.id]} />
                    {busy[u.id] && <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Saving…</span>}
                  </div>
                ))
            }
          </div>

          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>User categories</div>
            {USER_ROLES.map(r => {
              const meta = ROLE_META[r];
              const count = users.filter(u => u.role === r).length;
              return (
                <div key={r} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 0", borderBottom: "0.5px solid var(--color-border-tertiary)",
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="User" size={15} color={meta.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{meta.label}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{count} user{count !== 1 ? "s" : ""}</div>
                  </div>
                  <span style={{ padding: "3px 12px", borderRadius: 20, background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 500 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
