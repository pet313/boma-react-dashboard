import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/common/Icon";
import { Btn } from "../components/common/Btn";
import { FormField } from "../components/common/FormField";
import { C } from "../utils/constants";
import kmclogo from '../assets/kmclogo.jpg'
import kmcslogan from '../assets/kmcslogan.png'

export function LoginPage({ theme, setTheme }) {
  const { login } = useAuth();
  const [eid, setEid] = useState("");
  const [pw, setPw]   = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const isValid = eid.trim() && pw;

  const go = async () => {
    if (!eid || !pw) return setErr("Employee ID and password are required.");
    setBusy(true); setErr("");
    try { await login(eid.trim(), pw); }
    catch (e) { setErr("Invalid employee ID or password. If you have forgotten your credentials, please contact the system administrator for assistance."); }
    finally { setBusy(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center",
      background: "var(--color-background-tertiary)",
      position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: 24, right: 24, zIndex: 10 }}>
        <Btn onClick={() => setTheme(theme === "light" ? "dark" : "light")} variant="default" icon={theme === "light" ? "Moon" : "Sun"}>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </Btn>
      </div>

      <div
        className="login-card"
        style={{
          width: "100%",
          maxWidth: 420,
          margin: "16px",
          background: "var(--color-background-primary)",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
          position: "relative",
          zIndex: 1,
          border: "1px solid var(--color-border-tertiary)"
        }}
      >
        {/* Header stripe */}
        <div className="login-card-header" style={{ background: C.blueDark, padding: "48px 32px 36px", textAlign: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <img
                src={kmclogo}
                alt="KMC Logo"
                style={{
                  width: 60, height: 60, borderRadius: 10, justifyContent: "center",
                  boxShadow: `0 4px 12px ${C.red}40`, border: "1px solid rgba(255, 0, 0, 0.2)"
                }}
              />
            </div>
            <div style={{ width: "100%" }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "clamp(18px, 5vw, 22px)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>Kenya Meat Commission</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>Boma Dashboard</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="login-card-body" style={{ padding: "32px" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6, color: "var(--color-text-primary)" }}> Sign In</div>
            <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
              Welcome back! Please enter your credentials to login.
            </div>
          </div>

          <div className="login-input-group">
            <FormField label="Employee ID">
              <div style={{ position: "relative" }}>
                <Icon name="User" size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", pointerEvents: "none" }} />
                <input
                  type="text" value={eid} placeholder="e.g 12345"
                  onChange={e => setEid(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && go()}
                  autoComplete="username"
                  style={{ paddingLeft: 42 }}
                />
              </div>
            </FormField>

            <FormField label="Password">
              <div style={{ position: "relative" }}>
                <Icon name="Lock" size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", pointerEvents: "none" }} />
                <input
                  type={showPw ? "text" : "password"} value={pw} placeholder="Type your password"
                  onChange={e => setPw(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && go()}
                  autoComplete="current-password"
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 4
                  }}
                >
                  <Icon name={showPw ? "EyeOff" : "Eye"} size={18} />
                </button>
              </div>
            </FormField>
          </div>

          {err && (
            <div style={{
              fontSize: 13, color: C.redDark, background: C.redBg,
              padding: "12px 16px", borderRadius: 12, marginBottom: 20,
              border: `1px solid ${C.red}25`, display: "flex", alignItems: "center", gap: 10
            }}>
              <Icon name="AlertCircle" size={16} /> {err}
            </div>
          )}

          <Btn variant="primary" onClick={go} loading={busy} className={`login-btn ${isValid && !busy ? "btn-pulse" : ""}`}
            style={{ width: "100%", justifyContent: "center", padding: "14px", borderRadius: 12, fontSize: 14 }}>
            {busy ? "Signing in..." : "Sign in to Dashboard"}
          </Btn>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <img
              src={kmcslogan}
              alt="KMC mantra"
              style={{ width: 180, height: "auto" }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
