/**
 * npm run parse-html
 */

import * as fs from 'fs';
import * as cheerio from 'cheerio';

import { printJSON, printXMLTree, printInputFormTree } from './lib/output';

const ESRS_HTML_FILENAME = './ESRS-Set1-XBRL-Taxonomy/esrs_en.html';

function cleanString(str: string): string {
  return str?.replace(/\s+/g, ' ')?.trim();
}

type TextNodeType = 'heading' | 'text' | 'footnote';

interface TextNode {
  id: string | null;
  text: string;
  rawText?: string;
  type?: TextNodeType;
  elementTag?: string;
  isDisclosure?: boolean;
  isAppendix?: boolean;
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
  disclosures.forEach((disclosure) => {
    let disclosureText = '';
    disclosureText += `Disclosure Requirement ${disclosure.id}: ${disclosure.text}\n`;
    disclosure.children?.forEach((paragraph) => {
      disclosureText += `\n§${paragraph.id}. ${paragraph.text}`;
    });
    disclosureText += '\n';
    console.log(disclosureText);
    console.warn(disclosure.id, 'length:', disclosureText.length);
  });
}

async function main() {
  // Load the HTML file
  const html = fs.readFileSync(ESRS_HTML_FILENAME, 'utf-8');

  // Parse the HTML using cheerio
  const $ = cheerio.load(html);

  let allNodes: TextNode[] = [];
  let lastAppendixId: string | null = null;
  let lastAppendixIsDisclosure = false;

  const processElements = (index: number, element: cheerio.Element, isAppendix = false) => {
    const elementTag = $(element).prop('tagName').toLowerCase();
    const isHeading = $(element).attr('class') !== undefined;
    const rawText = cleanString($(element).text());
    let id: string | null = null;
    let type: TextNodeType = isHeading ? 'heading' : 'text';
    let text: string = rawText;
    let isDisclosure = false;

    if (rawText.startsWith('Disclosure Requirement ') || rawText.startsWith('Disclosure Requirements ')) {
      // "Disclosure Requirement BP-1 – General basis..."
      isDisclosure = true;
      const stringParts = rawText.replace(' - ', ' – ').replace(' –', ' – ').split('– ');
      id = stringParts[0]?.replace('Disclosure Requirement ', '').replace('Disclosure Requirements ', '')?.trim();
      text = stringParts[1]?.trim();
    } else if (rawText.startsWith('AR ')) {
      // "AR 17. An example of what the description..."
      const match = rawText.match(/^AR\s(\d+)\.\s(.+)$/);
      if (match) {
        id = match[1];
        text = match[2] || '';
      }
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

    // Fix for appendices with missing id
    if (isAppendix && isHeading) {
      if (id === null && lastAppendixId !== null) {
        console.warn(`No ID for appendix, reuse '${lastAppendixId}'? –`, rawText.substring(0, 50));
        id = lastAppendixId;
        isDisclosure = lastAppendixIsDisclosure;
      } else {
        lastAppendixId = id;
        lastAppendixIsDisclosure = isDisclosure;
      }
    }
    if (!isAppendix) {
      lastAppendixId = null;
    }

    const nodeObject = { id, type, isDisclosure, isAppendix, elementTag, text, rawText };

    if (rawText.startsWith('Appendix A Application Requirements')) {
      const secondDiv = $(element).find('div');
      secondDiv.children().each((i, e) => processElements(i, e, true));
    } else if (isHeading) {
      // Elements with a 'class' are headings
      allNodes.push({ ...nodeObject, children: [] });
    } else if (allNodes.length > 0) {
      allNodes[allNodes.length - 1].children?.push(nodeObject);
    }
  };

  $('.eli-container > *').each(processElements);

  // Print JSON of all disclosures
  const allDisclosures = allNodes.filter((node) => node.isDisclosure);
  printJSON(allDisclosures);

  // Print AI prompt for one disclosure
  const selectedDisclosures = allDisclosures.filter((disclosure) => disclosure.id === 'E1-6');
  // AI prompt
  // console.log('Generate ESRS (for CSRD) checklist, list of possible tables needed – based on the ESRS disclosure:\n');
  // printDisclosures(selectedDisclosures);
}

main();
