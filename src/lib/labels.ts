import { parseXML } from './parsing';

/** Build a dictionary of labels. */
export const buildLabelMap = async (labelFilePath: string): Promise<{ [key: string]: string }> => {
  const labelMap: { [key: string]: string } = {};
  const labelFile = await parseXML(labelFilePath);

  // Extract locators, labels, and label arcs
  const labelLink = labelFile['link:linkbase']?.['link:labelLink'];

  if (!labelLink) {
    console.error("No 'link:labelLink' elements found");
    return labelMap;
  }

  const locators = labelLink['link:loc'] || [];
  const labels = labelLink['link:label'] || [];
  const arcs = labelLink['link:labelArc'] || [];

  // Step 2: Build locator-to-label maps using arcs
  const locatorToLabelMap: { [key: string]: string } = {};
  arcs.forEach((arc: any) => {
    const from = arc['$']['xlink:from']; // Locator reference (e.g., loc_2)
    const to = arc['$']['xlink:to']; // Label reference (e.g., res_2)
    locatorToLabelMap[from] = to; // Map locator to label resource
  });

  // Step 3: Extract human-readable labels from label elements
  const labelResourceMap: { [key: string]: string } = {};
  labels.forEach((label: any) => {
    const labelId = label['$']['xlink:label']; // e.g., res_2
    const labelText = label['_']; // Human-readable label text
    labelResourceMap[labelId] = labelText;
  });

  // Step 4: Combine locator to label mapping
  locators.forEach((loc: any) => {
    const locatorId = loc['$']['xlink:label']; // e.g., loc_2
    const labelId = locatorToLabelMap[locatorId]; // e.g., res_2
    if (labelId && labelResourceMap[labelId]) {
      labelMap[locatorId] = labelResourceMap[labelId]; // Map locator to label
    }
  });

  return labelMap;
};

export const buildRoleLabelMap = async (labelFilePath: string): Promise<{ [key: string]: string }> => {
  const labelMap: { [key: string]: string } = {}; // Map to hold role URIs and labels
  const labelFile = await parseXML(labelFilePath); // Parse the XML file

  // Extract the elements from the XML structure
  const linkbase = labelFile['link:linkbase'];
  const locations = linkbase?.['gen:link']?.['link:loc'] || [];
  const labels = linkbase?.['gen:link']?.['label:label'] || [];
  const arcs = linkbase?.['gen:link']?.['gen:arc'] || [];

  // Map locators (e.g., loc_1) to the corresponding role URIs (e.g., role-200510)
  const locatorToRoleMap: { [key: string]: string } = {};
  locations.forEach((loc: any) => {
    const href = loc['$']['xlink:href']; // e.g., ../esrs_cor.xsd#role-200510
    const roleId = href.split('#')[1]; // Extract the role ID part (e.g., role-200510)
    locatorToRoleMap[loc['$']['xlink:label']] = roleId; // Map loc_1 -> role-200510
  });

  // Map label references (e.g., res_1) to the actual label texts
  const labelResourceMap: { [key: string]: string } = {};
  labels.forEach((label: any) => {
    const labelId = label['$']['xlink:label']; // e.g., res_1
    const labelText = label['_']; // The human-readable label text
    labelResourceMap[labelId] = labelText; // Map res_1 -> '[200510] ...'
  });

  // Now map the role URIs to their labels by following arcs (from locators to labels)
  arcs.forEach((arc: any) => {
    const from = arc['$']['xlink:from']; // The locator reference (e.g., loc_1)
    const to = arc['$']['xlink:to']; // The label reference (e.g., res_1)
    const roleId = locatorToRoleMap[from]; // Get the role ID for this locator
    const labelText = labelResourceMap[to]; // Get the label text for this label reference

    if (roleId && labelText) {
      labelMap[roleId] = labelText; // Map role-200510 -> '[200510] ...'
    }
  });

  return labelMap; // Return the final role-to-label map
};
