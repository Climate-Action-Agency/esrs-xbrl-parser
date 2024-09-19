import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import fetch from 'node-fetch';

import { ParsedXBRLFile } from '../types/global';
const ATTRIBUTES_KEY = '$';

// Helper to parse XML using promises from a local file
export const parseXML = async (filePath: string): Promise<any> => {
  try {
    const data = await fs.promises.readFile(filePath);
    const result = await xml2js.parseStringPromise(data, { explicitArray: false });
    return result;
  } catch (err) {
    throw err;
  }
};

// Helper to fetch XML from an external URL
const fetchExternalResource = async (url: string): Promise<any> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${url}`);
    }
    const data = await response.text();
    const result = await xml2js.parseStringPromise(data, { explicitArray: false });
    return result;
  } catch (error) {
    console.error(`Error fetching external resource: ${url}`, error);
    throw error;
  }
};

// Function to determine if a given schemaLocation is a URL or local file
const isExternalURL = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

// Recursive function to parse XML, follow schemaLocation and xlink:href
export const parseAndFollowReferences = async (filePath: string): Promise<ParsedXBRLFile> => {
  let result: any;

  // Parse the main file or fetch the external resource
  if (isExternalURL(filePath)) {
    console.log(`🌐 Parsing external file: ${filePath}`);
    result = await fetchExternalResource(filePath);
  } else {
    console.log(`🗂️ Parsing local file: ${filePath}`);
    result = await parseXML(filePath);
  }

  // Initialize the parsed schema tree node
  const parsedSchema: ParsedXBRLFile = {
    filePath,
    schema: result,
    references: []
  };

  // Extract references to other schemas (e.g., xs:import, xs:include, and xlink:href)
  const imports = result['xsd:schema']?.['xsd:import'] || [];
  const includes = result['xsd:schema']?.['xsd:include'] || [];
  const xlinkHrefs = extractXlinkHrefs(result);

  // imports can be a single object or an array of objects
  const references = [...(imports.length === undefined ? [imports] : imports), ...includes, ...xlinkHrefs];

  for (const ref of references) {
    const schemaLocation = ref[ATTRIBUTES_KEY]?.schemaLocation || ref[ATTRIBUTES_KEY]?.['xlink:href'];
    if (schemaLocation) {
      // Determine if the reference is external or local
      let refPath = schemaLocation;
      if (!isExternalURL(refPath)) {
        refPath = path.join(path.dirname(filePath), schemaLocation);
      }

      // Recursively parse the referenced schema
      try {
        const refSchema = await parseAndFollowReferences(refPath);
        parsedSchema.references?.push(refSchema);
      } catch (error) {
        console.error(`Failed to parse referenced schema: ${refPath}`, error);
      }
    }
  }

  return parsedSchema;
};

// Helper function to extract xlink:href references from XML
const extractXlinkHrefs = (xml: any): any[] => {
  const xlinks: any[] = [];

  const traverse = (obj: any) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object') {
          traverse(obj[key]);
        } else if (key === 'xlink:href') {
          xlinks.push(obj);
        }
      }
    }
  };

  traverse(xml);
  return xlinks;
};

interface TreeSearchFilter {
  maxLevel?: number;
  level?: number;
  text?: string;
}

export function printObjectTree(obj: any, searchFilter: TreeSearchFilter, currentLevel: number = 0): void {
  const indent = '  '.repeat(currentLevel); // Indentation based on depth
  // Don't traverse below the maxLevel
  if (searchFilter?.maxLevel !== undefined && currentLevel >= searchFilter?.maxLevel) {
    return;
  }
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Don't traverse the attributes ($) object
      if (key !== ATTRIBUTES_KEY) {
        const hasChildren = typeof obj[key] === 'object' && obj[key] !== null;
        const attributesObject = hasChildren ? obj[key][ATTRIBUTES_KEY] : undefined;
        const idStr = attributesObject?.id !== undefined ? `id:'${attributesObject.id}'` : '';
        // const nameStr = attributesObject?.name !== undefined ? `name:'${attributesObject.name}'` : ''; // name is too similar to id, and id is more common
        const typeStr = attributesObject?.type !== undefined ? `type:'${attributesObject.type}'` : '';
        const attributesArray = [
          ...(idStr !== '' ? [idStr] : []),
          ...(typeStr !== '' ? [typeStr] : []),
          ...Object.keys(attributesObject ?? {}).filter((key) => !['id', 'type'].includes(key))
        ];
        const attributesStr = attributesObject !== undefined ? ` [${attributesArray.join(', ')}]` : '';
        const doShowFilterMatchAndParentNodes =
          searchFilter?.text === undefined ||
          (searchFilter?.text !== undefined &&
            (idStr.toLowerCase().includes(searchFilter.text.toLowerCase()) ||
              currentLevel < (searchFilter.level ?? 0)));
        if (doShowFilterMatchAndParentNodes) {
          console.log(`${indent} ∟ ${key}` + attributesStr);
        }
        // Recursively traverse the child object
        if (hasChildren) {
          printObjectTree(obj[key], searchFilter, currentLevel + 1);
        }
      }
    }
  }
}

// Step 1: Parse the label linkbase with arcs
export const buildLabelMapWithArcs = async (labelFilePath: string): Promise<{ [key: string]: string }> => {
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
// Update the hierarchy builder to include human-readable labels
export const buildDisclosureHierarchyWithLabels = (presentationLinkbase: any, labelMap: { [key: string]: string }) => {
  const disclosures: any = {};

  // Step 1: Gather locators (concepts)
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

  // Step 2: Build the hierarchy based on arcs (parent-child relationships)
  const arcs = presentationLinkbase['link:linkbase']?.['link:presentationLink']?.['link:presentationArc'];

  if (!arcs) {
    console.error("No 'link:presentationArc' elements found");
    return disclosures;
  }

  arcs.forEach((arc: any) => {
    const from = arc['$']['xlink:from'];
    const to = arc['$']['xlink:to'];

    const parentHref = locators[from]; // Get the parent's href
    const childHref = locators[to]; // Get the child's href

    const parentLabel = labelMap[from] || parentHref; // Use human-readable label if available
    const childLabel = labelMap[to] || childHref; // Use human-readable label if available

    if (parentHref && childHref) {
      // Initialize parent node if it doesn't exist
      if (!disclosures[parentLabel]) {
        disclosures[parentLabel] = { children: [] };
      }

      // Add the child to the parent
      if (!disclosures[childLabel]) {
        disclosures[childLabel] = { children: [] };
      }
      disclosures[parentLabel].children.push(disclosures[childLabel]);
    } else {
      console.warn(`Missing locator reference for parent (${from}) or child (${to})`);
    }
  });

  return disclosures;
};
