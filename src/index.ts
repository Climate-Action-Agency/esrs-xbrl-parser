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

async function main() {
  // Example: Parsing the main schema
  const result = await parseXML("./ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/esrs_all.xsd");
  console.log('result:', result);
}

main();
