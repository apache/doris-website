---
title: Report Issues to Apache Doris
language: en
description: "Official channels for reporting bugs or sending suggestions to Apache Doris: mailing list and GitHub Issue, with writing tips for high-quality issue reports."
keywords:
    - Apache Doris issue feedback
    - Doris bug report
    - Doris GitHub Issue
    - dev@doris.apache.org
    - Doris mailing list feedback
    - Submit Issue
    - Reproduction steps
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

# Issue Feedback

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Bug report / Feature suggestion / Usage question -->

If you discover a bug, a performance issue, or want to suggest a feature while using Apache Doris, you can report it to the community through the mailing list or GitHub Issue. This page explains the two official feedback channels and the key information a high-quality report should include.

## Feedback Channel Reference

Choose a channel based on the issue type:

| Channel | Applicable Scenario | Entry Point |
|------|----------|------|
| Mailing list | Usage questions, design discussions, community topics | Send an email to `dev@doris.apache.org` (subscription required first) |
| GitHub Issue | Reproducible bugs, specific feature suggestions, documentation issues | <https://github.com/apache/doris/issues/new/choose> |
| Security vulnerability | Security issues (do not disclose publicly) | See [Security Vulnerability Disclosure](security) |

## Feedback Methods

### Method 1: Mailing List

1. Send an email with any subject and content to `dev-subscribe@doris.apache.org`, and follow the instructions to complete the subscription (see [Subscribe to the Mailing List](subscribe-mail-list) for details).
2. After the subscription is confirmed, send an email to `dev@doris.apache.org` describing the issue or suggestion.

### Method 2: GitHub Issue

Visit the [New Issue page](https://github.com/apache/doris/issues/new/choose), and submit a Bug Report or Feature Request using the template.

## Key Points for High-Quality Feedback

<!-- Knowledge type: Writing guide -->

To help the community locate the issue quickly, include the following information in your report:

- **Describe the issue in detail**: Provide logs, key error messages, and the troubleshooting and analysis you have already performed.
- **Minimize the issue**: Narrow the scope, and strip away business context that is unrelated to the issue.
- **Provide reproduction steps**: Attach the minimum SQL, configuration, or script that reproduces the issue.
- **Focus on the issue itself**: Decouple from the business or scenario as much as possible. If scenario information must be retained, provide clear and explicit context.

## Related Links

- [Subscribe to the Mailing List](subscribe-mail-list): Complete the dev mailing list subscription in 5 steps.
- [Security Vulnerability Disclosure](security): Report security issues through the ASF process.
- [Join the Community](join-community): Other channels including Slack, Twitter, and LinkedIn.
