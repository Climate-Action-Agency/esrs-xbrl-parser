import { parseXML, buildDisclosureHierarchy } from './lib/parsing';

async function main() {
  // Parse the main XBRL file (adjust the path to your file)
  const presentationFile = process.argv?.[2] ?? '2023-12-22/all/linkbases/pre_esrs_301040.xml';
  console.log('Parsing:', presentationFile);
  const presentationFilePath = `./ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/${presentationFile}`;
  // Parse the presentation linkbase
  const presentationLinkbase = await parseXML(presentationFilePath);
  // console.log('Parsed XML:', JSON.stringify(presentationLinkbase, null, 2)); // Check the structure
  // Build the disclosure hierarchy
  const hierarchy = buildDisclosureHierarchy(presentationLinkbase);
  // Output the result
  console.log('buildDisclosureHierarchy:', JSON.stringify(hierarchy, null, 2));
}

main();
