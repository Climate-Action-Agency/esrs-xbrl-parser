export type AnyMap = { [key: string]: any };
export type StringMap = { [key: string]: string };

export interface TreeSearchFilter {
  maxLevel?: number;
  onlyFollowBranches?: string[]; // TODO: replace with skipBranches
  skipBranches?: string[];
  searchText?: string;
  searchLevel?: number; // The level at which to find the searchText
}

export interface ESRSSection {
  sectionCode: string;
  label: string;
}

export interface Xml2JSNode {
  $: AnyMap;
  [key: string]: any;
}

// Basic XBRL schema
export interface XBRLSchema {
  targetNamespace: string;
  elementFormDefault?: string;
  xmlns?: { [key: string]: string };
  import?: XSDImport[];
  include?: XSDInclude[];
}

export interface XBRLElement {
  $: AnyMap;
  abstract: string;
  children?: string;
  documentation?: string;
  domain: string;
  enumerationMembers?: string;
  headUsable?: string;
  id: string;
  label?: string;
  labels?: string;
  labelType?: string;
  linkrole: string;
  name: string;
  nillable: string;
  originalLabel?: string;
  periodType: string;
  roles?: string;
  sectionCode?: string;
  sourceFile?: string;
  substitutionGroup: string;
  type: string;
  typedDomainRef: string;
  'enum2:domain'?: string;
  'enum2:headUsable'?: string;
  'enum2:linkrole'?: string;
  'xbrldt:typedDomainRef'?: string;
  'xbrli:periodType'?: string;
}

// Types for import/include elements
export interface XSDImport {
  namespace: string;
  schemaLocation: string;
}

export interface XSDInclude {
  schemaLocation: string;
}

// Type for a parsed XBRL file
export interface ParsedXBRLFile {
  filePath: string;
  schema?: XBRLSchema;
  references?: ParsedXBRLFile[];
}
