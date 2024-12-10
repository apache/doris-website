---
{
    "title": "Docs Format Specification",
    "language": "en"
}

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

This document primarily introduces:

- Formatting specifications for the document, including the file name, URL, and layout. 

- Recommending the use of markdown features for the content.

- Whether it is a historical version or the latest version of the docs, all modifications should submit pull requests to the [apache/doris-website](https://github.com/apache/doris-website)  repository.

- If you need to submit docs change, please refer to the [Docs Contribution](https://doris.apache.org/community/how-to-contribute/contribute-doc) Guide.

## Basic Format Specification

### 01 File Name

- The file name should provide a brief summary of the content and should not be too long

- If the file name consists of multiple English words, they should be separated by hyphens "-", and the use of underscores "_" is not recommended.

- When a specific SQL function requires an underscore, please follow the naming convention.

### 02 Proprietary Name (Continuously Updated)

When referring to company brands, product names, technical terms, etc. it is recommended to directly use the proprietary name and must use the correct capitalization.

| Proprietary Name      |
| --------------------- |
| GitHub                |
| SQL                   |
| CPU                   |
| FE                    |
| BE                    |
| HTTP                  |
| MySQL                 |
| MongoDB               |
| Elasticsearch         |
| Azure                 |
| AWS                   |
| S3                    |
| Doris Manager         |
| WebUI                 |
| Flink Doris Connector |

### 03 SQL Functions and SQL Manual

SQL function and SQL manual should follow the syntax conventions, it is recommended the names be written  in all uppercase letters, such as "ARRAY_MAX" 

:::tip
For details about the layout of SQL function documentation, please refer to the Docs Contribution - [How to write SQL Manual](https://doris.apache.org/community/how-to-contribute/contribute-doc/#how-to-write-sql-manual)
:::

### 04 Abbreviation in English

- It is recommended to provide the full meaning of an abbreviation when it first appears in the body of the document.

- It is not recommended use abbreviation in Titles

## Document Structure Specification

### 01 Heading and Title

- The title of Documentation uses  ` { "title": "", "language": ""}` instead of `# ` 

- The body starts with the level 2 title, and ends with the level 3 title. If there is a need to differentiate content even after using a third-level heading, you can use **numbered list, bullet points, details tag, tabs components** to indicate the further levels of hierarchy. (Please refer to relevant guidelines below)

```Markdown
{
    "title": "Here is level 1 title",
    "language": "en"
}

## Level 2 title
### Level 3 title
```

### 02 Introduction

Introduction should provide a highly summarized overview of the content. It is recommended to keep the introduction within 150 words or less. For Examples: 

:::tip
In this tutorial, you will learn: 

- What is XXX or What XXX, XXX, XXX are 

- How to XXX

- When to use XXX
:::

## Markdown Features

### 01 Tab Key and Space Key

The Tab key and the Space key are commonly used for alignment. Therefore, the following recommendations are suggested:

- Use the Tab key for alignment and avoid mixing the usage of tabs and spaces.

- Set the tab size to be equivalent to four half-width spaces in Markdown editors, such as Visual Studio Code.

- Indentation may affect document rendering results, **which is subject to correct rendering by rich text editors such as vscode (e.g., code blocks within a multi-level indentation structure sometimes still require 0-level indentation to render correctly)**.

### 02 Numbered Lists and Bullet Points

Numbered lists typically emphasize the priority order between items. When using numbered lists and bullet points, the following guidelines should be followed:

- For numbered lists, it is recommended to use **Bold text** to align the text with the higher-level hierarchy without indentation.

- When a numbered list contains bullet points, the numbered list is recommended be **bolded**, while the bullet points do not need to be bolded.

### 03 Link

When using link, it is recommended to follow the following guidelines:

**1. Link Description**

Link descriptions are not advisable to repeatedly use phrases such as "see details," "refer to," or "see specific information" within the same document.

**2. Link Format**

- Link to other headings within the same document, such as [Inverted Index](#Prefix-Index)

- Link to adjacent documents: [BITMAP Index](../../data-table/index/bloomfilter)

- Link to external websites: [Wikipedia - Inverted Index](https://en.wikipedia.org/wiki/Inverted_index)

**3. Link Paths**

- It is recommended to use either relative paths or paths consistently within the same document, avoiding mixing them.

- It is advisable to minimize redirects to external sites to prevent broken links from affecting the user experience. If linking to an external site is necessary, it is recommended to inform users that they will be redirected to an external website, such as "Click to visit XXX."

### 04 Code blocks

- You can create fenced code blocks by placing triple backticks(\```) before and after the code block. We recommend placing a blank line before and after code blocks to make the raw formatting easier to read.

- You can add an optional language identifier to enable syntax highlighting in your fenced code block: 

| Language   | Syntax Higlighting       |
| :--------- | :----------------------- |
| Shell      | \```shell```             |
| Python     | \```python```              |
| JSON       | \```json```                |
| XML        | \```xml```                 |
| SQL        | \```sql```                 |
| YAML       | \```yaml\``` or \```yml```      |
| Markdown   | \```markdown\``` or\```md```  |
| JavaScript | \```js\``` or \```javascript``` |
| Java       | \```java```                |
| C++        | \```cpp```                |
| C          | \```c```                   |
| Ruby       | \```ruby```                |
| HTML       | \```html```                |
| CSS        | \```css```                 |
| PHP        | \```php```                 |

- When using the ```shell` code block, it is recommended to separate the command and the output results. Here is an example:
  - Use the following command to view the service
  
   ```shell
    kubectl get pod --namespace doris
    ```

  - The output result
  
   ```shell
    NAME                     READY   STATUS    RESTARTS   AGE
    doriscluster-helm-fe-0   1/1     Running   0          1m39s
    doriscluster-helm-fe-1   1/1     Running   0          1m39s
    doriscluster-helm-fe-2   1/1     Running   0          1m39s
    doriscluster-helm-be-0   1/1     Running   0          16s
    doriscluster-helm-be-1   1/1     Running   0          16s
    doriscluster-helm-be-2   1/1     Running   0          16s
    ```

### 05 Admonitions

We have special admonitions syntax by wrapping text with a set of 3 colons, followed by a label denoting its type. When you want to emphasize the content, it is recommended to use admonitions.

In use, the following specifications need to be followed:

- Tip: mainly used for operational  tips and tricks.

- Note: used for more details and explanations.

- Caution: used for warnings and precautions.

You may also specify an optional title. Here are the examples of admonitions syntax:

```Markdown
:::tip Tip
Some content with tips
:::

:::info Note
Some content with explanations
:::

:::caution Warning
Some content with precuations and warnings
:::
```

### 06 Images

When you want to display images, it is convenient to co-locate the asset next to the Markdown file using it. For image directory structure, please refer to [Docs Contribution](https://doris.apache.org/community/how-to-contribute/contribute-doc/#how-to-write-sql-manual).

You can display images in two different ways: 

- Simple syntax: ` ![Alt text for images description](co-locate file structure or link) `

- If you want the image to be centered, you can use HTML as following: 

```Markdown
<div style={{textAlign:'center'}}>
<img src="co-locate file structure or link" alt="images descrition" style={{display: 'inline-block'}}/>
</div >
```

- It is recommended to use **Alt text**, to convey "why" of the images as it releates to the content of the docs, and it will be indexed by search engine. It also displays on the page is the images fails to load. 

### 07 Table

To wrap lines within a table, you can use the HTML: `<p>XXXX</p>`

### 08 Details Tag

The details tag can be used to differentiate content if there is a need to differentiate content even after using a third-level heading.

Here is an example of the details tag in Markdown:

```Markdown
<details>
<summary>Title</summary>
Here is the details
<p>If you need to wrap your line, you can use HTML controls</p>
<p>XXXXXXXX</p>
</details>
```

### 08 `Tabs`Component

Using `Tabs` components please refer to the following syntax: 

```Markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="Title 1" label="Title 1" default>
    <p>XXXXX</p>
    <p>XXXXX</p>
  </TabItem>
  <TabItem value="Title 2" label="Title 2" default>
    <p>XXXXX</p>
    <p>XXXXX</p>
  </TabItem>
</Tabs>
```

### 09 Version tags

It is not recommended to use version tags to distinguish between different versions. 

If features need to be version-specific, it is suggested to use admonitions (refer to point six) with the `:::tip ::: `

### 10 Quote

It is not recommended to use the `>` to quotation for content descriptions. 

If there is a need for more details or explanations, it is suggested to use admonitions (refer to point six) with the `:::info :::` annotation.