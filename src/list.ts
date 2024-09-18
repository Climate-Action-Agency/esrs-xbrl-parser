import { parseAndFollowReferences, printObjectTree } from './lib/parsing';

async function main() {
  // Parse the main XBRL file (adjust the path to your file)
  const startFile = process.argv?.[2] ?? '2023-12-22/common/esrs_cor.xsd'; // "2023-12-22/esrs_all.xsd";
  console.log('Parsing:', startFile);
  const esrsAll = await parseAndFollowReferences(`./ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/${startFile}`);
  console.log(`\n${startFile}:`);
  printObjectTree(esrsAll, 10);
}

main();
