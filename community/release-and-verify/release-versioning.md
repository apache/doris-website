---
title: Apache Doris Version Rules and Version Selection
language: en
description: Apache Doris version number rules (major/minor/patch), upgrade and downgrade compatibility policy, and CPU binary selection guide.
keywords:
    - Apache Doris version number
    - Doris version rules
    - Doris upgrade and downgrade
    - Latest Stable version
    - x64 avx2 ARM64
    - Doris Binary selection
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

# Apache Doris Version Rules and Version Selection

<!-- Knowledge type: Rule specification -->
<!-- Applicable scenarios: Version selection / Upgrade and downgrade evaluation / Pre-deployment check -->

This document describes the semantics of Apache Doris version numbers, the upgrade and downgrade compatibility policy, and how to select the appropriate binary based on CPU architecture.

## Version Number Rules

Apache Doris uses a three-part version number `X.Y.Z`. The meaning, typical changes, and release cadence for each part are as follows:

| Position | Name | Meaning | Release Cadence |
| --- | --- | --- | --- |
| X | Major | Major feature release or architectural upgrade | Yearly |
| Y | Minor | Important features, performance optimizations, or necessary metadata/data format changes | Quarterly |
| Z | Patch | Bug fixes, performance optimizations, and small feature updates | Typically every 2-4 weeks |

## Version Upgrade and Downgrade

<!-- Knowledge type: Rule specification -->

| Upgrade Type | Forward Compatibility (old → new) | Backward Compatibility (new → old) | Recommendation |
| --- | --- | --- | --- |
| Major (X) | Compatible | Not guaranteed | Back up data before upgrading |
| Minor (Y) | Compatible | Not guaranteed | Back up data before upgrading |
| Patch (Z) | Compatible | Compatible | Upgrade and downgrade directly, with no data compatibility concerns |

Major (X) and minor (Y) version upgrades may involve metadata or data format changes. Apache Doris guarantees that these changes are forward compatible (that is, you can upgrade from an older version to a newer version), but does not guarantee backward compatibility (that is, downgrading from a newer version to an older version is not guaranteed). Patch (Z) versions support both upgrade and downgrade.

## How to Select a Version

The Apache Doris team mainly maintains the two latest version branches, labeled as **Latest** and **Stable**:

| Label | Contents | Applicable Scenarios |
| --- | --- | --- |
| Latest | Latest features, optimizations, and bug fixes | Trying new features, POC validation, performance testing, pre-production |
| Stable | Continuous bug fixes, higher stability | Production environment |

## CPU Models and Binary Versions

<!-- Knowledge type: Hardware requirement -->
<!-- Applicable scenarios: Pre-deployment check / Environment acceptance -->

Apache Doris provides three binaries for different CPU architectures and instruction sets:

| Binary Name | Applicable CPU | Description |
| --- | --- | --- |
| x64(avx2) | x86_64 CPUs that support the AVX2 instruction set | Default recommendation, best performance |
| x64(no avx2) | x86_64 CPUs that do not support the AVX2 instruction set | For older x86_64 processors |
| ARM64 | ARM-based CPUs | For ARM servers (such as Kunpeng, Graviton) |

:::tip Tip
Run the following command to check whether the CPU supports the AVX2 instruction set:

```bash
cat /proc/cpuinfo | grep avx2
```

If there is output, the CPU supports AVX2, and you can choose the `x64(avx2)` binary.
:::

## FAQ

**Q: Can I downgrade directly from 2.0.x back to 1.2.x?**

No. Downgrades across major or minor versions do not guarantee metadata and data format compatibility. Perform a full backup before any major or minor version upgrade.

**Q: Can patch versions be upgraded by skipping versions (for example, from 2.0.1 directly to 2.0.5)?**

Yes. Patch versions maintain forward and backward compatibility, so you can skip versions when upgrading or downgrading.

**Q: How do I decide whether to choose Latest or Stable?**

For production environments, choose Stable first. For evaluation and trying new features, choose Latest.
