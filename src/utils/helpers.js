
export const getInitials = n => String(n || "?").split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase();
export const extractArray = j => !j?[]:Array.isArray(j)?j:Array.isArray(j.data)?j.data:[];
export const fmtWeight = w => Number(w||0).toFixed(3)+" KG";

export const fmtDate = d => {
  if (!d) return "Not specified";
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? d : parsed.toLocaleDateString("en-GB");
};

export const fmtTimestamp = d => {
  if (!d) return "Not specified";
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? d : parsed.toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
};

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

export const buildMobStatusData = (mobs, colours) => [
  { name: "Open",   value: mobs.filter(m => m.mob_status === "OPEN").length,   color: colours.green },
  { name: "Closed", value: mobs.filter(m => m.mob_status === "CLOSED").length, color: colours.blue  },
];

export const buildEmailStatusData = (mobs, colours) => [
  { name: "Sent",    value: mobs.filter(m => m.email_status === "SENT").length,    color: colours.green  },
  { name: "Failed",  value: mobs.filter(m => m.email_status === "FAILED").length,  color: colours.red    },
  { name: "Pending", value: mobs.filter(m => m.email_status === "PENDING").length, color: colours.amber  },
];

export const buildSpeciesData = (animals, colours) => {
  const counts = {};
  animals.forEach(a => {
    const sp = a.species || "Unknown";
    const cap = sp.charAt(0).toUpperCase() + sp.slice(1);
    counts[cap] = (counts[cap] || 0) + 1;
  });
  const SCOLS = { Cattle: colours.blue, Sheep: colours.green, Goat: colours.amber, Camel: colours.purple };
  return Object.entries(counts).map(([name, value]) => ({ 
    name, value, color: SCOLS[name] || colours.gray 
  }));
};

export const buildGenderData = (animals, colours) => {
  const male = animals.filter(a => a.gender?.toLowerCase() === "male").length;
  const female = animals.filter(a => a.gender?.toLowerCase() === "female").length;
  return [
    { name: "Male", value: male, color: colours.blue },
    { name: "Female", value: female, color: colours.purple },
  ];
};

export const buildWeightData = (animals) => {
  const buckets = { "<100": 0, "100-200": 0, "200-300": 0, "300-400": 0, ">400": 0 };
  animals.forEach(a => {
    const w = parseFloat(a.weight || 0);
    if (w < 100) buckets["<100"]++;
    else if (w < 200) buckets["100-200"]++;
    else if (w < 300) buckets["200-300"]++;
    else if (w < 400) buckets["300-400"]++;
    else buckets[">400"]++;
  });
  return Object.entries(buckets).map(([band, count]) => ({ band, count }));
};
