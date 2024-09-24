import { link } from 'fs';
import { StringMap, Xml2JSNode } from '../types/global';
import { parseXML } from './parsing';
import { applyToAll } from './utils';

/** Build a dictionary of labels. */
export const buildLabelMap = async (labelFilePath: string): Promise<StringMap> => {
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

export const buildRoleLabelMap = async (labelFilePath: string): Promise<StringMap> => {
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

export const buildCoreRoleLabelMap = async (labelFilePath: string): Promise<StringMap> => {
  // Parse the XML file
  const labelFile = await parseXML(labelFilePath);

  // Create a map to store the role and its label
  const roleLabelMap: { [key: string]: string } = {};

  // Find all <link:roleType> elements
  const roleTypes = labelFile['xsd:schema']?.['xsd:annotation']?.['xsd:appinfo']?.['link:roleType'];

  if (Array.isArray(roleTypes)) {
    roleTypes.forEach((roleType: any) => {
      const roleId = roleType['$'].id; // Get the role ID, e.g., role-200511
      const definition = roleType['link:definition']; // Get the definition text, e.g., "[200511] ..."

      // Store in the map
      roleLabelMap[roleId] = definition;
    });
  } else {
    console.warn('No role types found in the provided XML file.');
  }

  return roleLabelMap;
};

export const getRoleLabel = (
  xlinkHref: string,
  roleLabelMap: { [key: string]: string },
  includeLabelKey = false
): string => {
  const labelKey = xlinkHref.includes('#') ? xlinkHref.split('#')[1] : xlinkHref;
  return (includeLabelKey ? `${labelKey}: ` : '') + (roleLabelMap[labelKey] ?? labelKey);
};

interface HierarchyNode {
  id: string;
  // label: string;
  order?: string;
  children: HierarchyNode[];
}

interface HierarchyRootNode extends HierarchyNode, Partial<Xml2JSNode> {
  $?: { [key: string]: any };
  roleRef?: Xml2JSNode;
  headlines?: string[] | string;
}

export const buildPresentationHierarchy = (
  linkbaseRef: Xml2JSNode,
  coreRoleLabelMap: StringMap
): HierarchyNode | null => {
  const presentationLink = linkbaseRef['link:linkbase']?.['link:presentationLink'];

  if (!presentationLink) {
    console.error('No presentation link found');
    return null;
  }

  const locators = presentationLink['link:loc'] || [];
  const arcs = presentationLink['link:presentationArc'] || [];

  // Create a map of locators (xlink:label to href)
  const locatorMap: { [key: string]: string } = {};
  locators.forEach((loc: Xml2JSNode) => {
    const label = loc['$']['xlink:label']; // e.g., loc_1
    const href = loc['$']['xlink:href']; // e.g., ../../esrs_cor.xsd#esrs_GeneralBasisForPreparationOfSustainabilityStatementAbstract
    locatorMap[label] = href;
  });

  // Create a map to store nodes by ID
  const nodeMap: { [key: string]: HierarchyNode } = {};

  // Create a hierarchy tree root
  let root: HierarchyRootNode | null = null;

  // Process each arc and build the parent-child relationships
  applyToAll(arcs, (arc: Xml2JSNode) => {
    const fromLabel = arc['$']['xlink:from'];
    const toLabel = arc['$']['xlink:to'];
    const order = arc['$']['order']; // Use this for ordering within the parent

    // Get the href values for both parent and child
    const parentHref = locatorMap[fromLabel];
    const childHref = locatorMap[toLabel];

    // Initialize parent node if it doesn't exist
    if (!nodeMap[parentHref]) {
      nodeMap[parentHref] = {
        id: parentHref.split('#')[1], // Get the fragment as a simple label
        children: []
      };
    }

    // Initialize child node if it doesn't exist
    if (!nodeMap[childHref]) {
      nodeMap[childHref] = {
        id: childHref.split('#')[1], // Get the fragment as a simple label
        children: []
      };
    }

    // Add order to the child node
    nodeMap[childHref].order = order;

    // Append the child node to the parent's children array
    nodeMap[parentHref].children.push(nodeMap[childHref]);

    // If this is the topmost arc (no parent node yet), set this node as root
    if (!root) {
      const sourceLinkbaseName = linkbaseRef.$?.['xlink:href'].split('linkbases/').pop();
      const roleRefs = linkbaseRef['link:linkbase']['link:roleRef'];
      root = {
        headlines: applyToAll(roleRefs, (roleRef) => getRoleLabel(roleRef.$['xlink:href'], coreRoleLabelMap)),
        sourceLinkbaseName,
        // $: linkbaseRef.$,
        // roleRef: linkbaseRef['link:linkbase']['link:roleRef'],
        ...nodeMap[parentHref]
      };
    }
  });

  // Sort the children of each node based on the "order" attribute
  Object.values(nodeMap).forEach((node) => {
    if (node.children) {
      node.children.sort((a, b) => parseFloat(a.order || '0') - parseFloat(b.order || '0'));
    }
  });

  return root;
};
