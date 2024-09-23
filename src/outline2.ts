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
  console.warn(`\nparseAndFollowLinks: '${filePath}' from '${parentDir}'`);

  if (visited.has(filePath)) {
    console.warn(`  - Already visited ${filePath}. Skipping to avoid circular references.`);
    return null;
  }
  visited.add(filePath);

  // Parse the main file
  const fileData = await parseXML(filePath);

  // If there's a fragment (like #role-200510), find the matching element by ID
  if (fragment) {
    const element = findElementById(fileData, fragment);
    if (!element) {
      console.warn(`  - Fragment ${fragment} not found in ${filePath}`);
      return null;
    }
    return element; // Return the matched element for the fragment
  }

  // Initialize the tree structure with the root node
  const tree = {
    filePath,
    schema: fileData,
    children: []
  };

  // Generic recursive function to find and follow any xlink:href in any tag
  const followXlinkHrefs = async (node: any, parentNode: any) => {
    if (typeof node === 'object' && node !== null) {
      for (const key in node) {
        const child = node[key];

        // Check if the current node contains an xlink:href attribute
        if (child?.['$']?.['xlink:href']) {
          let href = child['$']['xlink:href'];

          if (!href.startsWith('http')) {
            // Handle #fragment in the href
            let fragment: string | null = null;
            if (href.includes('#')) {
              [href, fragment] = href.split('#');
            }

            // Resolve relative path to absolute file path
            const fullPath = path.resolve(parentDir, href);
            const fullPathDir = path.dirname(fullPath);
            console.warn(`  - Following xlink:href '${href}' from '${parentDir}' ('${fullPath}') with #${fragment}`);
            // Recursively parse the referenced file
            const childTree = await parseAndFollowLinks(fullPath, fullPathDir, visited, fragment);

            // Add the child tree to the parentNode
            if (childTree) {
              parentNode.children.push(childTree);
            }
          }
        }

        // Recurse for nested objects or arrays
        if (typeof child === 'object') {
          await followXlinkHrefs(child, tree); // Recursively follow links in the child node
        }
      }
    }
  };

  // Recursively follow xlink:href in the parsed XML data
  await followXlinkHrefs(fileData, tree);

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
  const rootFile = 'esrs_all.xsd';

  // Build the tree starting from the root file
  const tree = await parseAndFollowLinks(path.join(rootDir, rootFile), rootDir);

  // Output the result
  console.log(JSON.stringify(tree, null, 2));
  //printXMLTree(tree, { maxLevel: 20 });
}

main();
