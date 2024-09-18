# ESRS XBRL Parser (for Node.js)

⚠️ Note: work-in-progress by The Climate Action Agency (https://www.climateaction.agency/).

**Tool for parsing European Sustainability Reporting Standards (ESRS) taxonomies in XBRL format**

The **ESRS XBRL Parser** is a lightweight and efficient tool designed to parse XBRL (eXtensible Business Reporting Language) taxonomies, specifically tailored for the **European Sustainability Reporting Standards (ESRS)**. Developed to support the sustainability reporting requirements set by the **Corporate Sustainability Reporting Directive (CSRD)**, the parser helps navigate complex XBRL files. It enables the easy extraction of key financial and sustainability data from reports based on ESRS, which were created by **EFRAG (European Financial Reporting Advisory Group)** as the technical advisor to the European Commission.

## Goals

- **Simple Integration**: Effortlessly integrate the parser into Node.js projects using modern JavaScript or TypeScript.
- **Modular and Extensible**: Easily extend the parser to accommodate additional taxonomies or custom XBRL needs.
- **High Performance**: Optimized to handle large and complex ESRS taxonomies quickly and efficiently.
- **Compliant with Latest Standards**: Built to work seamlessly with ESRS Set 1 XBRL Taxonomies, ensuring compliance with the European Commission’s reporting requirements.

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

    META-INF/catalog.xml
    META-INF/taxonomyPackage.xml

    xbrl.efrag.org/taxonomy/esrs/2023-12-22/esrs_all.xsda
    xbrl.efrag.org/taxonomy/esrs/2023-12-22/common/esrs_cor.xsd
    xbrl.efrag.org/taxonomy/esrs/2023-12-22/common/labels/doc_esrs-en.xml
    xbrl.efrag.org/taxonomy/esrs/2023-12-22/common/labels/gla_esrs-en.xml
    xbrl.efrag.org/taxonomy/esrs/2023-12-22/common/labels/lab_esrs-en.xml
    xbrl.efrag.org/taxonomy/esrs/2023-12-22/common/references/ref_esrs.xml
    xbrl.efrag.org/taxonomy/esrs/2023-12-22/all/dimensions/dim_esrs_*.xml // Many files, with numbers
    xbrl.efrag.org/taxonomy/esrs/2023-12-22/all/enumerations/def_esrs_*.xml // Many files, with numbers
    xbrl.efrag.org/taxonomy/esrs/2023-12-22/all/formula/for_esrs_validation_mandatory_tags.xml
    xbrl.efrag.org/taxonomy/esrs/2023-12-22/all/formula/for_esrs_validation_typed_dimensions.xml
    xbrl.efrag.org/taxonomy/esrs/2023-12-22/all/formula/for_esrs_validation_units.xml
    xbrl.efrag.org/taxonomy/esrs/2023-12-22/all/formula/for_esrs.xml
    xbrl.efrag.org/taxonomy/esrs/2023-12-22/all/linkbases/cal_esrs_*.xml // Many files, with numbers
    xbrl.efrag.org/taxonomy/esrs/2023-12-22/all/linkbases/def_esrs_*.xml // Many files, with numbers
    xbrl.efrag.org/taxonomy/esrs/2023-12-22/all/linkbases/pre_esrs_*.xml // Many files, with numbers

## Glossary

### Concepts:
- **Definition**: Concepts represent individual data points or facts in XBRL. In ESRS, these are sustainability metrics or disclosures such as emissions or diversity.
- **Example**: "Total GHG Emissions" could be a concept, allowing companies to tag their emissions data for sustainability reports, making it machine-readable.

### Labels:
- **Definition**: Labels are human-readable names or descriptions of concepts in the XBRL taxonomy. They provide clarity and context, making the technical elements easier to understand.
- **Types**: Labels can be standard (short names) or documentation (detailed descriptions). These help users interpret the data points in sustainability reports.

### References:
- **Definition**: References link XBRL elements (concepts) to specific sections of regulations or standards. In ESRS, they point to where a disclosure is mandated, ensuring compliance with regulatory frameworks.
- **Example**: A reference might direct users to a section in ESRS E1, which deals with climate-related disclosure requirements for companies.

### Topics and Disclosure Requirements:
- **Topics**: These are broad sustainability areas, such as climate change or governance, covered by ESRS. Each topic includes various aspects a company must report on.
- **Disclosure Requirements (DR)**: These are the specific data points or narrative information companies must disclose, based on their relevance to each topic, like water use or social equity.

### Linkbases:
- **Definition**: Linkbases are files in the XBRL taxonomy that define relationships between elements, such as hierarchy, calculations, or labels.
- **Types**: There are several linkbases—presentation (for hierarchy), definition (for dimensional relationships), calculation (for aggregating data), and label/reference linkbases (for adding names and documentation). These structure and organize sustainability reports.
