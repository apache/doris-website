---
title: Contributing to Apache Doris
language: en
description: How to contribute code, documentation, and bug fixes to Apache Doris. An overview for getting started with community contributions.
keywords:
    - Apache Doris
    - contribute code
    - contribute documentation
    - submit PR
    - bug fix
    - community participation
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

<!-- Knowledge type: Overview -->
<!-- Applicable scenario: First-time learning how to contribute to Apache Doris -->

Thank you for your interest in the Apache Doris project. The community welcomes participation in any form, including suggestions, opinions (including criticism), comments, and contributions of code and documentation.

There are many ways to participate in the Doris project: code implementation, test writing, process and tooling improvements, documentation refinement, and more. Every contribution is recognized, and the community will add you to the contributor list. Once your contributions reach a certain level, you also have the opportunity to become an Apache Committer, receive an Apache email address, and be listed in the [Apache Committer list](http://people.apache.org/committer-index.html).

For any questions, you can reach the community through the following channels: WeChat, Slack, and the mailing list. The community will respond promptly.

## Getting Started

<!-- Knowledge type: Steps -->

When you first arrive at the Doris community, you can establish contact in the following ways:

1. Follow the Doris [GitHub repository](https://github.com/apache/doris).
2. Subscribe to the [mailing list](../subscribe-mail-list) to keep up with development activity.
3. Join the Doris WeChat group (add WeChat ID `morningman-cmy` with the note "Join Doris Group").
4. Join the Doris [Slack](https://doris.apache.org/slack) channel.

Through these channels, you can stay up to date with Doris development and share your views on topics you care about.

## Doris Code and Documentation

<!-- Knowledge type: Project structure -->

As shown in the [GitHub](https://github.com/apache/doris) repository, the Apache Doris core codebase mainly consists of the Frontend (FE), Backend (BE), and Broker (for reading external storage such as HDFS). The documentation includes the official website, the GitHub Wiki, and the runtime online help manual. Details for each component are as follows:

| Component | Description | Language |
|---------|---------|---------|
| [Frontend daemon (FE)](https://github.com/apache/doris) | Consists of the query coordinator and the metadata manager | Java |
| [Backend daemon (BE)](https://github.com/apache/doris) | Handles data storage and query fragment execution | C++ |
| [Broker](https://github.com/apache/doris) | Reads HDFS data into Doris | Java |
| [Website](https://github.com/apache/doris-website) | The official Doris website | Markdown |
| [Manager](https://github.com/apache/doris-manager) | Doris Manager | Java |
| [Flink Connector](https://github.com/apache/doris-flink-connector) | Doris Flink Connector | Java |
| [Spark Connector](https://github.com/apache/doris-spark-connector) | Doris Spark Connector | Java |
| Doris runtime Help documentation | The online help manual available when running Doris | Markdown |

## Improving Documentation

Documentation is the main entry point for learning about Apache Doris, and it is one of the areas where the community most needs help.

Reading the documentation deepens your understanding of Doris and covers features and technical details. If you find any problems in the documentation, please contact the community.

If you would like to improve documentation quality (including correcting page addresses, fixing links, and writing better introductory documents), the community very much welcomes your contributions.

Most Doris documentation is written in Markdown, and you can submit changes directly in the [apache/doris-website](https://github.com/apache/doris-website) repository. Related guides:

- To submit documentation changes, see the [Documentation Contribution Guide](https://doris.apache.org/zh-CN/community/how-to-contribute/contribute-doc).
- To submit code changes, see the [Code Submission Guide](https://doris.apache.org/zh-CN/community/how-to-contribute/pull-request).

## Reporting Bugs or Issues

<!-- Applicable scenario: Reporting bugs / fixing issues -->

If you find a bug or issue, there are two ways to handle it:

1. **Report the issue**: submit a new issue through GitHub [Issues](https://github.com/apache/doris/issues/new/choose). Community members will address it on a regular basis.
2. **Fix it yourself**: read and analyze the source code to fix it yourself, then submit a [Pull Request](./pull-request).

> Tip: Before you start fixing, it is recommended to talk to the community first to confirm whether someone is already working on the same issue.

## Modifying Code and Submitting a PR

<!-- Knowledge type: Steps -->

The basic workflow for contributing code:

1. Download the code, compile it, and deploy and run it to verify that the behavior matches expectations (see the [Compilation Documentation](https://doris.apache.org/zh-CN/docs/install/source-install/compilation-with-docker/) for reference).
2. Fork the `apache/doris` repository to your own account on GitHub.
3. Create a separate branch for your changes, and add the original repository as `upstream`.
4. Submit a PR. For detailed steps, see the [Pull Request Guide](./pull-request).

Whether you are fixing a bug or adding a new feature, the community very much welcomes your contributions.
