import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import fetch from 'node-fetch';

import { ParsedXBRLFile } from './types/global';

// Helper to parse XML using promises from a local file
const parseXML = async (filePath: string): Promise<any> => {
  try {
    const data = await fs.promises.readFile(filePath);
    const result = await xml2js.parseStringPromise(data, { explicitArray: false });
    return result;
  } catch (err) {
    throw err;
  }
};

// Helper to fetch XML from an external URL
const fetchExternalResource = async (url: string): Promise<any> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${url}`);
    }
    const data = await response.text();
    const result = await xml2js.parseStringPromise(data, { explicitArray: false });
    return result;
  } catch (error) {
    console.error(`Error fetching external resource: ${url}`, error);
    throw error;
  }
};

// Function to determine if a given schemaLocation is a URL or local file
const isExternalURL = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

// Recursive function to parse XML and follow references (imports/includes)
const parseAndFollowReferences = async (filePath: string): Promise<ParsedXBRLFile> => {
  let result: any;

  // Parse the main file or fetch the external resource
  if (isExternalURL(filePath)) {
    console.log(`Fetching external file: ${filePath}`);
    result = await fetchExternalResource(filePath);
  } else {
    console.log(`Parsing local file: ${filePath}`);
    result = await parseXML(filePath);
  }

  // Initialize the parsed schema tree node
  const parsedSchema: ParsedXBRLFile = {
    filePath,
    schema: result,
    references: []
  };

  // Extract references to other schemas (e.g., xs:import or xs:include)
  const imports = result['xsd:schema']?.['xsd:import'] || [];
  const includes = result['xsd:schema']?.['xsd:include'] || [];

  const references = [...imports, ...includes];

  for (const ref of references) {
    const schemaLocation = ref['$']?.schemaLocation;
    if (schemaLocation) {
      // Determine if the reference is external or local
      let refPath = schemaLocation;
      if (!isExternalURL(refPath)) {
        refPath = path.join(path.dirname(filePath), schemaLocation);
      }

      // Recursively parse the referenced schema
      try {
        const refSchema = await parseAndFollowReferences(refPath);
        parsedSchema.references?.push(refSchema);
      } catch (error) {
        console.error(`Failed to parse referenced schema: ${refPath}`, error);
      }
    }
  }

  return parsedSchema;
};

function printObjectKeys(obj: any, maxLevels: number = -1, skipKeys: string[] = [], level: number = 0): void {
  const indent = '  '.repeat(level); // Indentation based on depth
  if (maxLevels !== -1 && level >= maxLevels) {
    return;
  }
  for (const key in obj) {
    if (skipKeys.includes(key)) {
      continue;
    }
    if (obj.hasOwnProperty(key)) {
      console.log(`${indent} ∟ ${key}`);
      // If the value is another object, recursively print its keys
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        printObjectKeys(obj[key], maxLevels, skipKeys, level + 1);
      }
    }
  }
}

async function main() {
  // Parse the main XBRL file (adjust the path to your file)
  const startFile = 'common/esrs_cor.xsd'; // "esrs_all.xsd";
  console.log('startFile:', startFile);
  // const esrsAll = await parseXML(`./ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/${startFile}`);
  const esrsAll = await parseAndFollowReferences(
    `./ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/${startFile}`
  );
  console.log('esrsAll:');
  printObjectKeys(esrsAll, 6, ['$']);

  // Extract and list all disclosures
  // const disclosures = await listDisclosures(esrsAll);
  // console.log('Disclosures:', disclosures);
}

main();
