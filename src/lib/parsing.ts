import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import fetch from 'node-fetch';

import { ParsedXBRLFile, TreeSearchFilter } from '../types/global';

export const ATTRIBUTES_KEY = '$';

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

// Helper to fetch and parse XML, handling links with fragments (e.g., #role-200510)
export const parseAndFollowLinks = async (
  filePath: string,
  parentDir: string,
  searchFilter?: TreeSearchFilter,
  visited = new Set(),
  fragment: string | null = null
): Promise<any> => {
  const isNotTheCoreFile = !filePath.includes('esrs_cor.xsd');
  if (isNotTheCoreFile) console.warn(`Parsing: '${filePath}' in '${parentDir.split('/').slice(-4).join('/')}'`);
  const currentFilePath = path
    .resolve(parentDir, filePath)
    // Desperate hacks to fix broken link to ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/common/esrs_cor.xsd
    .replace('taxonomy/esrs/common/esrs_cor.xsd', 'taxonomy/esrs/2023-12-22/common/esrs_cor.xsd')
    .replace('taxonomy/common/esrs_cor.xsd', 'taxonomy/esrs/2023-12-22/common/esrs_cor.xsd')
    .replace('2023-12-22/esrs_cor.xsd', '2023-12-22/common/esrs_cor.xsd');
  const currentFolderPath = path.dirname(currentFilePath);

  // Track visited files to avoid circular references
  if (visited.has(currentFilePath)) {
    //console.warn(`  - Already visited ${filePath} - skipping`);
    return null;
  }
  visited.add(currentFilePath);

  // Parse the main file
  let xmlData;
  try {
    xmlData = await parseXML(currentFilePath);
  } catch (error) {
    throw new Error(
      `Failed to parse XML file: ${currentFilePath} ('${filePath}' in '${parentDir.split('/').slice(-4).join('/')}')`
    );
  }

  // If there's a fragment (like #role-200510), find the matching element by ID
  if (fragment) {
    const element = findElementById(xmlData, fragment);
    if (!element) {
      //console.warn(`  - Fragment ${fragment} not found in ${filePath}`);
      return null;
    }
    return element; // Return the matched element for the fragment
  }

  // Initialize the tree structure with the root node
  const tree = {
    ...xmlData
  };

  // Generic recursive function to find and follow any xlink:href in any tag
  const followXlinkHrefs = async (currentNode: any) => {
    if (typeof currentNode === 'object' && currentNode !== null) {
      for (const key in currentNode) {
        const childNode = currentNode[key];

        // Check if the childNode contains an xlink:href attribute
        if (childNode?.['$']?.['xlink:href']) {
          let href = childNode['$']['xlink:href'];

          if (!href.startsWith('http')) {
            // Handle #fragment in the href
            let childFragment: string | null = null;
            if (href.includes('#')) {
              [href, childFragment] = href.split('#');
            }

            // console.warn(`  - Following xlink:href '${href}' from '${currentFolderPath}'`); // with #${childFragment}
            // Recursively parse the referenced file
            const doFollowBranch =
              !searchFilter?.onlyFollowBranches ||
              searchFilter.onlyFollowBranches.some((fileName) => href.includes(fileName));
            const childTree = doFollowBranch
              ? await parseAndFollowLinks(href, currentFolderPath, searchFilter, visited, childFragment)
              : null;

            // Add to the child tree
            if (childTree) {
              const rootKey = Object.keys(childTree)[0]; // Never (?) more than one key
              if (childNode[rootKey] !== undefined) {
                // There‘s already a value in the root key
                if (!Array.isArray(childNode[rootKey])) {
                  // Create array with the existing value
                  childNode[rootKey] = [childTree[rootKey]];
                }
              } else {
                // Create empty array
                childNode[rootKey] = [];
              }
              childNode[rootKey].push(childTree);
            }
          }
        }

        // Recurse for nested objects or arrays
        if (typeof childNode === 'object') {
          await followXlinkHrefs(childNode); // Recursively follow links in the child node
        }
      }
    }
  };

  // Recursively follow xlink:href in the parsed XML data
  await followXlinkHrefs(xmlData);

  return tree;
};

// Helper to find an element by its ID in the XML structure
const findElementById = (xmlData: any, fragment: string): any => {
  const findInObject = (obj: any): any => {
    if (typeof obj === 'object' && obj !== null) {
      if (obj['$']?.['id'] === fragment) {
        return obj;
      }
      for (const key in obj) {
        const found = findInObject(obj[key]);
        if (found) return found;
      }
    }
    return null;
  };
  return findInObject(xmlData);
};
