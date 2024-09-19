import { parseAndFollowReferences } from './lib/parsing';
import { printXMLTree } from './lib/output';

async function main() {
  // Parse the main XBRL file (adjust the path to your file)
  const startFile = process.argv?.[2] ?? '2023-12-22/common/esrs_cor.xsd'; // "2023-12-22/esrs_all.xsd";
  console.log('Parsing:', startFile);
  const filePath = `./ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/${startFile}`;
  const taxonomy = await parseAndFollowReferences(filePath);
  const searchFilter = {
    // maxLevel: 10,
    ...(process.argv?.[3] !== undefined ? { level: 3, text: process.argv?.[3] } : {})
  };
  console.log(`\n${startFile} (filter ${JSON.stringify(searchFilter)}):`);
  printXMLTree(taxonomy, searchFilter);
}

main();
