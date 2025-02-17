// netlify/functions/getData.js
const fetch = require("node-fetch");

// Our Airtable table name for clinics
const CLINICS_TABLE = "Clinic Database";

// Our static treatments list (the one we started with)
const staticTreatments = [
  { id: "all-on-four", name: "All on Four", maxUnits: 1 },
  { id: "all-on-six", name: "All on Six", maxUnits: 1 },
  { id: "three-unit-bridge", name: "3 Unit Bridge", maxUnits: 4 },
  { id: "bone-graft-large", name: "Bone Graft (Large)", maxUnits: 2 },
  { id: "composite-filling", name: "Composite Filling", maxUnits: 10 },
  { id: "zirconium-crown", name: "Zirconium Crown", maxUnits: 4 },
  { id: "snap-on-4", name: "Snap On 4", maxUnits: 1 },
  { id: "titanium-implant", name: "Titanium Implant", maxUnits: 4 },
  { id: "porcelain-veneer", name: "Porcelain Veneer", maxUnits: 8 },
  { id: "sinus-lift", name: "Sinus Lift", maxUnits: 2 },
  { id: "root-canal", name: "Root Canal", maxUnits: 8 },
  { id: "temporary-crown", name: "Temporary Crown", maxUnits: 4 },
  { id: "iv-sedation", name: "IV Sedation", maxUnits: 1 },
  { id: "dental-cleaning", name: "Dental Cleaning", maxUnits: 1 },
  {
    id: "all-on-4-package-both-arches",
    name: "All on 4 Package (Both Arches)",
    maxUnits: 1,
  },
  {
    id: "all-on-four-system-nobel-straumann",
    name: "All on Four System (Nobel Straumann)",
    maxUnits: 1,
  },
  {
    id: "implant-supported-overdenture-3-implants",
    name: "Implant Supported Overdenture (3 Implants)",
    maxUnits: 1,
  },
  { id: "3-on-6-dental-implants", name: "3 on 6 Dental Implants", maxUnits: 1 },
  { id: "zirconium-veneer", name: "Zirconium Veneer", maxUnits: 8 },
  {
    id: "metal-brackets-monthly-fees",
    name: "Metal Brackets (Monthly Fees)",
    maxUnits: 12,
  },
  { id: "bone-graft-small", name: "Bone Graft (Small)", maxUnits: 2 },
  {
    id: "straumann-implant-package",
    name: "Straumann Implant Package",
    maxUnits: 1,
  },
  {
    id: "all-on-six-system-nobel-biocare",
    name: "All on Six System (Nobel Biocare)",
    maxUnits: 1,
  },
  {
    id: "complete-removable-denture",
    name: "Complete Removable Denture",
    maxUnits: 1,
  },
  { id: "gingivoplasty", name: "Gingivoplasty", maxUnits: 1 },
  {
    id: "partial-removable-denture",
    name: "Partial Removable Denture",
    maxUnits: 1,
  },
  { id: "bone-graft-medium", name: "Bone Graft (Medium)", maxUnits: 2 },
  {
    id: "implants-supported-porcelain-bridge-8-implants",
    name: "Implants Supported Porcelain Bridge (8 Implants)",
    maxUnits: 1,
  },
  {
    id: "snap-on-4-package-both-arches",
    name: "Snap On 4 Package (Both Arches)",
    maxUnits: 1,
  },
  {
    id: "crown-over-implant-abutment",
    name: "Crown Over Implant Abutment",
    maxUnits: 4,
  },
  { id: "ct-scan-3d-xray", name: "CT Scan 3D X-Ray", maxUnits: 1 },
  { id: "extraction-simple", name: "Extraction (Simple)", maxUnits: 4 },
  { id: "pure-ceramic-implant", name: "Pure Ceramic Implant", maxUnits: 4 },
  {
    id: "implant-supported-overdenture-2-implants",
    name: "Implant Supported Overdenture (2 Implants)",
    maxUnits: 1,
  },
  { id: "gingivectomy", name: "Gingivectomy", maxUnits: 1 },
  {
    id: "porcelain-fused-to-metal-crown",
    name: "Porcelain Fused to Metal Crown",
    maxUnits: 4,
  },
  {
    id: "titanium-dental-implant-crown",
    name: "Titanium Dental Implant Crown",
    maxUnits: 4,
  },
  {
    id: "porcelain-fused-to-gold-crown",
    name: "Porcelain Fused to Gold Crown",
    maxUnits: 4,
  },
  {
    id: "extraction-surgical-impacted",
    name: "Extraction (Surgical Impacted)",
    maxUnits: 4,
  },
  { id: "post-core-build-up", name: "Post Core Build Up", maxUnits: 4 },
  {
    id: "titanium-dental-implant-only",
    name: "Titanium Dental Implant Only",
    maxUnits: 4,
  },
  {
    id: "sinus-lift-starting-at",
    name: "Sinus Lift (Starting At)",
    maxUnits: 2,
  },
  {
    id: "deep-cleaning-scaling-root-planing",
    name: "Deep Cleaning / Scaling & Root Planing",
    maxUnits: 4,
  },
  { id: "zirconium-veneer-gc", name: "Zirconium Veneer (GC)", maxUnits: 8 },
  {
    id: "temporary-crown-veneer-gc",
    name: "Temporary Crown Veneer (GC)",
    maxUnits: 4,
  },
  {
    id: "root-canal-not-including-crown",
    name: "Root Canal (Not Including Crown)",
    maxUnits: 8,
  },
];

