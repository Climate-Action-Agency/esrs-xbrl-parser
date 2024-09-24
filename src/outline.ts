import path from 'path';

import { Xml2JSNode } from './types/global';
import { parseAndFollowLinks } from './lib/parsing';
import { printXMLTree, printObjectTree } from './lib/output';
import { buildLabelMap, buildRoleLabelMap, getRoleLabel } from './lib/labels';
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

  console.log(`${filePath} (filter ${JSON.stringify(searchFilter)}):\n`);

  // Build the tree starting from the root file
  const esrsAllXml = await parseAndFollowLinks(filePath, '', searchFilter);

  const linkbaseRefs =
    esrsAllXml?.['xsd:schema']?.['xsd:annotation']?.['xsd:appinfo']?.['link:linkbaseRef']?.filter(
      (linkbaseRef: Xml2JSNode) => linkbaseRef.$?.['xlink:href'].includes(PRESENTATION_SEARCH_KEY)
    ) ?? [];

  // Parse the label files
  const labelFilePath = 'common/labels/lab_esrs-en.xml';
  const labelMap = await buildLabelMap(path.join(rootPath, labelFilePath));
  const roleLabelFilePath = 'common/labels/gla_esrs-en.xml';
  const roleLabelMap = await buildRoleLabelMap(path.join(rootPath, roleLabelFilePath));

  const presentations = linkbaseRefs.map((linkbaseRef: Xml2JSNode) => {
    const sourceLinkbaseName = linkbaseRef.$?.['xlink:href'].split('linkbases/').pop();
    const roleRefs = linkbaseRef['link:linkbase'][0]['link:linkbase']['link:roleRef'];
    const roleNames = applyToAll<Xml2JSNode, string>(
      (roleRef: Xml2JSNode) => getRoleLabel(roleRef.$['xlink:href'], roleLabelMap, true),
      roleRefs
    );
    const presentationLink = linkbaseRef['link:linkbase'][0]['link:linkbase']['link:presentationLink'];
    const sectionHeadlineRoleId = presentationLink.$['xlink:role'].split('taxonomy/')[1];
    const sectionHeadline = getRoleLabel(sectionHeadlineRoleId, roleLabelMap);
    const locs = presentationLink['link:loc'];
    const descriptions = locs.map((loc: Xml2JSNode) => labelMap[loc.$['xlink:label']]);
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
