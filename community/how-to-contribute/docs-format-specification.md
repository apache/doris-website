---
title: Documentation Format Specification
language: en
description: "Apache Doris documentation format specification: file naming, English capitalization, SQL functions, and abbreviation conventions."
keywords:
    - Apache Doris
    - documentation format specification
    - file naming rules
    - SQL function naming
    - Markdown specification
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Knowledge Type: Rules and Specifications -->
<!-- Applicable Scenarios: Documentation Contribution / Documentation Review -->

This document is the format specification for Apache Doris documentation. It covers:

1. Basic format rules for file names, URLs, and layout
2. Recommended rendering elements for document content

:::caution Note

- Regardless of whether you are editing a historical version or the latest version of the documentation, submit your PR to the [apache/doris-website](https://github.com/apache/doris-website) repository.
- Before submitting a documentation change, please read the [Documentation Contribution Guide](./contribute-doc).

:::

## Basic Format Specifications

### File and URL Naming

A document name should briefly summarize the document content and should not be too long. On the Doris website, the file name is also used as the URL, so the file naming rule corresponds to the item name in `sidebars.json`.

| Rule | Description | Example |
| --- | --- | --- |
| Match the sidebar | The file name must match the document name in `sidebars.json` | `quick-start` |
| All lowercase | Use all-lowercase words in file names. Do not mix cases, and do not add punctuation | `standard-deployment` |
| Hyphen separator | Separate multiple English words with a hyphen `-`. Underscores `_` are not recommended | `bloom-filter-index` |
| Function exception | When a specific function name uses underscores, follow the function's naming convention | `array_max` |

### English Capitalization Specifications

| Scenario | Rule |
| --- | --- |
| Headings | Capitalize the first letter of the first word in the heading. All other words are lowercase except proper nouns |
| English in a Chinese sentence | Mainly follow CamelCase. Proper nouns follow their conventional spelling |
| Mixed Chinese and English | In Chinese documents, use Chinese expressions as much as possible. Only use English for specific phrases or words. The same applies to English documents |

### English Proper Noun Specifications

For Chinese documents that refer to foreign company brands, product names, or technical terms that have no official Chinese translation, use the English name directly with the correct capitalization. The table below is updated continuously. You are welcome to add entries in your PR.

| No Official Chinese Translation |
| --- |
| GitHub |
| SQL |
| CPU |
| FE |
| BE |
| HTTP |
| MySQL |
| MongoDB |
| Elasticsearch |
| Azure |
| AWS |
| S3 |
| Doris Manager |
| WebUI |
| Flink Doris Connector |

### SQL Function and SQL Manual Specifications

| Scenario | Rule | Example |
| --- | --- | --- |
| SQL function names | All uppercase. Separate characters with an underscore `_` according to the syntax convention | `ARRAY_MAX`, `DIGITAL_MASKING` |
| DML / DDL / Data Type / Cluster Management | Uppercase. Separate characters with a half-width space | `ALTER CATALOG`, `SELECT * FROM` |
| Examples and references | Lowercase is allowed | `col_name1`, `sample_value` |

For SQL function documentation layout, refer to [Documentation Contribution Guide - How to Write the Command Help Manual](./contribute-doc#how-to-write-the-command-help-manual).

### Abbreviation Specifications

Abbreviations are divided into Chinese abbreviations and English abbreviations. Please follow the rules below.

**Chinese abbreviations**: Make sure the abbreviation is easy to understand and does not cause ambiguity. It is recommended to explain the full meaning the first time the term appears and notify the reader that the abbreviated form will be used thereafter.

**English abbreviations**:

- Do not explain English abbreviations in headings
- It is recommended to explain the full meaning the first time an abbreviation appears in the body text, such as `Tablet & Partition` (referred to as "partitions and buckets" in the following documents)
- Do not use non-standard abbreviations

:::tip

| Incorrect | Correct |
| --- | --- |
| 16c32g | 16 cores, 32 GB |
| 10w | 100,000 |

:::

## Document Structure Specifications

### Headings

Reasonable heading levels and heading descriptions help the reader understand the logic of the entire document and make the article structure clear at a glance.

**1. Heading Levels**

Technical documents have at most two heading levels. **Body headings start incrementing from `##`. Do not skip levels.**

| Level | Syntax | Description |
| --- | --- | --- |
| Level 1 heading | `{ "title": "", "language": "" }` | The article title. **Do not use `#` to define the article title** |
| Level 2 heading | `##` | The heading of the article body |
| Level 3 heading | `###` | A subheading under a level 2 heading |

```markdown
{
    "title": "Document title (the # level 1 heading)",
    "language": "en"
}


## Level 2 heading

### Level 3 heading
```

**2. Heading Description Structure**

Technical document headings include, but are not limited to, the following descriptions:

- Noun phrase, such as "High-Concurrency Point Query Principles"
- Topic + verb, such as "Docker Deployment"
- Verb + topic, such as "Configuration File Directory"
- Modifier + topic, such as "Schema Change" or "Flink Doris Connector User Guide"
- Preposition + modifier + topic, such as "Deploying with Doris Operator"

**3. Other Notes**

There is no strict template for heading descriptions. Just follow these principles:

- Summarize the central content of the section concisely
- Use the same structure for headings at the same level whenever possible
- **Do not repeat the parent heading's content in a child heading**
- **Do not end a heading with punctuation**
- Do not explain abbreviations in headings

### Lead Paragraph

The lead paragraph appears before the body content. It should provide a high-level summary of the document and should be kept within 150 words when possible.

You can refer to the following two writing styles:

- What XXX is, such as "Data Export is a Doris feature that exports data. It can..."
- This document introduces XXX, such as "This document introduces the basic principles, usage, best practices, and notes for Data Export"

## Document Content Elements (For Reference)

### Tab Usage

Technical documents often use the Tab key and the space key for indentation and alignment. Therefore, it is recommended to:

- Use Tab for indentation. Do not mix Tab and space for indentation
- Set one Tab equal to four half-width spaces uniformly in editors such as Visual Studio Code
- Indentation affects how the document is rendered. **Use the rendering in a rich-text editor such as VS Code as the standard** (for example, code blocks inside a multi-level indented structure sometimes still need zero-level indentation to render correctly)

### Space Usage

- Add a half-width space before and after English text or numbers when adjacent to Chinese
- Add a half-width space before and after a code box when adjacent to Chinese
- Do not add spaces **inside parentheses**. Add a half-width space before and after **the outside of parentheses**

:::tip

Tool for batch-adding half-width spaces: https://github.com/huacnlee/autocorrect

:::

### Ordered and Unordered Lists

Ordered and unordered lists are commonly used in the body of technical documents. Ordered lists usually emphasize a priority order between items.

- **It is recommended to use the `1. **Bold ordered text**` format for ordered text**, so the text aligns with the parent level without indentation
- When ordered text contains unordered text, bold the ordered text and do not bold the unordered text

### Links

Links in a document guide the reader to related documents or external sites. It is recommended to follow these rules:

- **Link description**: Use a consistent style for descriptions of the same type of link. Within a single document, avoid using phrases such as "see for details", "refer to for details", and "find details at" repeatedly
- **Link format**:
    - Link to another heading in the same document: `[Inverted Index]`
    - Link to a neighboring document: `[BITMAP Index]`
    - Link to an external site: `[Wikipedia - Inverted Index](https://en.wikipedia.org/wiki/Inverted_index)`
- **Link path**:
    - It is recommended to consistently use either relative paths or absolute paths within a single document. Do not mix the two
    - It is recommended to reduce the number of jumps to external sites to avoid a broken external page affecting the reader's experience. If you must link the reader to an external site, it is recommended to notify the reader that they will leave for an external site, such as "Click to go to XXX"

### Code Blocks and Code Comments

When inserting code blocks, follow these rules:

- Use a single backtick (`` ` ``) for inline code. Use three backticks for multi-line code
- Add a space before and after inline code blocks. Leave a blank line between multi-line code and the body text
- **Pay attention to code-block indentation**. When a code block is under content such as an ordered list item or a list item, indent it on top of that item's indentation level
- When using multi-line code, it is recommended to **add a code fence and specify the code-block language** so that the corresponding syntax highlighting is supported

The common languages and their code-fence specifiers are as follows:

| Code Type | Code-Fence Specifier |
| --- | --- |
| Shell script | ` ```shell ` |
| Python code | ` ```python ` |
| JSON code | ` ```json ` |
| XML document | ` ```xml ` |
| SQL query (use lowercase `sql`, otherwise rendering fails) | ` ```sql ` |
| YAML file | ` ```yaml ` or ` ```yml ` |
| Markdown text | ` ```markdown ` or ` ```md ` |
| JavaScript code | ` ```js ` or ` ```javascript ` |
| Java code | ` ```java ` |
| C++ code | ` ```cpp ` |
| C code | ` ```c ` |
| Ruby code | ` ```ruby ` |
| HTML code | ` ```html ` |
| CSS code | ` ```css ` |
| PHP code | ` ```php ` |

When using `shell` code, write the input command and the output result separately. The following example uses the Kubernetes cluster access documentation:

- Use the following command to check the corresponding Service:

    ```shell
    kubectl get pod --namespace doris
    ```

- The returned result is as follows:

    ```shell
    NAME                     READY   STATUS    RESTARTS   AGE
    doriscluster-helm-fe-0   1/1     Running   0          1m39s
    doriscluster-helm-fe-1   1/1     Running   0          1m39s
    doriscluster-helm-fe-2   1/1     Running   0          1m39s
    doriscluster-helm-be-0   1/1     Running   0          16s
    doriscluster-helm-be-1   1/1     Running   0          16s
    doriscluster-helm-be-2   1/1     Running   0          16s
    ```

### Admonition Notes

Admonition notes are used to emphasize content in a technical document. Follow these rules when using them.

| Type | Scenario | Syntax |
| --- | --- | --- |
| Tip | Mainly used for operation tips | `:::tip Tip` |
| Info | Used to add supplementary content or explanations | `:::info Note` |
| Caution | Used for warnings about operations or things to watch out for | `:::caution Caution` |

Admonition content can include ordered lists, unordered lists, and code blocks.

Here is an example of admonition notes in a Markdown document:

```markdown
:::tip Tip
This is a tip
:::

:::info Note
This is a note
:::

:::caution Caution
This is a caution
:::
```

### Images

When inserting an image, follow these rules:

- Use descriptive text for image names, such as `Broadcast Join Principle`
- **Add alt text** when inserting an image. The recommended syntax is `![Alt text description](https://example.com/your-image.png)`
- To center an image, use:

    ```markdown
    <div style={{textAlign:'center'}}>
    <img src="image URL" alt="text description" style={{display: 'inline-block'}}/>
    </div >
    ```

### Tables

To insert a line break inside a table cell, use `<p>XXXX</p>`.

### Collapsible Boxes

Collapsible boxes are used after a level 3 heading. When there are too many content levels, you can use a collapsible box to separate them.

Follow these rules:

- Use the syntax `<details><summary>Collapsible box title</summary> Collapsible box content</details>`
- Pay attention to the indentation of the collapsible box. Under a level 3 heading, start it at the leftmost column

Here is an example of a collapsible box in Markdown:

```markdown
<details>
<summary>Fill in the title here</summary>
This is the collapsible box content
<p>To add a line break, use an HTML tag</p>
<p>XXXXXXXX</p>
</details>
```

### Tab Selector

The Tab selector is used after a level 3 heading. When the document content has too many levels, you can use a Tab selector container.

Follow these rules:

- Pay attention to the indentation of the Tab selector. Under a level 3 heading, start it at the leftmost column
- The syntax is as follows:

```markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="Content title 1" label="Content title 1" default>
    <p>Content 1 </p>
    <p>Content 2 </p>
  </TabItem>
  <TabItem value="Content title 2" label="Content title 2" default>
    <p>Content 1 </p>
    <p>Content 2 </p>
  </TabItem>
</Tabs>
```

### Version Tags

In the new documentation, **using version tags to distinguish multiple document versions is not recommended**. If a feature needs to be distinguished by version, you can mark it with the `:::tip :::` admonition note.

### Blockquotes

In the new documentation, **using the `>` blockquote symbol** for content description or nesting is not recommended. If you need to add a note, use the `:::info :::` admonition note.

## Related Documents

- [Documentation Contribution Guide](./contribute-doc)
- [How to Share a Blog](./how-to-share-blogs)