// Mapping from treatment IDs to possible Airtable field names
const treatmentFieldMapping = {
  "all-on-four": [
    "All-on-4 package for both arches - GC",
    '"All on Four" System by Nobel or Straumann - GC',
    '"All on Four"',
  ],
  "all-on-six": [
    '"All on Six"',
    '"All on Six" - GC',
    "All-on-6 package for both arches",
    "All-on-6 package for both arches - GC",
  ],
  "three-unit-bridge": ["3 unit bridge (Porcelain fused to Metal Crown) - GC"],
  "bone-graft-large": ["Bone graft (large) - GC", "Bone graft (large)"],
  "composite-filling": [
    "Composite Filling",
    "Composite Filling - GC",
    "Composite Filling (1 surface)",
    "Composite Filling (3 surface) - GC",
  ],
  "zirconium-crown": ["Zirconium Crown", "Zirconium Crown - GC"],
  "snap-on-4": [
    "Snap on-4 package for both arches",
    "Snap on-4 package for both arches - GC",
    "Snap on-4  - GC",
  ],
  "titanium-implant": [
    "Titanium Dental Implant (implant only)",
    "Titanium Dental Implant (implant only) - GC",
    "Titanium Dental Implant (implant only) starting at - GC",
  ],
  "porcelain-veneer": ["Porcelain Veneer", "Porcelain Veneer - GC"],
  "sinus-lift": ["Sinus Lift starting at", "Sinus Lift starting at - GC"],
  "root-canal": [
    "Root Canal (not including crown)",
    "Root Canal Treatment (including post/core & standard crown)",
    "Root Canal (not including crown) - GC",
  ],
  "temporary-crown": [
    "Temporary Crown/Veneer",
    "Temporary Crown (long term use)",
    "Temporary Crown/Veneer - GC",
  ],
  "iv-sedation": ["IV Sedation (by anesthesiologist) - GC"],
  "dental-cleaning": ["Dental Cleaning", "Dental Cleaning - GC"],
};

const fetchAirtableData = async (tableName) => {
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching ${tableName}: ${response.statusText}`);
  }

  const data = await response.json();

  return data.records.map((record) => {
    const fields = record.fields;
    if (tableName === CLINICS_TABLE) {
      let pricing = {};
      for (const treatmentId in treatmentFieldMapping) {
        const possibleFields = treatmentFieldMapping[treatmentId];
        for (const fieldName of possibleFields) {
          if (fields.hasOwnProperty(fieldName)) {
            pricing[treatmentId] = fields[fieldName];
            break;
          }
        }
      }
      fields.procedurePricing = pricing;
      // Ensure a 'highlights' field exists.
      if (!fields.hasOwnProperty("highlights")) {
        if (fields["Specialties Available at Clinic"]) {
          fields.highlights = fields["Specialties Available at Clinic"];
        } else {
          fields.highlights = []; // default to empty array
        }
      }
    }
    return {
      id: record.id,
      ...fields,
    };
  });
};

exports.handler = async function (event, context) {
  // Handle preflight OPTIONS request for CORS.
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: "",
    };
  }
  
  try {
    const clinics = await fetchAirtableData(CLINICS_TABLE);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ clinics, treatments: staticTreatments }),
    };
  } catch (error) {
    console.error("Error in getData function:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: error.toString() }),
    };
  }
};