import path from 'path';

import { Xml2JSNode } from './types/global';
import { parseAndFollowLinks } from './lib/parsing';
import { printXMLTree } from './lib/output';
import {
  buildLabelMap,
  buildRoleLabelMap,
  buildCoreRoleLabelMap,
  getRoleLabel,
  buildPresentationHierarchy
} from './lib/labels';
import { applyToAll } from './lib/utils';

async function main() {
  const PRESENTATION_SEARCH_KEY = 'pre_esrs_';
  const filePath = process.argv?.[2] ?? 'ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/esrs_all.xsd';
  const rootPath = path.dirname(filePath);
  const searchFilter = {
    // maxLevel: 10,
    onlyFollowBranches: [PRESENTATION_SEARCH_KEY],
    ...(process.argv?.[3] !== undefined ? { level: 3, text: process.argv?.[3] } : {})
  };

  // Parse the label files
  const labelFilePath = 'common/labels/lab_esrs-en.xml';
  const labelMap = await buildLabelMap(path.join(rootPath, labelFilePath));
  const roleLabelFilePath = 'common/labels/gla_esrs-en.xml';
  const roleLabelMap = await buildRoleLabelMap(path.join(rootPath, roleLabelFilePath));
  const coreRoleLabelFilePath = 'common/esrs_cor.xsd';
  const coreRoleLabelMap = await buildCoreRoleLabelMap(path.join(rootPath, coreRoleLabelFilePath));

  console.log(`${filePath} (filter ${JSON.stringify(searchFilter)}):\n`);

  // Build the tree starting from the root file
  const esrsAllXml = await parseAndFollowLinks(filePath, '', searchFilter);

  const linkbaseRefs =
    esrsAllXml?.['xsd:schema']?.['xsd:annotation']?.['xsd:appinfo']?.['link:linkbaseRef']?.filter(
      (linkbaseRef: Xml2JSNode) => linkbaseRef.$?.['xlink:href'].includes(PRESENTATION_SEARCH_KEY)
    ) ?? [];

  const hierarchy = linkbaseRefs.map((linkbaseRef: Xml2JSNode) =>
    buildPresentationHierarchy(linkbaseRef, coreRoleLabelMap)
  );
  printXMLTree(hierarchy);
  return;

  const presentations = linkbaseRefs.map((linkbaseRef: Xml2JSNode) => {
    const sourceLinkbaseName = linkbaseRef.$?.['xlink:href'].split('linkbases/').pop();
    const roleRefs = linkbaseRef['link:linkbase']['link:roleRef'];
    const roleNames = applyToAll<Xml2JSNode, string>(roleRefs, (roleRef: Xml2JSNode) =>
      getRoleLabel(roleRef.$['xlink:href'], roleLabelMap, true)
    );
    const presentationLink = linkbaseRef['link:linkbase']['link:presentationLink'];
    const sectionHeadlineRoleId = presentationLink.$['xlink:role'].split('taxonomy/')[1];
    const sectionHeadline = getRoleLabel(sectionHeadlineRoleId, roleLabelMap);
    const linkLocs = presentationLink['link:loc'];
    const descriptions = linkLocs.map((linkLoc: Xml2JSNode) => labelMap[linkLoc.$['xlink:label']]);
    const descriptionsPreview = [...descriptions.slice(0, 3), `(etc, total ${descriptions.length})`];
    return {
      sectionHeadline,
      roleNames,
      sourceLinkbaseName,
      descriptionsPreview
    };
  });

  // Output the result
  printXMLTree(presentations);
  //console.log(JSON.stringify(esrsAllXml, null, 2));
}

main();
