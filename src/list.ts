import { parseAndFollowReferences, printObjectTree } from './lib/parsing';

async function main() {
  // Parse the main XBRL file (adjust the path to your file)
  const startFile = process.argv?.[2] ?? '2023-12-22/common/esrs_cor.xsd'; // "2023-12-22/esrs_all.xsd";
  console.log('Parsing:', startFile);
  const taxonomy = await parseAndFollowReferences(
    `./ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/${startFile}`
  );
  const searchFilter = {
    // maxLevel: 10,
    ...(process.argv?.[3] !== undefined ? { level: 3, text: process.argv?.[3] } : {})
  };
  console.log(`\n${startFile} (filter ${JSON.stringify(searchFilter)}):`);
  printObjectTree(taxonomy, searchFilter);
}

main();