import { TreeSearchFilter } from './types/global';
import { parseAndFollowLinks } from './lib/parsing';
import { printXMLTree } from './lib/output';

async function main() {
  const filePath = process.argv?.[2];
  const searchText = process.argv?.[3];
  const searchFilter: TreeSearchFilter = {
    // maxLevel: 10,
    ...(searchText ? { searchLevel: 3, searchText } : {})
  };

  console.log(`${filePath} (filter ${JSON.stringify(searchFilter)}):\n`);

  // Build the tree starting from the root file
  const tree = await parseAndFollowLinks(filePath, '');

  // Output the result
  //console.log(JSON.stringify(tree, null, 2));
  printXMLTree(tree, searchFilter);
}

main();
