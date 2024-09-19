import { parseXML } from './lib/parsing';

// Parse the esrs_cor.xsd file to extract Role URIs and Definitions
const extractRoleDefinitions = async (esrsCorFilePath: string): Promise<{ [key: string]: string }> => {
  const roleMap: { [key: string]: string } = {};
  const esrsCorFile = await parseXML(esrsCorFilePath);

  const roleTypes = esrsCorFile['xsd:schema']?.['link:roleType'] || [];
  roleTypes.forEach((roleType: any) => {
    const roleId = roleType['$']['id']; // e.g., role-301020
    const definition = roleType['link:definition']; // e.g., "[301020] E1-2 Policies related to climate change mitigation and adaptation"
    roleMap[roleId] = definition;
  });

  return roleMap;
};

// Parse the gla_esrs-en.xml or lab_esrs-en.xml file to map locators to roles
const mapLocatorsToRoles = async (
  labelFilePath: string,
  roleMap: { [key: string]: string }
): Promise<{ [key: string]: string }> => {
  const locatorRoleMap: { [key: string]: string } = {};
  const labelFile = await parseXML(labelFilePath);

  const labelLink = labelFile['link:linkbase']?.['link:labelLink'];
  const locators = labelLink['link:loc'] || [];

  locators.forEach((loc: any) => {
    const href = loc['$']['xlink:href']; // e.g., ../esrs_cor.xsd#role-301020
    const roleId = href.split('#')[1]; // Extract the role ID (e.g., role-301020)
    if (roleMap[roleId]) {
      locatorRoleMap[loc['$']['xlink:label']] = roleMap[roleId]; // Map the locator to the role definition
    }
  });

  return locatorRoleMap;
};

// Step 1: Parse the label linkbase with arcs
const buildLabelMap = async (labelFilePath: string): Promise<{ [key: string]: string }> => {
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

// Step 2: Build the hierarchy and integrate labels
// Update the hierarchy builder to include ID/Code (e.g., E1-2) for each disclosure
const buildDisclosureHierarchy = (
  presentationLinkbase: any,
  labelMap: { [key: string]: string },
  locatorRoleMap: { [key: string]: string }
) => {
  const disclosures: any = {};

  const locators: any = {};
  const locElements = presentationLinkbase['link:linkbase']?.['link:presentationLink']?.['link:loc'];

  if (!locElements) {
    console.error("No 'link:loc' elements found");
    return disclosures;
  }

  locElements.forEach((loc: any) => {
    const label = loc['$']['xlink:label'];
    const href = loc['$']['xlink:href'];
    locators[label] = href; // Map locator labels to their href values
  });

  const arcs = presentationLinkbase['link:linkbase']?.['link:presentationLink']?.['link:presentationArc'];
  if (!arcs) {
    console.error("No 'link:presentationArc' elements found");
    return disclosures;
  }

  arcs.forEach((arc: any) => {
    const from = arc['$']['xlink:from'];
    const to = arc['$']['xlink:to'];

    const parentHref = locators[from];
    const childHref = locators[to];

    const parentLabel = labelMap[from] || parentHref;
    const childLabel = labelMap[to] || childHref;

    const parentRole = locatorRoleMap[from] || parentHref; // Get ID/Code
    const childRole = locatorRoleMap[to] || childHref; // Get ID/Code

    if (parentHref && childHref) {
      if (!disclosures[parentHref]) {
        disclosures[parentHref] = {
          id: parentRole, // Add ID/Code (e.g., E1-2)
          label: parentLabel,
          children: []
        };
      }

      if (!disclosures[childHref]) {
        disclosures[childHref] = {
          id: childRole, // Add ID/Code (e.g., E1-2.1)
          label: childLabel,
          children: []
        };
      }

      disclosures[parentHref].children.push(disclosures[childHref]);
    } else {
      console.warn(`Missing locator reference for parent (${from}) or child (${to})`);
    }
  });

  return disclosures;
};

async function main() {
  const rootPath = './ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/';
  const presentationFilePath = 'all/linkbases/pre_esrs_301040.xml';
  const labelFilePath = 'common/labels/lab_esrs-en.xml';
  const esrsCorFilePath = 'common/esrs_cor.xsd';

  // Parse the presentation linkbase
  const presentationLinkbase = await parseXML(rootPath + presentationFilePath);

  // Extract role definitions (ID/Code) from esrs_cor.xsd
  const roleMap = await extractRoleDefinitions(rootPath + esrsCorFilePath);

  // Map locators to role definitions
  const locatorRoleMap = await mapLocatorsToRoles(rootPath + labelFilePath, roleMap);

  // Parse the label file and build the label map using arcs
  const labelMap = await buildLabelMap(rootPath + labelFilePath);

  // Build the disclosure hierarchy with labels, IDs, and roles
  const hierarchy = buildDisclosureHierarchy(presentationLinkbase, labelMap, locatorRoleMap);

  // Output the result
  console.log('hierarchy:', JSON.stringify(hierarchy, null, 2));
}

main();
