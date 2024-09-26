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

- List: `npm run list [path to XML file]`
- Outline: `npm run outline` (⚠️ work in progress)

### List

    npm run list [path to XML file]

#### ESRS Core (concepts, labels and references only)

Parse the file `xbrl.efrag.org/taxonomy/esrs/2023-12-22/common/esrs_cor.xsd`:

    npm run list:core

Searching:

    npm run list:core "Scope3GreenhouseGasEmissions"

Dump to a text file:

    mkdir output
    npm run list:core > output/core.txt

##### Output

    common/esrs_cor.xsd (filter {}):
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

#### ESRS All (all topics and disclosure requirements, with all linkbases)

Parse the file `xbrl.efrag.org/taxonomy/esrs/2023-12-22/esrs_all.xsd`:

    npm run list:all

Searching:

    npm run list:all "Scope3GreenhouseGasEmissions"

Dump to a text file:

    mkdir output
    npm run list:all > output/all.txt

### Outline (⚠️ work in progress)

    npm run outline

Outputs `presentation` and `dimension`:

    presentation
      ∟ 0
        ∟ headline: "[200510] ESRS2.BP-1 General basis for preparation of sustainability statement - general"
        ∟ roles
          ∟ 0: "role-200510"
          ∟ 1: "role-901000"
          ∟ 2: "role-900000"
        ∟ labels
          ∟ 0: "[200510] ESRS2.BP-1 General basis for preparation of sustainability statement - general"
          ∟ 1: "[901000] Countries"
          ∟ 2: "[900000] Disaggregation by country"
        ∟ sourceFile: "pre_esrs_200510.xml"
        ∟ children
          ∟ 0
            ∟ label: "General basis for preparation of sustainability statement - general [abstract]"
            ∟ id: "esrs_GeneralBasisForPreparationOfSustainabilityStatementGeneralAbstract"
            ∟ children
              ∟ 0
                ∟ label: "General basis for preparation of sustainability statement [abstract]"
                ∟ id: "esrs_GeneralBasisForPreparationOfSustainabilityStatementAbstract"
                ∟ children
                  ∟ 0
                    ∟ label: "General basis for preparation of sustainability statement [table]"
                    ∟ id: "esrs_GeneralBasisForPreparationOfSustainabilityStatementTable"

## ESRS taxonomy

- Starting points:
  - `esrs_all.xsda` (all topics and disclosure requirements, with all linkbases)
  - `esrs_cor.xsd` (concepts, labels and references only)
- Structure and hierarchy: `pre_esrs_*.xml`
- Human-readable descriptions and explanations: `labels` folder
- Field types, dimensions (categories), and enumerations

### `ESRS-Set1-XBRL-Taxonomy` folder contents

    📁 META-INF
       ∟ 📄 catalog.xml (XML catalog for mapping URIs to local files, aiding file lookups in the taxonomy)
       ∟ 📄 taxonomyPackage.xml (Metadata about the taxonomy package, describing its structure and main entry points)
    📁 xbrl.efrag.org
       ∟ 📁 taxonomy
          ∟ 📁 esrs
             ∟ 📁 2023-12-22 (Release date)
                ∟ 📄 esrs_all.xsda (Schema definitions assembly for the complete ESRS taxonomy: all topics and disclosure requirements, with all linkbases)
                ∟ 📁 common (Shared definitions and schema elements)
                   ∟ 📄 esrs_cor.xsd (Schema definitions for the core ESRS taxonomy: concepts, labels and references only)
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

Specification: https://www.xbrl.org/specification/basespecification/per-2011-11-16/xbrl-recommendation-2003-12-31+per-2011-10-31-redlined.htm

- Generic:
  - **`<gen:arc />`**: A generic link arc that represents a relationship between two resources in XBRL, not specific to presentation or calculation.
  - **`<gen:link />`**: A generic linkbase in XBRL used to define custom relationships between different taxonomy elements.
- Links:
  - **`<link:arcroleRef />`**: Defines an arc role, which specifies the nature of the relationship between two elements in an XBRL taxonomy.
  - **`<link:linkbase />`**: The root element of a linkbase document in XBRL, which contains relationships (arcs) and resources (labels, locators).
  - **`<link:loc />`**: A locator element that points to a specific concept or resource in the taxonomy, used to refer to specific definitions or elements.
  - **`<link:presentationArc />`**: Defines the hierarchical relationship between concepts, helping to structure them for presentation.
  - **`<link:presentationLink />`**: A linkbase that organizes the presentation of concepts in a hierarchy, useful for displaying data.
  - **`<link:roleRef />`**: References a role, which groups related arcs and resources, defining the context in which they should be interpreted.
- Labels:
  - **`<label:label />`**: Represents a human-readable label for an XBRL concept, used to display a descriptive name for reporting elements.
- Values & concepts:
  - **`<cf:concept>`**: This tag refers to a **concept** in XBRL, which is essentially a **data point** or **fact** that is reported. Concepts represent the actual items being reported in a financial statement, such as revenue, net income, or assets.
  - **`<cf:conceptName>`**: This specifies the **name of the concept** (the data point or fact) within the XBRL taxonomy. It identifies the concept uniquely in the taxonomy so that systems know exactly what data is being reported.
  - **`<cf:qname>`** refers to a **qualified name** of a concept or element within the taxonomy, ensuring that the name is unique across different namespaces.
