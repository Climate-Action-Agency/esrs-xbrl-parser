/**
 * npm run parse-html
 */

import * as fs from 'fs';
import * as cheerio from 'cheerio';

import { printJSON, printXMLTree, printInputFormTree } from './lib/output';

function cleanString(str: string): string {
  return str?.replace(/\s+/g, ' ')?.trim();
}

interface TextNode {
  id: string | null;
  text: string;
  rawText?: string;
  type?: string;
  tagName?: string;
  children?: TextNode[];
}

function startsWithNumber(str: string): boolean {
  const firstChar = str.trim()[0]; // Trim leading spaces and take the first character
  return !isNaN(firstChar as unknown as number) && firstChar !== ' ';
}

function splitAtFirstSpace(str: string): [string | null, string] {
  const firstSpaceIndex = str.indexOf(' ');
  if (firstSpaceIndex === -1) {
    // If there is no space, return the original string as the second part, with the first part empty
    return [null, str];
  }
  const firstPart = str.substring(0, firstSpaceIndex).replace(/\.+$/, ''); // remove trailing period
  const secondPart = str.substring(firstSpaceIndex + 1);
  return [firstPart, secondPart];
}

function printDisclosures(disclosures: TextNode[]): void {
  console.log('Generate ESRS (for CSRD) checklist, list of possible tables needed – based on the ESRS disclosure:\n');
  disclosures.forEach((disclosure) => {
    let disclosureText = '';
    disclosureText += `Disclosure Requirement ${disclosure.id}: ${disclosure.text}\n`;
    disclosure.children?.forEach((paragraph) => {
      disclosureText += `\n§${paragraph.id}. ${paragraph.text}`;
    });
    console.log(disclosureText);
    console.warn(disclosure.id, 'length:', disclosureText.length);
  });
}

async function main() {
  // Load the HTML file
  const html = fs.readFileSync('./ESRS-Set1-XBRL-Taxonomy/esrs_en.html', 'utf-8');

  // Parse the HTML using cheerio
  const $ = cheerio.load(html);

  let results: TextNode[] = [];

  $('.eli-container > *').each((index, element) => {
    const tagName = $(element).prop('tagName').toLowerCase();
    const rawText = cleanString($(element).text());
    let id: string | null = null;
    let type = 'text';
    let text: string = rawText;

    if (rawText.startsWith('Disclosure Requirement ')) {
      // "Disclosure Requirement BP-1 – General basis..."
      type = 'disclosure';
      const stringParts = rawText.replace(' - ', ' – ').split('– ');
      id = stringParts[0]?.replace('Disclosure Requirement ', '')?.trim();
      text = stringParts[1]?.trim();
    } else if (rawText.startsWith('( ')) {
      // "( 44 ) This information supports the information needs of financial"
      type = 'footnote';
      const match = rawText.match(/\(\s*(\d+)\s*\)\s*(.+)/);
      if (match) {
        id = match[1];
        text = match[2] || '';
      }
    } else if (startsWithNumber(rawText)) {
      // "3.7 The undertaking shall describe its policies"
      const stringParts = splitAtFirstSpace(rawText);
      id = stringParts[0];
      text = stringParts[1];
    }

    id = id?.replace(/–/, '-') ?? null;

    // Add the node to the results
    if (tagName === 'p') {
      results.push({ id, type, text, rawText, children: [] });
    } else if (tagName === 'a' && results.length > 0) {
      results[results.length - 1].children?.push({ id, type, text, rawText });
    }
  });

  const allDisclosures = results; //.filter((node) => node.type === 'disclosure');
  printJSON(allDisclosures);

  const selectedDisclosures = allDisclosures.filter((disclosure) => disclosure.id === 'E1-6');
  //printDisclosures(selectedDisclosures);
}

main();
