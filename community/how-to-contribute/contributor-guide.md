---
title: Contributor Growth Path
language: en
description: "Apache Doris contributor growth path: standards for moving from Contributor to Committer / PMC, plus Code Review and PR rules."
keywords:
    - Apache Doris
    - Contributor
    - Committer
    - PMC
    - Code Review
    - Pull Request rules
    - Community roles
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

# Contributor Growth Path

<!-- Knowledge type: Rules and conventions -->
<!-- Applicable scenario: Understanding community roles / Code Review / PR merge rules -->

This document describes the role structure in the Apache Doris community, and the path for growing from Contributor into Committer and PMC.

## Community Roles

In Apache projects, developers fall into three roles:

| Role | Definition | How It Is Granted |
|------|------------|-------------------|
| **Contributor** | Once code is officially merged into the repository, the developer automatically becomes a Contributor to that project | Submit code and have it merged |
| **Committer** | Has merge permission on the code repository | Nominated and elected by a vote of the PMC (Project Management Committee) |
| **PMC Member** | A member of the Project Management Committee, with voting rights on major project decisions such as releases | Nominated and elected by a vote of the PMC |

Different roles carry different rights and responsibilities, but promotion does not have strict quantitative criteria. What matters more is sustained investment in the community and the influence built there.

## Contributor Newcomer Guide

### Subscribe to the Public Mailing Lists

<!-- Knowledge type: Procedure -->

Subscribe to the `dev@doris.apache.org` and `commits@doris.apache.org` mailing lists by sending an email to `dev-subscribe@doris.apache.org` and `commits-subscribe@doris.apache.org` respectively.

The `commits` mailing list is especially important, because all GitHub Issue and PR activity is automatically forwarded to it.

For detailed subscription steps, see [Subscribe to Mailing Lists](../subscribe-mail-list).

## Code Review Guide

<!-- Knowledge type: Rules and conventions -->
<!-- Applicable scenario: Performing Code Review -->

1. Always hold reviews to a high standard. This is how the overall quality of the product is maintained.

2. Changes to user-facing interfaces or to the overall architecture need to be fully discussed in the community. You can start the discussion on the mailing list or on an Issue. Changes to user-facing interfaces include adding new SQL functions, adding new HTTP endpoints, or adding new features. This keeps the product consistent.

3. **Test coverage**: New logic must be covered by corresponding tests. For existing legacy code where adding tests is difficult, use your judgment.

4. **Documentation**: New features must come with documentation, otherwise they cannot be merged. English documentation is required, and Chinese documentation is recommended in addition.

5. **Code readability**: If a Reviewer finds the code logic unclear, the Reviewer can ask the Contributor to explain it and to add sufficient comments in the code.

6. Try to give a clear conclusion at the end of your comment: approval, or change request. For minor issues, leaving a comment alone is fine.

7. If you have already looked at the code and think it is fine, but want others to confirm as well, you can leave a `+1 Comment`.

8. Respect each other and learn from each other. Keep a polite tone in your comments, and give reasons when you make suggestions.

## Pull Request Guide

<!-- Knowledge type: Rules and conventions -->
<!-- Applicable scenario: Submitting a PR / driving a PR to merge -->

### The Three Roles in a PR

Merging a PR involves three roles:

| Role | Responsibility |
|------|----------------|
| **Contributor** | The author who submits the PR |
| **Reviewer** | The person who leaves code-level comments on the PR |
| **Moderator** | The coordinator for merging the PR. Responsible for setting relevant labels on the PR, driving Reviewers to comment, driving the author to make changes, and merging the PR |

In a specific PR, one person may play several roles. For example, a PR submitted by a Contributor makes that person both the Contributor and the Moderator of the PR.

### PR Merge Rules

| Rule | Requirement |
|------|-------------|
| Minimum `+1` count for a normal PR | At least 1 `+1` from **a Committer other than the author** |
| Minimum `+1` count for interface-level or architectural changes | At least **3 `+1`s** |
| Waiting time after the first `+1` | **At least one working day**, to give other community members time to review |
| Regression tests | **Must all pass** |
| Comment replies | The Moderator must confirm that all comments have been replied to |
| Merge method | Always use **"Squash and merge"** |

### Key Points for PR Collaboration

1. A Contributor can assign a PR to themselves to act as the Moderator for the whole PR, taking on the work of driving it forward. After self-assignment, other Contributors know that the PR has someone responsible for it.

2. **Contributors are encouraged to act as the Moderator of their own PRs.**

3. Reviewers need to perform code-level reviews. Refer to the Code Review Guide above.

4. Once a Reviewer has commented on a PR, the Reviewer needs to continue following up on subsequent changes to that PR. It is not acceptable to leave a comment and then ignore the Contributor's follow-up replies.

5. When different Reviewers disagree about a change, try to resolve it through discussion. If discussion cannot resolve it, send an email to `dev@doris.apache.org` to call a vote, and follow the rule that the minority defers to the majority.

### Admission Check for New External Dependencies

<!-- Knowledge type: Rules and conventions -->

**Be especially careful when adding new external dependencies.** Before introducing a new library, the following questions must be answered:

- What functionality does the new external library provide? Can existing libraries provide this functionality (possibly with some effort)?
- Is the external library maintained by an active community of contributors?
- What are the license terms of the new library?
- Will the library be added to a base module? This affects other parts of the Doris codebase. Take Java as an example: if the new library introduces many transitive dependencies, you may run into unexpected class-conflict issues that are hard to catch in testing, because they depend on the order in which libraries are loaded at runtime.

## From Contributor to Committer / PMC

<!-- Knowledge type: Rules and conventions -->
<!-- Applicable scenario: Promotion to Committer / PMC -->

There are no strict quantitative criteria for becoming a Committer or PMC Member. The PMC weighs a contributor's performance across the following areas:

- **Code contributions**: Continuously submit high-quality PRs and participate in the development of core modules.
- **Code Review**: Actively review other people's PRs and help improve the code quality of the community.
- **Community participation**: Answer user questions on the mailing list, Issues, and Slack, and take part in design discussions.
- **Documentation and evangelism**: Write documentation and blog posts, and share Doris at conferences.
- **Influence**: Independently drive the evolution of important features or modules.

For detailed promotion criteria, refer to the Apache Doris official Wiki: [Guidance for committer promotion](https://cwiki.apache.org/confluence/display/DORIS/Guidance+for+committer+promotion).
