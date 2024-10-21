import path from 'path';

import { StringMap, Xml2JSNode, TreeSearchFilter } from './types/global';
import { parseAndFollowLinks } from './lib/parsing';
import { printXMLTree, printJSON } from './lib/output';
import {
  getLabelFromLabFile,
  getRoleLabelFromCoreFile,
  getAttributesFromCoreFile
  // buildLabelMap,
  // buildRoleLabelMap,
  // getRoleLabel
} from './lib/labels';
import { applyToAll, asArray } from './lib/utils';

interface HierarchyNode {
  id: string;
  label: string;
  order?: string;
  type?: string;
  children: HierarchyNode[];
}

interface HierarchyRootNode extends Partial<Xml2JSNode> {
  $?: { [key: string]: any };
  label: string;
  labels?: string[] | string;
  roleRef?: Xml2JSNode;
  children: HierarchyNode[];
}

enum LinkbaseType {
  Presentation = 'presentation',
  Definition = 'definition',
  Calculation = 'calculation',
  Label = 'label',
  Reference = 'reference'
}

export const buildHierarchy = (
  linkType = LinkbaseType.Presentation,
  linkbaseRef: Xml2JSNode,
  esrsCoreXml: Xml2JSNode
): HierarchyRootNode | null => {
  const xLink = asArray(linkbaseRef['link:linkbase']?.[`link:${linkType}Link`])[0];

  if (!xLink) {
    console.error(`No ${linkType} link found`);
    return null;
  }

  const locKey = `link:loc`;
  const locators = xLink[locKey] ? asArray(xLink[locKey]) : [];
  if (!locators.length) {
    console.warn(`No ${locKey} found in '${linkbaseRef.$?.['xlink:href']}'`, xLink);
  }

  const arcKey = `link:${linkType}Arc`;
  const arcs = xLink[arcKey] ? asArray(xLink[arcKey]) : [];
  if (!arcs.length) {
    console.warn(`No ${arcKey} found in '${linkbaseRef.$?.['xlink:href']}'`, xLink);
  }

  // Create a map of locators (xlink:label to href)
  const locatorMap: { [key: string]: string } = {};
  locators.forEach((loc: Xml2JSNode) => {
    const label = loc.$?.['xlink:label']; // e.g., loc_1
    const href = loc.$?.['xlink:href']; // e.g., ../../esrs_cor.xsd#esrs_GeneralBasisForPreparationOfSustainabilityStatementAbstract
    locatorMap[label] = href;
  });

  // Create a map to store nodes by ID
  const nodeMap: { [key: string]: HierarchyNode } = {};

  // Process each arc and build the parent-child relationships
  applyToAll(arcs, (arc: Xml2JSNode) => {
    const fromLabel = arc.$?.['xlink:from'];
    const toLabel = arc.$?.['xlink:to'];

    // Get the href values for both parent and child
    const parentHref = locatorMap[fromLabel];
    const parentId = parentHref.split('#')[1];
    const childHref = locatorMap[toLabel];
    const childId = childHref.split('#')[1];

    // Initialize parent node if it doesn't exist
    if (!nodeMap[parentId]) {
      const attributes = getAttributesFromCoreFile(parentId, esrsCoreXml);
      nodeMap[parentId] = {
        label: getLabelFromLabFile(parentId, esrsCoreXml),
        id: parentId, // Get the fragment as a simple label
        type: attributes?.type,
        children: []
      };
    }

    // Initialize child node if it doesn't exist
    if (!nodeMap[childId]) {
      const attributes = getAttributesFromCoreFile(childId, esrsCoreXml);
      nodeMap[childId] = {
        label: getLabelFromLabFile(childId, esrsCoreXml),
        id: childId, // Get the fragment as a simple label
        type: attributes?.type,
        order: arc.$?.['order'],
        children: []
      };
    }

    // Append the child node to the parent's children array
    nodeMap[parentId].children.push(nodeMap[childId]);
  });

  //console.log('nodeMap:', JSON.stringify(nodeMap, null, 2));

  // Create a root object
  const sourceFile = linkbaseRef.$?.['xlink:href'].split('linkbases/').pop();
  const roleRefs = asArray(linkbaseRef['link:linkbase']['link:roleRef']);
  const roles = applyToAll(roleRefs, (roleRef) => roleRef.$['xlink:href'].split('#').pop());
  const labels = applyToAll(roles, (roleId) => getRoleLabelFromCoreFile(roleId, esrsCoreXml));
  const label = asArray(labels)[0];
  const root: HierarchyRootNode = {
    label,
    labels,
    roles,
    sourceFile,
    // $: linkbaseRef.$,
    // roleRef: linkbaseRef['link:linkbase']['link:roleRef'],
    children: Object.values(nodeMap)
  };

  // Sort the children of each node based on the "order" attribute
  Object.values(nodeMap).forEach((node) => {
    if (node.children) {
      node.children.sort((a, b) => parseFloat(a.order || '0') - parseFloat(b.order || '0'));
    }
  });

  return root;
};

