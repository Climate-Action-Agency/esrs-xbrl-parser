import { parseAndFollowReferences, printObjectTree } from './lib/parsing';

async function main() {
  // Parse the main XBRL file (adjust the path to your file)
  const startFile = 'common/esrs_cor.xsd'; // "esrs_all.xsd";
  console.log('startFile:', startFile);
  const esrsAll = await parseAndFollowReferences(
    `./ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/${startFile}`
  );
  console.log(`\n${startFile}:`);
  printObjectTree(esrsAll, 10);
}

main();
