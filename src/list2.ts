import { parseAndFollowLinks } from './lib/parsing';
import { printXMLTree } from './lib/output';

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
