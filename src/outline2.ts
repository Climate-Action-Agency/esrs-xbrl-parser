import path from 'path';

import { Xml2JSNode, TreeSearchFilter } from './types/global';
import { parseAndFollowLinks } from './lib/parsing';
import { printXMLTree } from './lib/output';
import { LinkbaseType, buildHierarchyFromLinkbase } from './lib/linkbases';
import esrsSections from './config/esrsSections.json';

async function main() {
  const chapterName = process.argv?.[2] ?? '';
  const LINKBASE_PRESENTATIONS = 'pre_esrs_' + chapterName;
  const LINKBASE_DEFINITIONS = 'def_esrs_' + chapterName;
  const LINKBASES_TO_INCLUDE = [LINKBASE_PRESENTATIONS, LINKBASE_DEFINITIONS];

  const searchText = process.argv?.[3];
  const searchFilter: TreeSearchFilter = {
    // maxLevel: 10,
    onlyFollowBranches: LINKBASES_TO_INCLUDE,
    ...(searchText ? { searchLevel: 3, searchText } : {})
  };

  const esrsAllFilePath = 'ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/esrs_all.xsd';
  const rootPath = path.dirname(esrsAllFilePath);

  // Parse the core file
  const esrsCoreFilePath = 'common/esrs_cor.xsd';
  const esrsCoreXml = await parseAndFollowLinks(esrsCoreFilePath, rootPath);

  // Build the tree starting from the root file
  console.log(`${esrsAllFilePath} (filter ${JSON.stringify(searchFilter)}):\n`);
  const esrsAllXml = await parseAndFollowLinks(esrsAllFilePath, '', searchFilter);
  const linkbaseRefs = esrsAllXml?.['xsd:schema']?.['xsd:annotation']?.['xsd:appinfo']?.['link:linkbaseRef'];

  // Presentations
  const presentationLinkbaseRefs =
    linkbaseRefs?.filter((linkbaseRef: Xml2JSNode) => linkbaseRef.$?.['xlink:href'].includes(LINKBASE_PRESENTATIONS)) ??
    [];
  const presentations = presentationLinkbaseRefs.map((linkbaseRef: Xml2JSNode) =>
    buildHierarchyFromLinkbase(LinkbaseType.Presentation, linkbaseRef, esrsCoreXml)
  );
  // Definitions
  // const definitionLinkbaseRefs =
  //   linkbaseRefs?.filter((linkbaseRef: Xml2JSNode) => linkbaseRef.$?.['xlink:href'].includes(LINKBASE_DEFINITIONS)) ??
  //   [];
  // const dimensions = definitionLinkbaseRefs.map((linkbaseRef: Xml2JSNode) =>
  //   buildHierarchyFromLinkbase(LinkbaseType.Definition, linkbaseRef, esrsCoreXml)
  // );
  const esrsStructure = esrsSections.map((section: { code: string; name: string }) => ({
    ...section,
    children: presentations.filter((presentation: { sectionCode: string }) => presentation.sectionCode === section.code)
  }));
  printXMLTree(esrsStructure, { skipBranches: ['order'] });
}

main();
