import { parseAndFollowLinks } from './lib/parsing';
import { printXMLTree } from './lib/output';

async function main() {
  const filePath = process.argv?.[2];
  const searchFilter = {
    // maxLevel: 10,
    ...(process.argv?.[3] !== undefined ? { level: 3, text: process.argv?.[3] } : {})
  };

  console.log(`${filePath} (filter ${JSON.stringify(searchFilter)}):\n`);

  // Build the tree starting from the root file
  const tree = await parseAndFollowLinks(filePath, '');

  // Output the result
  //console.log(JSON.stringify(tree, null, 2));
  printXMLTree(tree, searchFilter);
}

main();
