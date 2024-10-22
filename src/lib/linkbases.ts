import { Xml2JSNode, AnyMap, StringMap } from '../types/global';
import { getElementLabel, getRoleLabel, getDocumentation, getElementAttributes } from './labels';
import { applyToAll, asArray } from './utils';

interface HierarchyNode {
  id: string;
  label: string;
  documentation?: string;
  order?: string;
  type?: string;
  dimension?: HierarchyNode;
  children?: HierarchyNode[];
}

export interface HierarchyNodeMap {
  [key: string]: HierarchyNode;
}

interface HierarchyRootNode extends Partial<Xml2JSNode> {
  $?: AnyMap;
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
  esrsCoreXml: Xml2JSNode,
  options: { getAllNodes?: boolean; dimensionsLookupMap?: HierarchyNodeMap } = { getAllNodes: false }
): HierarchyRootNode | HierarchyNodeMap | null => {
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
  const locatorMap: StringMap = {};
  locators.forEach((loc: Xml2JSNode) => {
    const label = loc.$?.['xlink:label']; // e.g., loc_1
    const href = loc.$?.['xlink:href']; // e.g., ../../esrs_cor.xsd#esrs_GeneralBasisForPreparationOfSustainabilityStatementAbstract
    locatorMap[label] = href;
  });

  // Create a map to store nodes by ID
  const nodeMap: HierarchyNodeMap = {};
  const allNodes: HierarchyNodeMap = {};
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
      const { id, ...otherAttributes } = getElementAttributes(parentId, esrsCoreXml) ?? {};
      nodeMap[parentId] = {
        label: getElementLabel(parentId, esrsCoreXml),
        ...(getDocumentation(parentId, esrsCoreXml) !== undefined && {
          documentation: getDocumentation(parentId, esrsCoreXml)
        }),
        id: parentId, // Get the fragment as a simple label
        ...otherAttributes,
        ...(options.dimensionsLookupMap?.[parentId] !== undefined && {
          dimension: options.dimensionsLookupMap?.[parentId]
        }),
        children: []
      };
    }

    // Initialize child node if it doesn't exist
    if (!nodeMap[childId]) {
      const { id, ...otherAttributes } = getElementAttributes(childId, esrsCoreXml) ?? {};
      nodeMap[childId] = {
        label: getElementLabel(childId, esrsCoreXml),
        ...(getDocumentation(childId, esrsCoreXml) !== undefined && {
          documentation: getDocumentation(childId, esrsCoreXml)
        }),
        id: childId, // Get the fragment as a simple label
        ...otherAttributes,
        order: arc.$?.['order'],
        ...(options.dimensionsLookupMap?.[childId] !== undefined && {
          dimension: options.dimensionsLookupMap?.[childId]
        }),
        children: []
      };
    }

    // Append the child node to the parent's children array
    nodeMap[parentId].children?.push(nodeMap[childId]);
    childrenIds.push(childId);
    // Store all nodes in a separate map
    allNodes[childId] = nodeMap[childId];
    allNodes[parentId] = nodeMap[parentId];
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
  const labels = applyToAll(roles, (roleId) => getRoleLabel(roleId, esrsCoreXml));
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

  return options.getAllNodes ? allNodes : root;
};
