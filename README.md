# ESRS XBRL Parser

⚠️ Note: work-in-progress by The Climate Action Agency (https://www.climateaction.agency/).

**Tool for parsing European Sustainability Reporting Standards (ESRS) taxonomies in XBRL format**

The **ESRS XBRL Parser** is a lightweight and efficient tool designed to parse XBRL (eXtensible Business Reporting Language) taxonomies, specifically tailored for the **European Sustainability Reporting Standards (ESRS)**. Developed to support the sustainability reporting requirements set by the **Corporate Sustainability Reporting Directive (CSRD)**, the parser helps navigate complex XBRL files. It enables the easy extraction of key financial and sustainability data from reports based on ESRS, which were created by **EFRAG (European Financial Reporting Advisory Group)** as the technical advisor to the European Commission.

## Features

- **Simple Integration**: Effortlessly integrate the parser into Node.js projects using modern JavaScript or TypeScript.
- **Modular and Extensible**: Easily extend the parser to accommodate additional taxonomies or custom XBRL needs.
- **High Performance**: Optimized to handle large and complex ESRS taxonomies quickly and efficiently.
- **Compliant with Latest Standards**: Built to work seamlessly with ESRS Set 1 XBRL Taxonomies, ensuring compliance with the European Commission’s reporting requirements.

## License

This project is licensed under the [ISC License](LICENSE).

## Installation

(coming soon)

## Usage

(coming soon)

## ESRS files

Get the ESRS files from EFRAG: https://www.efrag.org/en/projects/esrs-xbrl-taxonomy/concluded

Unzip the ESRS files into `./ESRS-Set1-XBRL-Taxonomy`

### `ESRS-Set1-XBRL-Taxonomy` folder contents

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

### Starting points

ESRS All (all topics and disclosure requirements, with all linkbases):

	xbrl.efrag.org/taxonomy/esrs/2023-12-22/esrs_all.xsda

ESRS Core (concepts, labels and references only):

	xbrl.efrag.org/taxonomy/esrs/2023-12-22/common/esrs_cor.xsd
