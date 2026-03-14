export const COMMON_DOCUMENTS = [
  { value: 'PROCESSING_FEES', label: 'Processing Fees Details' },
  { value: 'PRE_FEASIBILITY_REPORT', label: 'Pre-feasibility Report' },
  { value: 'EMP', label: 'EMP' },
  { value: 'FORM_1', label: 'Form 1 / 1-M / CAF' },
  { value: 'LAND_DOCUMENTS', label: 'Land Documents (B-1 P-2)' },
  { value: 'CER_DETAILS', label: 'CER Details with consent of Gram Sabha / Concerned Dept.' },
  { value: 'AFFIDAVITS', label: 'All Affidavits' },
  { value: 'GIST_SUBMISSION', label: 'GIST Submission' }
];

export const CATEGORY_DOCUMENTS: Record<string, { value: string; label: string }[]> = {
  'Mining': [
    { value: 'DISTRICT_SURVEY_REPORT', label: 'District Survey Report (DSR) / Sand Replenishment Study' },
    { value: 'SAND_REPLENISHMENT_STUDY', label: 'Sand Replenishment Study' },
    { value: 'LOI', label: 'LOI' },
    { value: 'GRAM_PANCHAYAT_NOC', label: 'NOC from Gram Panchayat / Local Body' },
    { value: 'CERTIFICATE_200M', label: '200 Meter Certificate' },
    { value: 'CERTIFICATE_500M', label: '500 Meter Certificate' },
    { value: 'MARKED_DELIMITED', label: 'Marked & Delimited' },
    { value: 'MINING_PLAN_APPROVAL', label: 'Mining Plan Approval Letter' },
    { value: 'APPROVED_MINING_PLAN', label: 'Approved Mining Plan' },
    { value: 'FOREST_NOC', label: 'Forest NOC regarding nearest forest area' },
    { value: 'KML_FILE', label: 'KML File' }
  ],
  'Limestone': [
    { value: 'DISTRICT_SURVEY_REPORT', label: 'District Survey Report (DSR) / Sand Replenishment Study' },
    { value: 'CONSENT_OF_LANDOWNER', label: 'Consent of the concerned landowner(s)' },
    { value: 'LOI', label: 'LOI' },
    { value: 'LEASE_DEED', label: 'Lease Deed' },
    { value: 'PREVIOUS_EC', label: 'Previously issued EC' },
    { value: 'COMPLIANCE_ACTIONS', label: 'Actions taken to comply with EC' },
    { value: 'PAST_PRODUCTION_DATA', label: 'Past Production data certified by Mining Department' },
    { value: 'GRAM_PANCHAYAT_NOC', label: 'NOC from Gram Panchayat / Local Body' },
    { value: 'CERTIFICATE_200M', label: '200 Meter Certificate' },
    { value: 'CERTIFICATE_500M', label: '500 Meter Certificate' },
    { value: 'MINING_PLAN_APPROVAL', label: 'Mining Plan Approval Letter' },
    { value: 'APPROVED_MINING_PLAN', label: 'Approved Mining Plan' },
    { value: 'FOREST_NOC', label: 'Forest NOC regarding nearest forest area' },
    { value: 'PLANTATION_WORK', label: 'Complete tree plantation work as per previously issued EC' },
    { value: 'WATER_NOC', label: 'Water NoC (CGWA)' },
    { value: 'CTE_CTO', label: 'CTE / CTO from CECB' },
    { value: 'GEO_TAGGED_PHOTOS', label: 'Geo-tagged Photographs from all directions of project area' },
    { value: 'BOUNDARY_STRIP_RESTORATION', label: '7.5 meter wide boundary strip excavated or Restoration Plan' },
    { value: 'DRONE_VIDEO', label: 'Drone Video (Pen Drive)' },
    { value: 'KML_FILE', label: 'KML File' },
    { value: 'CERTIFIED_COMPLIANCE_REPORT_CCR', label: 'CCR (Certified Compliance Report)' },
    { value: 'CEMP', label: 'C.E.M.P.' },
    { value: 'ENVIRONMENTAL_IMPACT_ASSESSMENT', label: 'EIA Report and Public Hearing' }
  ],
  'Industry': [
    { value: 'CONSENT_OF_LANDOWNER', label: 'Consent of the concerned landowner(s)' },
    { value: 'LEASE_DEED', label: 'Lease Deed' },
    { value: 'PREVIOUS_EC', label: 'Previously issued EC' },
    { value: 'COMPLIANCE_ACTIONS', label: 'Actions taken to comply with EC' },
    { value: 'PAST_PRODUCTION_DATA', label: 'Past Production data certified by Mining Department' },
    { value: 'GRAM_PANCHAYAT_NOC', label: 'NOC from Gram Panchayat / Local Body' },
    { value: 'FOREST_NOC', label: 'Forest NOC regarding nearest forest area' },
    { value: 'PLANTATION_WORK', label: 'Complete tree plantation work as per previously issued EC' },
    { value: 'LAND_USE_BREAKUP', label: 'Land Use Breakup Details' },
    { value: 'ETP', label: 'ETP' },
    { value: 'FIRE_NOC', label: 'Fire NOC' },
    { value: 'WATER_PERMISSION', label: 'Water Permission (NRANVP / CGWA)' },
    { value: 'WATER_NOC', label: 'Water NoC (CGWA)' },
    { value: 'STP_DESIGN', label: 'STP Design & Reuse Plan' },
    { value: 'EMP_COST_ESTIMATE', label: 'EMP Cost Estimates' },
    { value: 'CTE_CTO', label: 'CTE / CTO from CECB' },
    { value: 'TOR_GRANTED', label: 'ToR Granted' },
    { value: 'ENVIRONMENTAL_IMPACT_ASSESSMENT', label: 'EIA Report and Public Hearing' },
    { value: 'WILDLIFE_MANAGEMENT_PLAN', label: 'Wildlife Management Plan' },
    { value: 'PENDING_LITIGATION_AFFIDAVIT', label: 'Affidavit on Pending Litigation' },
    { value: 'AFFIDAVITS', label: 'All Compliance Affidavits' },
    { value: 'DRONE_VIDEO', label: 'Drone Video (Pen Drive)' },
    { value: 'CERTIFIED_COMPLIANCE_REPORT_CCR', label: 'CCR (Certified Compliance Report)' },
    { value: 'CEMP', label: 'C.E.M.P.' }
  ],
  'Infrastructure': [
    { value: 'PREVIOUS_EC', label: 'Previously issued EC' },
    { value: 'COMPLIANCE_ACTIONS', label: 'Actions taken to comply with EC' },
    { value: 'PARTNERSHIP_DEED', label: 'Partnership Deed / Consent of Owner(s)' },
    { value: 'CONCEPTUAL_PLAN', label: 'Conceptual Plan' },
    { value: 'LAYOUT_APPROVAL', label: 'Approved Layout from Town and Country Planning' },
    { value: 'LAND_USE_MAP', label: 'Land Use / Zoning Map' },
    { value: 'BUILT_UP_AREA_STATEMENT', label: 'Built-up Area Statement' },
    { value: 'BUILDING_PERMISSION', label: 'Building Permission' },
    { value: 'WATER_PERMISSION', label: 'Water Permission (NRANVP / CGWA)' },
    { value: 'STP_DESIGN', label: 'STP Design & Reuse Plan' },
    { value: 'SOLID_WASTE_PLAN', label: 'Solid Waste Management Plan' },
    { value: 'SOLAR_ENERGY_PLAN', label: 'Solar Energy Plan' },
    { value: 'GREEN_BELT_STATEMENT', label: 'Green Belt Area Statement' },
    { value: 'EMP_COST_ESTIMATE', label: 'EMP Cost Estimates' },
    { value: 'NBWL_CLEARANCE', label: 'NBWL Clearance (if < 1 km)' },
    { value: 'FIRE_NOC', label: 'Fire NOC' },
    { value: 'AVIATION_NOC', label: 'Aviation NOC' },
    { value: 'WILDLIFE_MANAGEMENT_PLAN', label: 'Wildlife Management Plan' },
    { value: 'CTE_CTO', label: 'CTE / CTO from CECB' },
    { value: 'GEO_TAGGED_PHOTOS', label: 'Geo-tagged Photographs from all directions of project area' },
    { value: 'KML_FILE', label: 'KML File' },
    { value: 'ENVIRONMENTAL_IMPACT_ASSESSMENT', label: 'EIA Report and Public Hearing' }
  ],
  'Other': []
};

/**
 * Returns the full list of required documents for a given sector
 */
export const getRequiredDocuments = (sector: string) => {
  const specificDocs = CATEGORY_DOCUMENTS[sector] || [];
  
  // Create a Map to merge arrays uniquely by value to avoid duplicates
  const docMap = new Map();
  
  COMMON_DOCUMENTS.forEach(doc => docMap.set(doc.value, doc));
  specificDocs.forEach(doc => docMap.set(doc.value, doc));
  
  return Array.from(docMap.values());
};
