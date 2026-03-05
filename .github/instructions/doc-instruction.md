---
applyTo: "**"
---

# Overall Structure

Official website DOCS to focus on: English documentation is located in `docs/` and `versioned_docs/`, Chinese documentation is located in `i18n/zh-CN/docusaurus-plugin-content-docs/`, which includes title translations in various json files under this directory. Chinese and English documents must correspond.

Sidebars are located in `sidebars.json` and `versioned_sidebars/`, shared by both Chinese and English, ensuring that sidebars correspond one-to-one with official website documentation markdown files.

3.1.x versions share the same document with 3.0.x versions, so descriptions of behavior changes for 3.1 and other information should also be written in the 3.0 document.

## Document Format

- Headings at all levels should conform to title formatting, such as capitalizing the first letter of words and lowercasing prepositions
- There should be spaces between Chinese and English text, and between Chinese and numbers
- Highlighted hints wrapped with ":::" should be accurate and used sparingly
- Highlighted code blocks surrounded by "```" should use correct highlighting format and indentation, code variables should be wrapped with single backticks
- In SQL examples, input and output should use "text" and "sql" format highlighting respectively, input should not contain command line hints or other extra elements. Each example should preferably include textual explanations

## Content

- Review features in detail from the perspective of SQL engine users, focusing on whether feature boundaries are comprehensively described, whether users can accurately understand complete feature usage from the user's perspective when reviewing the entire document, and provide review reports
- Chinese and English documentation content should be completely identical, pay attention to possible English translation errors
- For uncertain points, search for answers in other documents in the codebase, if not found, report document defects

## Version Control

- For non-dev version documents, if features are merged in minor versions, the specific starting version supported needs to be marked in the documentation
