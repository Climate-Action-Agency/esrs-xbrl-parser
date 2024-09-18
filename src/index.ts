import path from 'path';
import fs from 'fs';
import xml2js from 'xml2js';

// Helper to parse XML using promises
const parseXML = async (filePath: string): Promise<any> => {
  try {
    const data = await fs.promises.readFile(filePath);
    const result = await xml2js.parseStringPromise(data, { explicitArray: false });
    return result;
  } catch (err) {
    throw err;
  }
};

async function parseAndFollowReferences(filePath: string) {
  const result = await parseXML(filePath);

  // Extract references to other schemas (e.g., xs:import or xs:include)
  const imports = result['xsd:schema']?.['xsd:import'] || [];
  const includes = result['xsd:schema']?.['xsd:include'] || [];

  const references = [...imports, ...includes];

  for (const ref of references) {
    const schemaLocation = ref['$']?.schemaLocation;
    if (schemaLocation) {
      // Parse the referenced file
      const refPath = path.join(path.dirname(filePath), schemaLocation);
      console.log(`Parsing referenced file: ${refPath}`);
      const refResult = await parseXML(refPath);
      // You can now process the content of the referenced file
    }
  }
}

async function listDisclosures(xbrlData: any) {
  const disclosures = [];

  // Check if we have the 'xsd:schema' element
  const schema = xbrlData['xsd:schema'];
  console.log('schema:', schema);
  if (!schema) {
    console.error('No schema found in the XBRL file.');
    return disclosures;
  }

  // Extract 'xsd:element' or any other relevant elements within the schema
  const linkbaseRef = schema['xsd:annotation']?.['xsd:appinfo']?.['link:linkbaseRef'];
  //console.log('linkbaseRef:', linkbaseRef);
  const elements = schema['xsd:annotation']?.['xsd:appinfo']?.['xsd:import'] || [];

  elements.forEach((element: any) => {
    // Each element might have a name or reference to a type
    disclosures.push({
      namespace: element['$']?.namespace,
      schemaLocation: element['$']?.schemaLocation
    });
  });

  return disclosures;
}

async function main() {
  // Parse the main XBRL file (adjust the path to your file)
  const startFile = 'common/esrs_cor.xsd'; // "esrs_all.xsd";
  // const esrsAll = await parseXML(`./ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/${startFile}`);
  const esrsAll = await parseAndFollowReferences(
    `./ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/${startFile}`
  );

  // Extract and list all disclosures
  const disclosures = await listDisclosures(esrsAll);
  console.log('Disclosures:', disclosures);
}

main();
