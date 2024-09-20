import { parseAndFollowReferences } from './lib/parsing';
import { printXMLTree } from './lib/output';

async function main() {
  const filePath = process.argv?.[2];
  console.log('Parsing:', filePath);
  const taxonomy = await parseAndFollowReferences(filePath);
  const searchFilter = {
    // maxLevel: 10,
    ...(process.argv?.[3] !== undefined ? { level: 3, text: process.argv?.[3] } : {})
  };
  console.log(`\n${filePath} (filter ${JSON.stringify(searchFilter)}):`);
  printXMLTree(taxonomy, searchFilter);
}

main();