- Validation rules:
  - **`<msg:message>`** element holds this message, which is often returned to the user to inform them of the validation result.
  - **`<va:valueAssertion>`** defines a specific validation rule to ensure that a reported value is correct, based on the context or relationships defined in the taxonomy.
  - **`<validation:assertionSet>`**: This element defines a **set of assertions**, or validation rules, that must be applied together. These sets group related assertions and ensure that certain conditions or relationships between facts are checked when processing an XBRL document.
  - **`<variable:factVariable>`** defines a variable that can be referenced in formulas or validation rules. It essentially represents the reported data that is being used in the validation process.
  - **`<variable:variableArc>`** specifies how variables relate to each other in a formula or validation rule.
  - **`<variable:variableFilterArc>`**: This tag defines a **filtering relationship** between variables in XBRL. It is used to connect variables with **filters** that restrict which facts or data points can be used in calculations or validation. Filters can narrow down data based on criteria like time period, dimensions, or other attributes.
- References:
  - **`<ref:Clause>`**: Refers to a specific clause in a legal or regulatory document.
  - **`<ref:Name>`**: Specifies the name of the referenced document or regulation.
  - **`<ref:Number>`**: Represents the number assigned to a section or article in a regulatory document.
  - **`<ref:Paragraph>`**: Points to a specific paragraph in a regulation or standard.
  - **`<ref:Section>`**: Refers to a section within a referenced document.
  - **`<ref:Subparagraph>`**: Specifies a subparagraph within a referenced paragraph.
  - **`<ref:Subsection>`**: Refers to a subsection of a section in a regulation or standard.
  - **`<ref:URI>`**: Specifies the URI (Uniform Resource Identifier) linking to the document or section being referenced.
- ESRS-specific tags:
  - **`<esrs:Alternative>`**: Defines an **alternative reporting option** or scenario that can be used under certain conditions in the ESRS framework. It could represent an optional disclosure path when companies are allowed flexibility in their reporting.
  - **`<esrs:ConditionalDatapoint>`**: Refers to a **data point that is only required** under certain conditions. It may be triggered by certain facts or events (e.g., the disclosure becomes mandatory if certain thresholds are met or certain circumstances apply).
  - **`<esrs:DatapointId>`**: Identifies a **specific data point** within the ESRS taxonomy. This unique identifier links the data point to its definition, role, and requirements for reporting.
  - **`<esrs:Level1Element>`**: Represents a **top-level element** in the ESRS taxonomy hierarchy. These elements typically organize broader sustainability disclosures, such as high-level categories like climate, governance, or social impact.
  - **`<esrs:MandatoryDatapoint>`**: Specifies a **data point that is required** for all companies, without conditions. This tag marks disclosures that must be reported as part of the ESRS framework.
  - **`<esrs:PhaseIn>`**: Refers to a **transition or phase-in period** for certain ESRS requirements. Companies may be allowed extra time to comply with specific disclosure requirements, and this tag helps track which disclosures are subject to phase-in rules.
  - **`<esrs:ReferenceType>`**: Defines the **type of reference** being made in the ESRS taxonomy. It helps link the element to external standards, regulations, or other authoritative documents, specifying the nature of the reference.
  - **`<esrs:RelatedAR>`**: Refers to a **related Accounting Regulation (AR)** or another authoritative reference linked to the ESRS disclosure. This tag provides the connection between the ESRS reporting element and the relevant accounting or sustainability regulation.

### XBRL Terminology

See also the [XBRL Glossary](https://www.xbrl.org/guidance/xbrl-glossary/)

- **Arcs**: Define **relationships** (e.g., parent-child, calculation) between elements. Arcs typically have `xlink:from`, `xlink:to`, and `xlink:arcrole` attributes, to indicate which elements are connected and what the nature of the relationship is.
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
- **Links**: Act as **containers** or **groups** of arcs, organizing how those relationships are structured or presented.
- **Linkbases**:
  - Files in the XBRL taxonomy that define relationships between elements.
  - Types: Presentation (for hierarchy), definition (for dimensions), calculation (for aggregating data), label/reference (for names and documentation).
- **References**:
  - Links between XBRL concepts and regulatory sections or standards.
  - Example: A reference pointing to ESRS E1, which deals with climate-related disclosures.
- **Roles**: Defines the **context or purpose** of relationships and resources within a taxonomy, helping organize and interpret different arcs and linkbases. Roles are used to group related relationships, such as presentation, calculation, or label information, and provide additional meaning for how elements in the taxonomy should be processed or displayed.

#### ESRS-specific terminology

- **Disclosure Requirements (DRs)**:
  - Specific data points or narratives that companies must disclose, based on relevance to a topic, such as water use or social equity.
- **Topics**:
  - Broad areas in ESRS, like climate change or governance, that companies must report on.

## Todo & known issues

- [ ] Missing top level headlines (E1, S1 etc). Present in `lab_esrs-en.xml` (e.g. `esrs_ESRSE1ClimateChangeMember_label`) but no references to it. Seems to be same issue when viewing ESRS in Arelle.
- [ ] Some dimensions are empty
- [ ] Implement types, enums, validation etc

## See also

- ESRS files from EFRAG: https://www.efrag.org/en/projects/esrs-xbrl-taxonomy/concluded
- https://www.xbrl.org/the-standard/how/tools-and-services/
- https://arelle.org/ → https://github.com/Arelle/Arelle: desktop app Windows/macOS/Linux, _“end-to-end open source XBRL platform”_
- http://www.openfiling.info/esrs/ → https://github.com/EasyESEF-Max/iXBRL-for-ESRS: _“JavaScript code that transforms the input info file into an exported iXBRL output file, according to the ESRS XBRL taxonomy”_
- ESEF/iXBRL Tools: https://www.xbrleurope.org/?page_id=1243
