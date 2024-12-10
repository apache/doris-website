---
{
    "title": "Doris Versioning",
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

## Release Versioning

Apache Doris uses a three-digit version number (X.Y.Z)

- **Major version X**: represents major feature releases or architecture upgrades, such as the vectorized execution engine in version 1.x.x; the new optimizer in version 2.x.x; and the storage-computing separation architecture in version 3.x.x. Major versions are usually changed on a grade-level cycle.

- **Minor version Y**: represents the release of important features, performance optimization, or changes in metadata and data formats. Minor version changes are usually updated on a quarterly basis.

- **Patch version Z**: mainly used to fix bugs, optimize performance, and update minor features. The patch version is usually released every 2-4 weeks.

## Version Upgrade and Downgrade

- Major (X) and minor (Y) version upgrades may alter metadata or data formats. Apache Doris ensures forward compatibility for these changes, allowing upgrades from old to new versions, but not downgrades. Therefore, it is recommended to backup data before upgrading to a major or minor version.

- Patch version (Z) offers full compatibility, supports upgrading and downgrading between new and old versions, and prevents data compatibility issues.

## How to choose a version

Apache Doris maintains two main version branches: Stable and Latest.

- The latest version includes the latest features, optimizations, and bug fixes, ideal for users who want to test new features, conduct POCs, performance testing, or test pre-launch environments.

- Stable version provides continuous bug fixes, ensuring greater stability and is recommended for production use.

## CPU Model and Binary Version

Apache Doris offers three binary versions:

- **x64 (avx2)**: for x86_64 CPUs supporting avx2 instructions.

- **x64 (no avx2)**: for x86_64 CPUs not supporting avx2.

- **ARM64**: for ARM architecture CPUs.

:::tip
You can check whether the CPU supports the avx2 instruction by running the command `cat /proc/cpuinfo |grep avx2`.
:::