
const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
export const API_BASE_URL = rawApiUrl ? rawApiUrl.replace(/\/+$/, "") : "/api";
export const TOKEN_KEY = "kmc_token";
export const USER_KEY  = "kmc_user";

export const C = {
  blue:   "#003893", blueDark: "#012859", blueBg: "#E8EDFF",
  green:  "#35B825", greenDark: "#1A6B2D", greenBg: "#E7F9E4",
  red:    "#C8102E", redDark:  "#8A1820", redBg:  "#FDE8EC",
  amber:  "#F37021", amberDark: "#A14614", amberBg: "#FFE7D2",
  purple: "#7F77DD", purpleDark: "#3C3489", purpleBg: "#EEEDFE",
  gray:   "#616A7A", grayBg:   "#EDF0F6",
};

export const s = {
  card: {
    background: "var(--color-card-bg)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid var(--color-card-border)",
    borderRadius: "var(--border-radius-lg)",
    padding: "18px 20px",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.06)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  },
  metric: {
    borderRadius: "var(--border-radius-md)",
    padding: "16px 18px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease",
    position: "relative",
    overflow: "hidden",
  },
  row: { display: "flex", alignItems: "center", gap: 8 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 },
  grid2: { display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 12 },
};

export const ROLE_META = {
  admin:    { label:"Admin",             color:"#A32D2D", bg:"#FCEBEB", badge:"red"    },
  officer:  { label:"Field Officer",     color:"#185FA5", bg:"#E6F1FB", badge:"blue"   },
  accounts: { label:"Accounts",          color:"#3B6D11", bg:"#EAF3DE", badge:"green"  },
  viewer:   { label:"Viewer",            color:"#854F0B", bg:"#FAEEDA", badge:"amber"  },
};

export const USER_ROLES = ["admin", "officer", "accounts", "viewer"];

export const NAV = [
  {id:"overview",    icon:"LayoutDashboard",  label:"Dashboard",       section:"Overview"},
  {id:"mobs",        icon:"ListTodo",         label:"MOB analytics",   section:null},
  {id:"livestock",   icon:"BarChart3",        label:"Livestock",       section:null},
  {id:"grn",         icon:"FileBadge",        label:"GRN & Emails",    section:null},
  {id:"locations",   icon:"MapPin",           label:"Boma locations",  section:null},
  {id:"users",       icon:"Users",            label:"User management", section:"Administration"},
  {id:"permissions", icon:"ShieldCheck",      label:"Permissions",     section:null},
  {id:"suppliers",   icon:"Store",            label:"Suppliers",       section:null},
];

export const FALLBACK_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const FALLBACK_INTAKE = FALLBACK_MONTHS.map((m,i)=>({month:m,livestock:[420,390,510,480,620,560,590,640,500,470,520,404][i]}));

// Aliases to satisfy hooks and external references
export const COLOURS = C;
export const FALLBACK_INTAKE_DATA = FALLBACK_INTAKE;
