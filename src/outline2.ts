import path from 'path';

import { parseXML } from './lib/parsing';
import { printXMLTree } from './lib/output';

// Helper to fetch and parse XML, handling links with fragments (e.g., #role-200510)
export const parseAndFollowLinks = async (
  filePath: string,
  parentDir: string,
  visited = new Set(),
  fragment: string | null = null
): Promise<any> => {
  console.warn(`Parsing: '${filePath}' in '${parentDir.split('/').slice(-4).join('/')}'`);
  const currentFilePath = path
    .resolve(parentDir, filePath)
    // Desperate hack to fix broken link
    .replace('taxonomy/common/esrs_cor.xsd', 'taxonomy/esrs/2023-12-22/common/esrs_cor.xsd');
  const currentFolderPath = path.dirname(currentFilePath);

  // Track visited files to avoid circular references
  if (visited.has(currentFilePath)) {
    //console.warn(`  - Already visited ${filePath} - skipping`);
    return null;
  }
  visited.add(currentFilePath);

  // Parse the main file
  const xmlData = await parseXML(currentFilePath);

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
            const childTree = await parseAndFollowLinks(href, currentFolderPath, visited, childFragment);

            // Add to the child tree
            if (childTree) {
              const rootKey = Object.keys(childTree)[0];
              if (childNode[rootKey] !== undefined) {
                childNode[rootKey] = childTree[rootKey];
              } else {
                // Merge into an array if there are multiple children
                if (!Array.isArray(childNode[rootKey])) {
                  childNode[rootKey] = [childNode[rootKey]];
                }
                childNode[rootKey].push(childTree);
              }
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

// Main function to start parsing from the root file
async function main() {
  const rootDir = './ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/';
  const startFile = 'esrs_all.xsd';

  // Build the tree starting from the root file
  const tree = await parseAndFollowLinks(startFile, rootDir);

  // Output the result
  //console.log(JSON.stringify(tree, null, 2));
  printXMLTree(tree, { maxLevel: 20 });
}

main();
