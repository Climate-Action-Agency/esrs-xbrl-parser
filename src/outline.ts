import path from 'path';

import { StringMap, Xml2JSNode } from './types/global';
import { parseAndFollowLinks } from './lib/parsing';
import { printXMLTree, printJSON } from './lib/output';
import {
  getLabelFromLabFile,
  buildLabelMap,
  buildRoleLabelMap,
  buildCoreRoleLabelMap,
  getRoleLabel
} from './lib/labels';
import { applyToAll, asArray } from './lib/utils';

interface HierarchyNode {
  id: string;
  label: string;
  order?: string;
  children: HierarchyNode[];
}

interface HierarchyRootNode extends HierarchyNode, Partial<Xml2JSNode> {
  $?: { [key: string]: any };
  headline: string;
  labels?: string[] | string;
  roleRef?: Xml2JSNode;
}

export const buildPresentationHierarchy = (
  linkbaseRef: Xml2JSNode,
  esrsCoreXml: Xml2JSNode,
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
    const childId = childHref.split('#')[1];

    // Initialize parent node if it doesn't exist
    if (!nodeMap[parentHref]) {
      nodeMap[parentHref] = {
        id: childId, // Get the fragment as a simple label
        label: getLabelFromLabFile(childId, esrsCoreXml),
        children: []
      };
    }

    // Initialize child node if it doesn't exist
    if (!nodeMap[childHref]) {
      nodeMap[childHref] = {
        id: childId, // Get the fragment as a simple label
        label: getLabelFromLabFile(childId, esrsCoreXml),
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
      const roles = applyToAll(roleRefs, (roleRef) => roleRef.$['xlink:href'].split('#').pop());
      const labels = applyToAll(roleRefs, (roleRef) => getRoleLabel(roleRef.$['xlink:href'], coreRoleLabelMap));
      root = {
        headline: asArray(labels)[0],
        roles,
        labels: labels,
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

async function main() {
  const PRESENTATION_SEARCH_KEY = 'pre_esrs_';
  const filePath = process.argv?.[2] ?? 'ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/esrs_all.xsd';
  const rootPath = path.dirname(filePath);
  const searchFilter = {
    // maxLevel: 10,
    onlyFollowBranches: [PRESENTATION_SEARCH_KEY],
    ...(process.argv?.[3] !== undefined ? { level: 3, text: process.argv?.[3] } : {})
  };

  // Parse the core file
  const coreFilePath = 'common/esrs_cor.xsd';
  const esrsCoreXml = await parseAndFollowLinks(coreFilePath, rootPath);

  // // printXMLTree(esrsCoreXml, {
  // //   // searchLevel: 8,
  // //   // searchText:
  // //   //   'esrs_ExplanationOfHowPolicyIsMadeAvailableToPotentiallyAffectedStakeholdersAndOrStakeholdersWhoNeedToHelpImplementItExplanatory_label'
  // // });
  // return;

  // Parse the label files
  const labelFilePath = 'common/labels/lab_esrs-en.xml';
  const labelMap = await buildLabelMap(path.join(rootPath, labelFilePath));
  const roleLabelFilePath = 'common/labels/gla_esrs-en.xml';
  const roleLabelMap = await buildRoleLabelMap(path.join(rootPath, roleLabelFilePath));
  const coreRoleLabelMap = await buildCoreRoleLabelMap(path.join(rootPath, coreFilePath));

  console.log(`${filePath} (filter ${JSON.stringify(searchFilter)}):\n`);

  // Build the tree starting from the root file
  const esrsAllXml = await parseAndFollowLinks(filePath, '', searchFilter);

  const linkbaseRefs =
    esrsAllXml?.['xsd:schema']?.['xsd:annotation']?.['xsd:appinfo']?.['link:linkbaseRef']?.filter(
      (linkbaseRef: Xml2JSNode) => linkbaseRef.$?.['xlink:href'].includes(PRESENTATION_SEARCH_KEY)
    ) ?? [];

  const hierarchy = linkbaseRefs.map((linkbaseRef: Xml2JSNode) =>
    buildPresentationHierarchy(linkbaseRef, esrsCoreXml, coreRoleLabelMap)
  );
  printXMLTree(hierarchy);
  return;

  const presentations = linkbaseRefs.map((linkbaseRef: Xml2JSNode) => {
    const sourceLinkbaseName = linkbaseRef.$?.['xlink:href'].split('linkbases/').pop();
    const roleRefs = linkbaseRef['link:linkbase']['link:roleRef'];
    const roleNames = applyToAll<Xml2JSNode, string>(roleRefs, (roleRef: Xml2JSNode) =>
      getRoleLabel(roleRef.$['xlink:href'], roleLabelMap, true)
    );
    const presentationLink = linkbaseRef['link:linkbase']['link:presentationLink'];
    const sectionHeadlineRoleId = presentationLink.$['xlink:role'].split('taxonomy/')[1];
    const sectionHeadline = getRoleLabel(sectionHeadlineRoleId, roleLabelMap);
    const linkLocs = presentationLink['link:loc'];
    const descriptions = linkLocs.map((linkLoc: Xml2JSNode) => labelMap[linkLoc.$['xlink:label']]);
    const descriptionsPreview = [...descriptions.slice(0, 3), `(etc, total ${descriptions.length})`];
    return {
      sectionHeadline,
      roleNames,
      sourceLinkbaseName,
      descriptions
      //descriptionsPreview
    };
  });

  // Output the result
  printXMLTree(presentations);
  //console.log(JSON.stringify(esrsAllXml, null, 2));
}

main();
