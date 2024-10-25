import { Xml2JSNode, StringMap } from '../types/global';
import { getElementLabel, getRoleLabel, getDocumentation, getElementAttributes } from './labels';
import { applyToAll, asArray } from './utils';

export interface EsrsHierarchyNode {
  id: string;
  label: string;
  originalLabel?: string;
  documentation?: string;
  order?: string;
  name?: string;
  labelType?: string;
  type?: string;
  substitutionGroup?: string;
  abstract?: string;
  nillable?: string;
  'xbrli:periodType'?: string;
  dimension?: EsrsHierarchyNode;
  children?: EsrsHierarchyNode[];
}

export interface EsrsHierarchyRootNode extends EsrsHierarchyNode {
  sectionCode?: string | null;
  labels?: string[];
  roles?: string[];
  sourceFile?: string;
}

export interface EsrsHierarchyNodeMap {
  [key: string]: EsrsHierarchyNode;
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
  options: { getAllNodes?: boolean; dimensionsLookupMap?: EsrsHierarchyNodeMap } = { getAllNodes: false }
): EsrsHierarchyRootNode | EsrsHierarchyNodeMap | null => {
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
  const nodeMap: EsrsHierarchyNodeMap = {};
  const allNodes: EsrsHierarchyNodeMap = {};
  const childrenIds: string[] = [];

  const getLabelParts = (originalLabel: string) => {
    const labelMatches = originalLabel?.match(/^\[?(\d+)?\]?\s*(.*?)\s*(?:\[(.+)\])?$/); // "[topicNumber, optional] label [labelType, optional]"
    const [topicNumber, label, labelType] = labelMatches
      ? [labelMatches[1] || undefined, labelMatches[2], labelMatches[3] || undefined]
      : [undefined, originalLabel, undefined];
    if (label === '') return { topicNumber: undefined, label: topicNumber ?? '(no label)', labelType }; // hack
    return { topicNumber, label, labelType };
  };

  const getNodeProps = (elementId: string, order?: string) => {
    const { id, ...otherAttributes } = getElementAttributes(elementId, esrsCoreXml) ?? {};
    const originalLabel = getElementLabel(elementId, esrsCoreXml);
    const { label, labelType } = getLabelParts(originalLabel);
    const nodeProps = {
      label,
      labelType,
      originalLabel,
      ...(getDocumentation(elementId, esrsCoreXml) !== undefined && {
        documentation: getDocumentation(elementId, esrsCoreXml)
      }),
      id: elementId, // Get the fragment as a simple label
      ...otherAttributes,
      ...(order !== undefined && {
        order
      }),
      ...(options.dimensionsLookupMap?.[elementId] !== undefined && {
        dimension: options.dimensionsLookupMap?.[elementId]
      }),
      children: []
    };
    return nodeProps;
  };

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
      nodeMap[parentId] = getNodeProps(parentId);
    }

    // Initialize child node if it doesn't exist
    if (!nodeMap[childId]) {
      nodeMap[childId] = getNodeProps(childId, arc.$?.['order']);
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
  const roles = roleRefs.map((roleRef) => roleRef.$['xlink:href'].split('#').pop() as string);
  const labels = roles.map((roleId) => getRoleLabel(roleId, esrsCoreXml)).filter((label) => label !== null);
  const originalLabel = labels?.[0] ?? '(not found)';
  const { topicNumber, label } = getLabelParts(originalLabel);
  // Find sectionCode between brackets and the first period/hyphen/space: “[301060] E1-6 Gross Scopes” -> “E1”
  const match = originalLabel.match(/\[.*?\]\s([A-Z0-9]+)[.\-\s]/);
  const sectionCode = match ? match[1]?.replace('ESRS', '') : null;
  const rootNodeKey = Object.keys(nodeMap).find((key) => !childrenIds.includes(key));
  const rootNode = rootNodeKey ? nodeMap[rootNodeKey] : undefined;
  const children = rootNode ? [rootNode] : [];
  const root: EsrsHierarchyRootNode = {
    id: topicNumber as string,
    sectionCode,
    label,
    labels,
    // labelType,
    originalLabel,
    roles,
    sourceFile,
    // $: linkbaseRef.$,
    // roleRef: linkbaseRef['link:linkbase']['link:roleRef'],
    children
  };

  return options.getAllNodes ? allNodes : root;
};
