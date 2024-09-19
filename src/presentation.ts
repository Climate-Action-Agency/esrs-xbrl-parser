import {
  parseXML,
  buildDisclosureHierarchy,
  buildLabelMap,
  extractRoleDefinitions,
  mapLocatorsToRoles
} from './lib/parsing';

async function main() {
  const rootPath = './ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/';
  const presentationFilePath = 'all/linkbases/pre_esrs_301040.xml';
  const labelFilePath = 'common/labels/lab_esrs-en.xml';
  const esrsCorFilePath = 'common/esrs_cor.xsd';

  // Parse the presentation linkbase
  const presentationLinkbase = await parseXML(rootPath + presentationFilePath);

  // Extract role definitions (ID/Code) from esrs_cor.xsd
  const roleMap = await extractRoleDefinitions(rootPath + esrsCorFilePath);

  // Map locators to role definitions
  const locatorRoleMap = await mapLocatorsToRoles(rootPath + labelFilePath, roleMap);

  // Parse the label file and build the label map using arcs
  const labelMap = await buildLabelMap(rootPath + labelFilePath);

  // Build the disclosure hierarchy with labels, IDs, and roles
  const hierarchy = buildDisclosureHierarchy(presentationLinkbase, labelMap, locatorRoleMap);

  // Output the result
  console.log('hierarchy:', JSON.stringify(hierarchy, null, 2));
}

main();
