import { Xml2JSNode } from '../types/global';
import { getLabelFromLabFile, getRoleLabelFromCoreFile, getAttributesFromCoreFile } from './labels';
import { applyToAll, asArray } from './utils';

interface HierarchyNode {
  id: string;
  label: string;
  order?: string;
  type?: string;
  children?: HierarchyNode[];
}

interface HierarchyRootNode extends Partial<Xml2JSNode> {
  $?: { [key: string]: any };
  sectionCode?: string | null;
  label: string;
  labels?: string[] | string;
  roleRef?: Xml2JSNode;
  children?: HierarchyNode[];
}

export enum LinkbaseType {
  Presentation = 'presentation',
  Definition = 'definition',
  Calculation = 'calculation',
  Label = 'label',
  Reference = 'reference'
}

export const buildHierarchyFromLinkbase = (
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
  const childrenIds: string[] = [];

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
      const { id, ...otherAttributes } = getAttributesFromCoreFile(parentId, esrsCoreXml) ?? {};
      nodeMap[parentId] = {
        label: getLabelFromLabFile(parentId, esrsCoreXml),
        id: parentId, // Get the fragment as a simple label
        ...otherAttributes,
        children: []
      };
    }

    // Initialize child node if it doesn't exist
    if (!nodeMap[childId]) {
      const { id, ...otherAttributes } = getAttributesFromCoreFile(childId, esrsCoreXml) ?? {};
      nodeMap[childId] = {
        label: getLabelFromLabFile(childId, esrsCoreXml),
        id: childId, // Get the fragment as a simple label
        ...otherAttributes,
        order: arc.$?.['order'],
        children: []
      };
    }

    // Append the child node to the parent's children array
    nodeMap[parentId].children?.push(nodeMap[childId]);
    childrenIds.push(childId);
  });

  // Sort the children of each node based on the "order" attribute
  Object.values(nodeMap).forEach((node) => {
    if (node.children) {
      node.children.sort((a, b) => parseFloat(a.order || '0') - parseFloat(b.order || '0'));
    }
  });

  // Create a root object
  const sourceFile = linkbaseRef.$?.['xlink:href'].split('linkbases/').pop();
  const roleRefs = asArray(linkbaseRef['link:linkbase']['link:roleRef']);
  const roles = applyToAll(roleRefs, (roleRef) => roleRef.$['xlink:href'].split('#').pop());
  const labels = applyToAll(roles, (roleId) => getRoleLabelFromCoreFile(roleId, esrsCoreXml));
  const label = asArray(labels).find((label) => label !== undefined) || '(not found)';
  // Find sectionCode between brackets and the first period/hyphen/space: “[301060] E1-6 Gross Scopes” -> “E1”
  const match = label.match(/\[.*?\]\s([A-Z0-9]+)[.\-\s]/);
  const sectionCode = match ? match[1] : null;
  const rootNodeKey = Object.keys(nodeMap).find((key) => !childrenIds.includes(key));
  const rootNode = rootNodeKey ? nodeMap[rootNodeKey] : undefined;
  const children = rootNode ? [rootNode] : [];
  const root: HierarchyRootNode = {
    sectionCode,
    label,
    labels,
    roles,
    sourceFile,
    // $: linkbaseRef.$,
    // roleRef: linkbaseRef['link:linkbase']['link:roleRef'],
    children
  };

  return root;
};