async function main() {
  const filePath = process.argv?.[2] ?? 'ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/esrs_all.xsd';
  const rootPath = path.dirname(filePath);

  // Parse the core file
  const coreFilePath = 'common/esrs_cor.xsd';
  const esrsCoreXml = await parseAndFollowLinks(coreFilePath, rootPath);

  // printXMLTree(esrsCoreXml, {
  //   searchLevel: 8,
  //   searchText: 'link:roleType'
  // });
  // return;

  // Build the tree starting from the root file
  const LINKBASE_PRESENTATIONS = 'pre_esrs_';
  const LINKBASE_DEFINITIONS = 'def_esrs_';
  const LINKBASES_TO_INCLUDE = [LINKBASE_PRESENTATIONS, LINKBASE_DEFINITIONS];
  const searchText = process.argv?.[3];
  const searchFilter: TreeSearchFilter = {
    // maxLevel: 10,
    onlyFollowBranches: LINKBASES_TO_INCLUDE,
    ...(searchText ? { searchLevel: 3, searchText } : {})
  };
  console.log(`${filePath} (filter ${JSON.stringify(searchFilter)}):\n`);
  const esrsAllXml = await parseAndFollowLinks(filePath, '', searchFilter);
  const linkbaseRefs = esrsAllXml?.['xsd:schema']?.['xsd:annotation']?.['xsd:appinfo']?.['link:linkbaseRef'];

  // Presentations
  const presentationLinkbaseRefs =
    linkbaseRefs?.filter((linkbaseRef: Xml2JSNode) => linkbaseRef.$?.['xlink:href'].includes(LINKBASE_PRESENTATIONS)) ??
    [];
  const presentations = presentationLinkbaseRefs.map((linkbaseRef: Xml2JSNode) =>
    buildHierarchy(LinkbaseType.Presentation, linkbaseRef, esrsCoreXml)
  );
  // Definitions
  const definitionLinkbaseRefs =
    linkbaseRefs?.filter((linkbaseRef: Xml2JSNode) => linkbaseRef.$?.['xlink:href'].includes(LINKBASE_DEFINITIONS)) ??
    [];
  const dimensions = definitionLinkbaseRefs.map((linkbaseRef: Xml2JSNode) =>
    buildHierarchy(LinkbaseType.Definition, linkbaseRef, esrsCoreXml)
  );
  printXMLTree({ presentations, dimensions }, { skipBranches: ['order'] });
  return;

  /*
  // Parse the label files
  const labelFilePath = 'common/labels/lab_esrs-en.xml';
  const roleLabelFilePath = 'common/labels/gla_esrs-en.xml';
  const labelMap = await buildLabelMap(path.join(rootPath, labelFilePath));
  const roleLabelMap = await buildRoleLabelMap(path.join(rootPath, roleLabelFilePath));

  // Create a list of presentations
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
  */
}

main();
