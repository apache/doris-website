---
title: How to Share a Blog
language: en
description: "How to share a technical blog with the Apache Doris community: content directions, submission channels, and the publishing process."
keywords:
    - Apache Doris
    - Technical blog submission
    - Doris Blog
    - Community contribution
    - Technical sharing
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

<!-- Knowledge type: Procedure -->
<!-- Use case: Blog submission / community content contribution -->

The Doris community welcomes technical articles about Doris. Once an article is merged, it appears on the Doris website. This page describes the recommended content directions, the submission channels, and the contribution process.

## Recommended Content Directions

Article content includes but is not limited to the following directions:

| Direction | Example Topics |
| --- | --- |
| Doris usage tips | Efficient ingestion, query tuning, operations practices |
| Doris feature introductions | Materialized views, inverted indexes, lakehouse capabilities |
| Doris system tuning | FE / BE parameter tuning, JVM optimization |
| Doris internals walkthroughs | Query execution, storage format, compaction mechanism |
| Doris business scenario practices | User behavior analysis, log search, real-time reporting experience |

## Submission Process

<!-- Knowledge type: Procedure -->

1. Prepare the blog Markdown file and place it under the `/blog` directory of the [apache/doris-website](https://github.com/apache/doris-website) repository.
2. Format the body according to the [Documentation Format Specification](./docs-format-specification), using conventions such as code fences, image alt text, and spacing between Chinese and English characters.
3. Check the README at the repository root and the related indexes to see whether you need to add a blog entry.
4. Submit a Pull Request to `apache/doris-website` describing the blog topic and author information.
5. Wait for a community Committer review, iterate based on the feedback, and merge into the main branch.

For the latest repository details and process, see the [apache/doris-website README](https://github.com/apache/doris-website).

## Related Documents

- [Documentation Contribution Guide](./contribute-doc)
- [Documentation Format Specification](./docs-format-specification)
