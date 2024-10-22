import path from 'path';

import { Xml2JSNode, TreeSearchFilter, ESRSSection } from './types/global';
import { parseAndFollowLinks } from './lib/parsing';
import { printXMLTree, printInputFormTree } from './lib/output';
import { LinkbaseType, HierarchyNodeMap, buildHierarchyFromLinkbase } from './lib/linkbases';
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

  // Dimension definitions
  const definitionLinkbaseRefs =
    linkbaseRefs?.filter((linkbaseRef: Xml2JSNode) => linkbaseRef.$?.['xlink:href'].includes(LINKBASE_DEFINITIONS)) ??
    [];
  const dimensionsLookupMap: HierarchyNodeMap = definitionLinkbaseRefs.reduce(
    (result: HierarchyNodeMap, linkbaseRef: Xml2JSNode) => ({
      ...result,
      ...buildHierarchyFromLinkbase(LinkbaseType.Definition, linkbaseRef, esrsCoreXml, { getAllNodes: true })
    }),
    {}
  );

  // Presentations
  const presentationLinkbaseRefs =
    linkbaseRefs?.filter((linkbaseRef: Xml2JSNode) => linkbaseRef.$?.['xlink:href'].includes(LINKBASE_PRESENTATIONS)) ??
    [];
  const presentations = presentationLinkbaseRefs.map((linkbaseRef: Xml2JSNode) =>
    // dimensionsLookupMap can be used to link dimensions to presentations, but seems to be not needed
    buildHierarchyFromLinkbase(LinkbaseType.Presentation, linkbaseRef, esrsCoreXml /*{ dimensionsLookupMap }*/)
  );

  const esrsStructure = esrsSections.map((section: ESRSSection) => ({
    ...section,
    children: presentations.filter(
      (presentation: { sectionCode: string }) => presentation.sectionCode === section.sectionCode
    )
  }));
  printInputFormTree(esrsStructure, { skipBranches: ['order'] });
}

main();
