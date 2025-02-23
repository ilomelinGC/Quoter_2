// netlify/functions/getData.js
const fetch = require("node-fetch");

// Our Airtable table name for clinics
const CLINICS_TABLE = "Clinic Database";

// Define a mapping object for procedure fields.
// Keys: the exact Airtable field names (with " - GC")
// Values: an object with the simplified name (without " - GC") and a maxUnits value.
const procedureMapping = {
  '"All on Four" - GC': { name: '"All on Four"', maxUnits: 1 },
  '"All on Four" System by Nobel or Straumann - GC': { name: '"All on Four" System by Nobel or Straumann', maxUnits: 1 },
  '"All on Six" - GC': { name: '"All on Six"', maxUnits: 1 },
  '"All on Six" System with fixed Zyrconia / Porcelain bridge - GC': { name: '"All on Six" System with fixed Zyrconia / Porcelain bridge', maxUnits: 1 },
  '"All on Six" System with Nobel Biocare Implants ** - GC': { name: '"All on Six" System with Nobel Biocare Implants **', maxUnits: 1 },
  '3 on 6 dental implants - GC': { name: '3 on 6 dental implants', maxUnits: 1 },
  '3 unit bridge (Porcelain fused to Metal Crown) - GC': { name: '3 unit bridge (Porcelain fused to Metal Crown)', maxUnits: 4 },
  'All-on-4 package for both arches - GC': { name: 'All-on-4 package for both arches', maxUnits: 1 },
  'All-on-6 package for both arches - GC': { name: 'All-on-6 package for both arches', maxUnits: 1 },
  'Bone graft (large) - GC': { name: 'Bone graft (large)', maxUnits: 2 },
  'Bone graft (medium) - GC': { name: 'Bone graft (medium)', maxUnits: 2 },
  'Bone graft (small) - GC': { name: 'Bone graft (small)', maxUnits: 2 },
  'Complete Removable Denture - GC': { name: 'Complete Removable Denture', maxUnits: 1 },
  'Composite Filling - GC': { name: 'Composite Filling', maxUnits: 10 },
  'Composite Filling (1 surface) - GC': { name: 'Composite Filling (1 surface)', maxUnits: 10 },
  'Composite Filling (3 surface) - GC': { name: 'Composite Filling (3 surface)', maxUnits: 10 },
  'Crown over implant (including abutment) - GC': { name: 'Crown over implant (including abutment)', maxUnits: 4 },
  'CT Scan/3D X-ray - GC': { name: 'CT Scan/3D X-ray', maxUnits: 1 },
  'Deep Cleaning, Scaling & Root Planing (per quadrant) - GC': { name: 'Deep Cleaning, Scaling & Root Planing (per quadrant)', maxUnits: 4 },
  'Dental Cleaning - GC': { name: 'Dental Cleaning', maxUnits: 1 },
  'Extraction (simple) - GC': { name: 'Extraction (simple)', maxUnits: 4 },
  'Extraction (surgical or impacted) / Wisdom Tooth - GC': { name: 'Extraction (surgical or impacted) / Wisdom Tooth', maxUnits: 4 },
  'Frenectomy - GC': { name: 'Frenectomy', maxUnits: 1 },
  'Gingivectomy - GC': { name: 'Gingivectomy', maxUnits: 1 },
  'Gingivoplasty - GC': { name: 'Gingivoplasty', maxUnits: 1 },
  'Implant Supported Overdenture, removable (with 2 implants) - GC': { name: 'Implant Supported Overdenture, removable (with 2 implants)', maxUnits: 1 },
  'Implant Supported Overdenture, removable (with 3 implants) ** - GC': { name: 'Implant Supported Overdenture, removable (with 3 implants) **', maxUnits: 1 },
  'Implants Supported Porcelain Bridge, Full Arch (with 6 implants) - GC': { name: 'Implants Supported Porcelain Bridge, Full Arch (with 6 implants)', maxUnits: 1 },
  'Implants Supported Porcelain Bridge, Full Arch (with 8 implants) - GC': { name: 'Implants Supported Porcelain Bridge, Full Arch (with 8 implants)', maxUnits: 1 },
  'Invisalign monthly fees - GC': { name: 'Invisalign monthly fees', maxUnits: 1 },
  'Invisalign starting at - GC': { name: 'Invisalign starting at', maxUnits: 1 },
  'IV Sedation (by anesthesiologist) - GC': { name: 'IV Sedation (by anesthesiologist)', maxUnits: 1 },
  'Metal Brackets monthly fees - GC': { name: 'Metal Brackets monthly fees', maxUnits: 12 },
  'Metal Brackets starting at - GC': { name: 'Metal Brackets starting at', maxUnits: 12 },
  'Partial Removable Denture - GC': { name: 'Partial Removable Denture', maxUnits: 1 },
  'Porcelain Fused to Gold Crown* - GC': { name: 'Porcelain Fused to Gold Crown*', maxUnits: 4 },
  'Porcelain Fused to Metal Crown - GC': { name: 'Porcelain Fused to Metal Crown', maxUnits: 4 },
  'Porcelain Veneer - GC': { name: 'Porcelain Veneer', maxUnits: 8 },
  'Post/Core Build-Up - GC': { name: 'Post/Core Build-Up', maxUnits: 4 },
  'Pure Ceramic Implant (implant only) - GC': { name: 'Pure Ceramic Implant (implant only)', maxUnits: 4 },
  'Root Canal (not including crown) - GC': { name: 'Root Canal (not including crown)', maxUnits: 8 },
  'Root Canal Treatment (including post/core & porcelain crown) - GC': { name: 'Root Canal Treatment (including post/core & porcelain crown)', maxUnits: 8 },
  'Root Canal Treatment (including post/core & standard crown) - GC': { name: 'Root Canal Treatment (including post/core & standard crown)', maxUnits: 8 },
  'Sinus Lift starting at - GC': { name: 'Sinus Lift starting at', maxUnits: 2 },
  'Snap on-4  - GC': { name: 'Snap on-4', maxUnits: 1 },
  'Snap on-4 package for both arches  - GC': { name: 'Snap on-4 package for both arches', maxUnits: 1 },
  'Straumann BLX or Nobel Implant (implant only) - GC': { name: 'Straumann BLX or Nobel Implant (implant only)', maxUnits: 1 },
  'Straumann Implant package (Straumann Implant + Zirconium Crown) - GC': { name: 'Straumann Implant package (Straumann Implant + Zirconium Crown)', maxUnits: 1 },
  'Temporary Crown (long term use) - GC': { name: 'Temporary Crown (long term use)', maxUnits: 4 },
  'Temporary Crown/Veneer - GC': { name: 'Temporary Crown/Veneer', maxUnits: 4 },
  'Titanium Dental Implant (implant only) starting at - GC': { name: 'Titanium Dental Implant (implant only) starting at', maxUnits: 4 },
  'Titanium Dental Implant + Crown - GC': { name: 'Titanium Dental Implant + Crown', maxUnits: 4 },
  'Zirconium Crown - GC': { name: 'Zirconium Crown', maxUnits: 4 },
  'Zirconium Veneer - GC': { name: 'Zirconium Veneer', maxUnits: 8 },
  'Zygomatic Implant Package*** - GC': { name: 'Zygomatic Implant Package***', maxUnits: 1 },
};

// Build the treatments list from the procedureMapping object.
const buildTreatmentsList = () => {
  return Object.entries(procedureMapping).map(([airtableField, procInfo]) => {
    // Use the simplified name as the id and name.
    return {
      id: procInfo.name,
      name: procInfo.name,
      maxUnits: procInfo.maxUnits,
    };
  });
};

const staticTreatments = buildTreatmentsList();

const fetchAirtableData = async (tableName) => {
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
    tableName
  )}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching ${tableName}: ${response.statusText}`);
  }

  const data = await response.json();

  // Process each record to include only desired fields.
  return data.records.map((record) => {
    const fields = record.fields;
    return {
      id: record.id,
      "Clinic Name": fields["Clinic Name"],
      Location: fields["Location"],
      highlights: fields["Specialties Available at Clinic"] || [],
      procedurePricing: (() => {
        // For each procedure in our mapping, if the record contains that field, add it.
        let pricing = {};
        Object.keys(procedureMapping).forEach((airtableField) => {
          if (fields.hasOwnProperty(airtableField)) {
            // Use the simplified procedure name as the key.
            const simplifiedName = procedureMapping[airtableField].name;
            pricing[simplifiedName] = fields[airtableField];
          }
        });
        return pricing;
      })(),
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