import fs from 'fs';
import xml2js from 'xml2js';
import path from 'path';

import { parseAndFollowReferences } from './lib/parsing';
import { printXMLTree, printHierarchyTree } from './lib/output';

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

// Recursive helper to drill into the XML and find all xlink:href attributes
export const parseAndFollowLinks = async (filePath: string, rootDir: string, visited = new Set()): Promise<any> => {
  if (visited.has(filePath)) {
    console.warn(`Already visited ${filePath}. Skipping to avoid circular references.`);
    return null;
  }
  visited.add(filePath);

  // Parse the main file
  const fileData = await parseXML(filePath);

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
          const href = child['$']['xlink:href'];

          if (!href.startsWith('http')) {
            // Resolve relative path to absolute file path
            const fullPath = path.resolve(rootDir, href);
            console.log(`Following xlink:href link: ${fullPath}`);

            // Recursively parse the referenced file
            const childTree = await parseAndFollowLinks(fullPath, rootDir, visited);

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
