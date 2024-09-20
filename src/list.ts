import { parseAndFollowReferences } from './lib/parsing';
import { printXMLTree } from './lib/output';

async function main() {
  const rootPath = './ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/';
  const startFile = process.argv?.[2] ?? 'common/esrs_cor.xsd'; // "esrs_all.xsd";
  const filePath = rootPath + startFile;
  console.log('Parsing:', filePath);
  const taxonomy = await parseAndFollowReferences(filePath);
  const searchFilter = {
    // maxLevel: 10,
    ...(process.argv?.[3] !== undefined ? { level: 3, text: process.argv?.[3] } : {})
  };
  console.log(`\n${startFile} (filter ${JSON.stringify(searchFilter)}):`);
  printXMLTree(taxonomy, searchFilter);
}

main();
