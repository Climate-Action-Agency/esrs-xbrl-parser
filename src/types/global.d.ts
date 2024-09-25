export type StringMap = { [key: string]: string };

export interface TreeSearchFilter {
  maxLevel?: number;
  onlyFollowBranches?: string[]; // TODO: replace with skipBranches
  skipBranches?: string[];
  searchText?: string;
  searchLevel?: number; // The level at which to find the searchText
}

export interface Xml2JSNode {
  $: { [key: string]: any };
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
