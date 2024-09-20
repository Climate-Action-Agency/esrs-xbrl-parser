import { join } from 'path';
import { readdir } from 'fs/promises';
import { parseXML } from './lib/parsing';
import { printHierarchyTree } from './lib/output';

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

// Map locators to their corresponding resource labels (e.g., loc_1 -> res_390)
const mapLocatorsToResources = async (glaLabelFilePath: string): Promise<{ [key: string]: string }> => {
  const locatorToResourceMap: { [key: string]: string } = {};
  const glaFile = await parseXML(glaLabelFilePath);

  const genLink = glaFile['link:linkbase']?.['gen:link'];
  const arcs = genLink?.['gen:arc'] || [];

  // Iterate through the arcs to map locators to resources
  arcs.forEach((arc: any) => {
    const from = arc['$']['xlink:from']; // e.g., loc_1
    const to = arc['$']['xlink:to']; // e.g., res_390
    locatorToResourceMap[from] = to; // Map locator to resource
  });

  return locatorToResourceMap;
};

// Combine locator-to-resource map and headline map to get locators mapped to headlines
const mapLocatorsToHeadlines = async (glaLabelFilePath: string) => {
  const locatorToResourceMap = await mapLocatorsToResources(glaLabelFilePath);
  const headlineMap = await extractHeadlinesFromLabelElements(glaLabelFilePath);

  const locatorToHeadlineMap: { [key: string]: string } = {};

  Object.keys(locatorToResourceMap).forEach((locator) => {
    const resource = locatorToResourceMap[locator]; // e.g., res_390
    const headline = headlineMap[resource]; // Find the headline for res_390
    if (headline) {
      locatorToHeadlineMap[locator] = headline;
    }
  });

  return locatorToHeadlineMap;
};

// Extract headlines from label:label elements in gla_esrs-en.xml
const extractHeadlinesFromLabelElements = async (glaLabelFilePath: string): Promise<{ [key: string]: string }> => {
  const headlineMap: { [key: string]: string } = {};
  const glaFile = await parseXML(glaLabelFilePath);

  const genLink = glaFile['link:linkbase']?.['gen:link'];
  const labels = genLink?.['label:label'] || [];

  // Iterate through the label elements to extract human-readable headlines
  labels.forEach((label: any) => {
    const labelId = label['$']['xlink:label']; // e.g., res_390
    const headline = label['_']; // e.g., "[200510] ESRS2.BP-1 General basis for..."
    headlineMap[labelId] = headline;
  });

  return headlineMap;
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
// Update the hierarchy builder to include both primary labels and headlines
const buildDisclosureHierarchy = (
  presentationLinkbase: any,
  labelMap: { [key: string]: string },
  locatorRoleMap: { [key: string]: string },
  locatorToHeadlineMap?: { [key: string]: string }
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

    const parentLabel = locatorToHeadlineMap?.[from] || labelMap?.[from] || parentHref;
    const childLabel = locatorToHeadlineMap?.[to] || labelMap?.[to] || childHref;

    const parentRole = locatorRoleMap[from] || parentHref; // Get ID/Code
    const childRole = locatorRoleMap[to] || childHref; // Get ID/Code

    if (parentHref && childHref) {
      if (!disclosures[parentHref]) {
        disclosures[parentHref] = {
          id: parentRole, // Add ID/Code (e.g., E1-2)
          label: parentLabel, // Use the headline or label
          children: []
        };
      }

      if (!disclosures[childHref]) {
        disclosures[childHref] = {
          id: childRole, // Add ID/Code (e.g., E1-2.1)
          label: childLabel, // Use the headline or label
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

const getPresentationFileNumber = (file: string) => {
  const match = file.match(/pre_esrs_(\d+)\.xml/); // Extracts the numeric value
  return match ? parseInt(match[1], 10) : 0;
};

async function main() {
  const rootPath = './ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/';
  const labelFilePath = 'common/labels/lab_esrs-en.xml';
  // const glaLabelFilePath = 'common/labels/gla_esrs-en.xml';
  const esrsCorFilePath = 'common/esrs_cor.xsd';

  const linkbaseDirName = 'all/linkbases';
  const linkbaseDir = join(rootPath, linkbaseDirName);
  const linkbaseFiles = await readdir(linkbaseDir);
  const presentationFiles = linkbaseFiles
    .filter((file) => file.startsWith('pre_esrs_') && file.endsWith('.xml'))
    .sort((a, b) => getPresentationFileNumber(a) - getPresentationFileNumber(b));

  let allPresentationLinkbases: any = {};
  presentationFiles.forEach(async (fileName) => {
    const presentationFilePath = join(linkbaseDir, fileName);
    const presentationLinkbase = await parseXML(presentationFilePath);
    // console.log(
    //   'Processing:',
    //   fileName,
    //   [
    //     presentationLinkbase['link:linkbase']?.['link:presentationLink']?.['link:loc'].length,
    //     presentationLinkbase['link:linkbase']?.['link:presentationLink']?.['link:presentationArc'].length
    //   ],
    //   JSON.stringify(allPresentationLinkbases).length
    // );
    const linkLocs = presentationLinkbase['link:linkbase']?.['link:presentationLink']?.['link:loc'] ?? [];
    const linkLocsArray = Array.isArray(linkLocs) ? linkLocs : [linkLocs];
    const presentationArcs =
      presentationLinkbase['link:linkbase']?.['link:presentationLink']?.['link:presentationArc'] ?? [];
    const presentationArcsArray = Array.isArray(presentationArcs) ? presentationArcs : [presentationArcs];
    allPresentationLinkbases = {
      ...allPresentationLinkbases,
      'link:linkbase': {
        'link:presentationLink': {
          'link:loc': [
            ...(allPresentationLinkbases?.['link:linkbase']?.['link:presentationLink']?.['link:loc'] ?? []),
            ...linkLocsArray
          ],
          'link:presentationArc': [
            ...(allPresentationLinkbases['link:linkbase']?.['link:presentationLink']?.['link:presentationArc'] ?? []),
            ...presentationArcsArray
          ]
        }
      }
    };
  });

  // Extract role definitions (ID/Code) from esrs_cor.xsd
  const roleMap = await extractRoleDefinitions(rootPath + esrsCorFilePath);

  // Map locators to role definitions
  const locatorRoleMap = await mapLocatorsToRoles(rootPath + labelFilePath, roleMap);

  // Parse the label file and build the label map using arcs
  const labelMap = await buildLabelMap(rootPath + labelFilePath);

  // Map locators to headlines
  // const locatorToHeadlineMap = await mapLocatorsToHeadlines(rootPath + glaLabelFilePath);

  // Build the disclosure hierarchy with labels, IDs, roles, and headlines
  const hierarchy = buildDisclosureHierarchy(allPresentationLinkbases, labelMap, locatorRoleMap);

  // Output the result
  //console.log('hierarchy:', JSON.stringify(hierarchy, null, 2));
  console.log('printHierarchyTree:');
  printHierarchyTree(hierarchy, { maxLevel: 4 });
}

main();
