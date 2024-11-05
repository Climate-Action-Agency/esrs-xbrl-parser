import * as fs from 'fs';
import * as cheerio from 'cheerio';

// Load the HTML file
const html = fs.readFileSync('./ESRS-Set1-XBRL-Taxonomy/esrs_set1.html', 'utf-8');

// Parse the HTML using cheerio
const $ = cheerio.load(html);

function cleanString(str: string): string {
  return str?.replace(/\s+/g, ' ')?.trim();
}

const printTag = (element: cheerio.Element) => `<${$(element).prop('tagName').toLowerCase()}>`;

// Example: Get all paragraphs
$('.eli-container > *').each((index, element) => {
  console.log(`#${index + 1}:`, printTag(element), cleanString($(element).text())?.substring(0, 70));
  if (index >= 200) {
    return false;
  }
});
