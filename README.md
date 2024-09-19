# ESRS XBRL Parser (for Node.js)

⚠️ Note: work-in-progress by The Climate Action Agency (https://www.climateaction.agency/).

**Tool for parsing European Sustainability Reporting Standards (ESRS) taxonomies in XBRL format**

The **ESRS XBRL Parser** is a lightweight and efficient tool designed to parse [XBRL (eXtensible Business Reporting Language)](#xbrl-extensible-business-reporting-language) taxonomies, specifically tailored for the **European Sustainability Reporting Standards (ESRS)**. Developed to support the sustainability reporting requirements set by the **Corporate Sustainability Reporting Directive (CSRD)**, the parser helps navigate complex XBRL files. It enables the easy extraction of key financial and sustainability data from reports based on ESRS, which were created by **EFRAG (European Financial Reporting Advisory Group)** as the technical advisor to the European Commission.

## Goals

- **Compliant with Latest Standards**: Built to work seamlessly with ESRS Set 1 XBRL Taxonomies, ensuring compliance with the European Commission’s reporting requirements.
- **Simple Integration**: Effortlessly integrate the parser into Node.js projects using modern JavaScript or TypeScript.
- **High Performance**: Optimized to handle large and complex ESRS taxonomies quickly and efficiently.
- **Modular and Extensible**: Easily extend the parser to accommodate additional taxonomies or custom XBRL needs.

## License

This project is licensed under the [ISC License](LICENSE).

## Installation

Get the ESRS files from EFRAG: https://www.efrag.org/en/projects/esrs-xbrl-taxonomy/concluded

Unzip the ESRS files into `./ESRS-Set1-XBRL-Taxonomy` inside this project folder.

## Usage

### ESRS Core (concepts, labels and references only)

Parse the file `xbrl.efrag.org/taxonomy/esrs/2023-12-22/common/esrs_cor.xsd`:

    npm run list:core

Searching:

    npm run list:core "Scope3GreenhouseGasEmissions"

Dump to a text file:

    mkdir output
    npm run list:core > output/list_esrs_cor.txt

#### Output

    2023-12-22/common/esrs_cor.xsd:
        ∟ filePath
        ∟ schema
        ∟ xsd:schema [targetNamespace, elementFormDefault, xmlns:xsd, xmlns:esrs, xmlns:link, xmlns:xbrldt, xmlns:dtr-types, xmlns:enum2, xmlns:xbrli, xmlns:country, xmlns:xlink]
            ∟ xsd:annotation
            ∟ xsd:appinfo
                ∟ link:linkbaseRef
                ∟ 0 [xlink:type, xlink:href, xlink:arcrole]
                ∟ 1 [xlink:type, xlink:href, xlink:role, xlink:arcrole]
                ∟ 2 [xlink:type, xlink:href, xlink:role, xlink:arcrole]
    (...etc)

and further down:

    ∟ 2782 [id:'esrs_DisclosureRequirementE21PoliciesRelatedToPollutionMember', type:'dtr-types:domainItemType', name, substitutionGroup, abstract, nillable, xbrli:periodType]
    (...)
    ∟ 3976 [id:'esrs_PublicClaimsOfGHGNeutralityThatInvolveUseOfCarbonCreditsHaveBeenMade', type:'xbrli:booleanItemType', name, substitutionGroup, abstract, nillable, xbrli:periodType]

### ESRS All (all topics and disclosure requirements, with all linkbases)

Parse the file `xbrl.efrag.org/taxonomy/esrs/2023-12-22/esrs_all.xsd`:

    npm run list:all

Searching:

    npm run list:all "Scope3GreenhouseGasEmissions"

Dump to a text file:

    mkdir output
    npm run list:all > output/list_esrs_all.txt

## `ESRS-Set1-XBRL-Taxonomy` folder contents

    📁 META-INF
       ∟ 📄 catalog.xml (XML catalog for mapping URIs to local files, aiding file lookups in the taxonomy)
       ∟ 📄 taxonomyPackage.xml (Metadata about the taxonomy package, describing its structure and main entry points)
    📁 xbrl.efrag.org
       ∟ 📁 taxonomy
          ∟ 📁 esrs
             ∟ 📁 2023-12-22 (Release date)
                ∟ 📄 esrs_all.xsda (Schema definitions assembly for the complete ESRS taxonomy)
                ∟ 📁 common (Shared definitions and schema elements)
                   ∟ 📄 esrs_cor.xsd (Schema definitions for the core ESRS taxonomy)
                   ∟ 📁 labels (Human-readable names for things)
                      ∟ 📄 doc_esrs-en.xml (Explanations how values to ESRS elements/disclosures should be provided)
                      ∟ 📄 gla_esrs-en.xml (Headlines in the taxonomy/hierarchy)
                      ∟ 📄 lab_esrs-en.xml (Labels of individual ESRS elements/disclosures)
                   ∟ 📁 references (References to regulatory requirements)
                      ∟ 📄 ref_esrs.xml (References to regulatory requirements or standards linked to ESRS elements)
                ∟ 📁 all (Complete ESRS taxonomy)
                   ∟ 📁 dimensions (Categories or breakdowns)
                      ∟ 📄 dim_esrs_*.xml (Defining dimensional data, e.g. categories or breakdowns, for ESRS reporting)
                   ∟ 📁 enumerations (Fixed enumerated sets of values)
                      ∟ 📄 def_esrs_*.xml (Defining enumerations — fixed enumerated sets of values — for specific ESRS concepts)
                   ∟ 📁 formula (Validation rules and formulas)
                      ∟ 📄 for_esrs_validation_mandatory_tags.xml (Formulas for validating mandatory tags in ESRS reports)
                      ∟ 📄 for_esrs_validation_typed_dimensions.xml (Formulas for validating typed dimensions in reports)
                      ∟ 📄 for_esrs_validation_units.xml (Formulas for validating unit consistency in ESRS reporting)
                      ∟ 📄 for_esrs.xml (General validation rules and formulas for ESRS reports)
                   ∟ 📁 linkbases (Relationships between taxonomy elements)
                      ∟ 📄 cal_esrs_*.xml (Defining calculation relationships between elements, how certain values are calculated)
                      ∟ 📄 def_esrs_*.xml (Defining concept and dimensional relationships, e.g. role of an element)
                      ∟ 📄 pre_esrs_*.xml (Organizing how concepts should be presented, e.g. hierarchical structure of disclosures)

## XBRL (eXtensible Business Reporting Language)

XBRL is an XML standard for digital business reporting ([read more here](https://www.xbrl.org/the-standard/what/what-is-xbrl/)).

### XBRL Tags

- **`<gen:arc />`**: A generic link arc that represents a relationship between two resources in XBRL, not specific to presentation or calculation.
- **`<gen:link />`**: A generic linkbase in XBRL used to define custom relationships between different taxonomy elements.
- **`<label:label />`**: Represents a human-readable label for an XBRL concept, used to display a descriptive name for reporting elements.
- **`<link:arcroleRef />`**: Defines an arc role, which specifies the nature of the relationship between two elements in an XBRL taxonomy.
- **`<link:linkbase />`**: The root element of a linkbase document in XBRL, which contains relationships (arcs) and resources (labels, locators).
- **`<link:loc />`**: A locator element that points to a specific concept or resource in the taxonomy, used to refer to specific definitions or elements.
- **`<link:presentationArc />`**: Defines the hierarchical relationship between concepts, helping to structure them for presentation.
- **`<link:presentationLink />`**: A linkbase that organizes the presentation of concepts in a hierarchy, useful for displaying data.
- **`<link:roleRef />`**: References a role, which groups related arcs and resources, defining the context in which they should be interpreted.

### XBRL Terminology

See also the [XBRL Glossary](https://www.xbrl.org/guidance/xbrl-glossary/)

- **Concepts**:
  - Individual data points or facts in XBRL, such as sustainability metrics or disclosures.
  - Example: "Total GHG Emissions" tagged for sustainability reporting.
- **Dimensions**:
  - Allow for the categorization or breakdown of reported data, enabling multi-dimensional analysis.
  - Example: A company might report GHG emissions broken down by geographical region or time period using dimensions like `Geographical Area [axis]` or `Reporting Period [axis]`.
- **Enumerations**:
  - Define a set of allowed values (a fixed set) that can be used for specific data elements.
  - Example: An enumeration might list "Yes" or "No" as the only allowable responses to a disclosure question about whether a company has a transition plan for climate change.
- **Formula**:
  - Specifies rules for validating reported data or calculating values based on other reported information.
  - Example: A formula might ensure that reported totals (like total GHG emissions) are the sum of various components (e.g., emissions from Scope 1, Scope 2, and Scope 3).
- **Labels**:
  - Human-readable names or descriptions for XBRL concepts, offering clarity and context.
  - Types: Standard (short) or documentation (detailed) labels.
- **Linkbases**:
  - Files in the XBRL taxonomy that define relationships between elements.
  - Types: Presentation (for hierarchy), definition (for dimensions), calculation (for aggregating data), label/reference (for names and documentation).
- **References**:
  - Links between XBRL concepts and regulatory sections or standards.
  - Example: A reference pointing to ESRS E1, which deals with climate-related disclosures.

#### ESRS-specific terminology

- **Disclosure Requirements (DRs)**:
  - Specific data points or narratives that companies must disclose, based on relevance to a topic, such as water use or social equity.
- **Topics**:
  - Broad areas in ESRS, like climate change or governance, that companies must report on.
