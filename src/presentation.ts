import { parseXML, buildDisclosureHierarchy, buildLabelMap } from './lib/parsing';

async function main() {
  // Parse the main XBRL file (adjust the path to your file)
  const rootPath = './ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/';
  // Parse the presentation linkbase
  const presentationFile = process.argv?.[2] ?? '2023-12-22/all/linkbases/pre_esrs_301040.xml';
  const presentationLinkbase = await parseXML(rootPath + presentationFile);
  // console.log('Parsed XML:', JSON.stringify(presentationLinkbase, null, 2)); // Check the structure
  // Parse the label file and build the label map
  const labelFile = '2023-12-22/common/labels/lab_esrs-en.xml';
  const labelMapWithArcs = await buildLabelMap(rootPath + labelFile);
  // Build the disclosure hierarchy
  const hierarchy = buildDisclosureHierarchy(presentationLinkbase, labelMapWithArcs);
  // Output the result
  console.log('hierarchy:', JSON.stringify(hierarchy, null, 2));
}

main();
