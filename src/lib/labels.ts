import { AnyMap, StringMap, Xml2JSNode, XBRLElement } from '../types/global';
import { STRING_KEY, parseXML } from './parsing';
import { printXMLTree } from './output';

/** Get label from file: lab_esrs-en.xml */
export const getElementLabel = (labelId: string, esrsCoreXml: Xml2JSNode): string => {
  const label = esrsCoreXml['xsd:schema']?.['xsd:annotation']?.['xsd:appinfo']?.['link:linkbaseRef']
    ?.find((linkbaseRef: Xml2JSNode) => linkbaseRef.$['xlink:href'] === 'labels/lab_esrs-en.xml')
    ?.['link:linkbase']?.['link:labelLink']?.['link:label']?.find(
      (label: Xml2JSNode) => label.$.id === `${labelId}_label`
    )?.[STRING_KEY];
  return label;
};

/** Get documentation from file: doc_esrs-en.xml */
export const getDocumentation = (labelId: string, esrsCoreXml: Xml2JSNode): string => {
  const label = esrsCoreXml['xsd:schema']?.['xsd:annotation']?.['xsd:appinfo']?.['link:linkbaseRef']
    ?.find((linkbaseRef: Xml2JSNode) => linkbaseRef.$['xlink:href'] === 'labels/doc_esrs-en.xml')
    ?.['link:linkbase']?.['link:labelLink']?.['link:label']?.find(
      (label: Xml2JSNode) => label.$.id === `${labelId}_documentation`
    )?.[STRING_KEY];
  return label;
};

/** Get role label from file: esrs_cor.xsd */
export const getRoleLabel = (roleId: string, esrsCoreXml: Xml2JSNode): string => {
  const annotation = esrsCoreXml['xsd:schema']?.['xsd:annotation'];
  // 1) Find label
  const roleTypes = annotation?.['xsd:appinfo']?.['link:roleType'];
  const roleType = roleTypes?.find((roleType: Xml2JSNode) => roleType?.$?.id === roleId);
  const label = roleType?.['link:definition'];
  // See also: roleType?.['link:usedOn']: [
  //   'link:calculationLink',
  //   'link:definitionLink',
  //   'link:presentationLink'
  // ]
  return label;
};

// export const getRoleLabelOld = (
//   xlinkHref: string,
//   roleLabelMap: { [key: string]: string },
//   includeLabelKey = false
// ): string => {
//   const labelKey = xlinkHref.includes('#') ? xlinkHref.split('#')[1] : xlinkHref;
//   return (includeLabelKey ? `${labelKey}: ` : '') + (roleLabelMap[labelKey] ?? labelKey);
// };

/** Get element attributes from file: esrs_cor.xsd */
export const getElementAttributes = (elementId: string, esrsCoreXml: Xml2JSNode): XBRLElement => {
  const elements = esrsCoreXml['xsd:schema']?.['xsd:element'];
  const element = elements?.find((element: Xml2JSNode) => element?.$?.id === elementId);
  return element?.$;
};

/** Get enumeration/dropdown items from file: esrs_cor.xsd */
export const getEnumerationMembers = (enum2DomainId: string, esrsCoreXml: Xml2JSNode): XBRLElement[] => {
  const elements = esrsCoreXml['xsd:schema']?.['xsd:element'];
  const enumerationElements = elements
    ?.filter((element: Xml2JSNode) => element?.$?.['enum2:domain'] === enum2DomainId)
    .map((elem: XBRLElement) => elem.$)
    .map((elem: XBRLElement) => ({
      label: getElementLabel(elem.id, esrsCoreXml),
      ...elem
    }));
  return enumerationElements;
};

/** Build a dictionary of labels: lab_esrs-en.xml */
export const buildLabelMap = async (labelFilePath: string): Promise<StringMap> => {
  const labelMap: { [key: string]: string } = {};
  const labelFile = await parseXML(labelFilePath);

  // Extract locators, labels, and label arcs
  const labelLink = labelFile['link:linkbase']?.['link:labelLink'];

  if (!labelLink) {
    console.error("No 'link:labelLink' elements found");
    return labelMap;
  }

  const locators = labelLink['link:loc'] || [];
  const labels = labelLink['link:label'] || [];
  const arcs = labelLink['link:labelArc'] || [];

  // Step 2: Build locator-to-label maps using arcs
  const locatorToLabelMap: { [key: string]: string } = {};
  arcs.forEach((arc: any) => {
    const from = arc['$']['xlink:from']; // Locator reference (e.g., loc_2)
    const to = arc['$']['xlink:to']; // Label reference (e.g., res_2)
    locatorToLabelMap[from] = to; // Map locator to label resource
  });

  // Step 3: Extract human-readable labels from label elements
  const labelResourceMap: { [key: string]: string } = {};
  labels.forEach((label: any) => {
    const labelId = label['$']['xlink:label']; // e.g., res_2
    const labelText = label['_']; // Human-readable label text
    labelResourceMap[labelId] = labelText;
  });

  // Step 4: Combine locator to label mapping
  locators.forEach((loc: any) => {
    const locatorId = loc['$']['xlink:label']; // e.g., loc_2
    const labelId = locatorToLabelMap[locatorId]; // e.g., res_2
    if (labelId && labelResourceMap[labelId]) {
      labelMap[locatorId] = labelResourceMap[labelId]; // Map locator to label
    }
  });

  return labelMap;
};

/** gla_esrs-en.xml */
export const buildRoleLabelMap = async (labelFilePath: string): Promise<StringMap> => {
  const labelMap: { [key: string]: string } = {}; // Map to hold role URIs and labels
  const labelFile = await parseXML(labelFilePath); // Parse the XML file

  // Extract the elements from the XML structure
  const linkbase = labelFile['link:linkbase'];
  const locations = linkbase?.['gen:link']?.['link:loc'] || [];
  const labels = linkbase?.['gen:link']?.['label:label'] || [];
  const arcs = linkbase?.['gen:link']?.['gen:arc'] || [];

  // Map locators (e.g., loc_1) to the corresponding role URIs (e.g., role-200510)
  const locatorToRoleMap: { [key: string]: string } = {};
  locations.forEach((loc: any) => {
    const href = loc['$']['xlink:href']; // e.g., ../esrs_cor.xsd#role-200510
    const roleId = href.split('#')[1]; // Extract the role ID part (e.g., role-200510)
    locatorToRoleMap[loc['$']['xlink:label']] = roleId; // Map loc_1 -> role-200510
  });

  // Map label references (e.g., res_1) to the actual label texts
  const labelResourceMap: { [key: string]: string } = {};
  labels.forEach((label: any) => {
    const labelId = label['$']['xlink:label']; // e.g., res_1
    const labelText = label['_']; // The human-readable label text
    labelResourceMap[labelId] = labelText; // Map res_1 -> '[200510] ...'
  });

  // Now map the role URIs to their labels by following arcs (from locators to labels)
  arcs.forEach((arc: any) => {
    const from = arc['$']['xlink:from']; // The locator reference (e.g., loc_1)
    const to = arc['$']['xlink:to']; // The label reference (e.g., res_1)
    const roleId = locatorToRoleMap[from]; // Get the role ID for this locator
    const labelText = labelResourceMap[to]; // Get the label text for this label reference

    if (roleId && labelText) {
      labelMap[roleId] = labelText; // Map role-200510 -> '[200510] ...'
    }
  });

  return labelMap; // Return the final role-to-label map
};
