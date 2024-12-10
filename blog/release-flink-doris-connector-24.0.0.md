---
{
    'title': "Apache Doris Flink Connector 24.0.0  just released!",
    'description': "Dear community, We are excited to announce the official release of Apache Doris Flink Connector version 24.0.0 on September 5th, 2024.",
    'summary': "Dear community, We are excited to announce the official release of Apache Doris Flink Connector version 24.0.0 on September 5th, 2024.",
    'date': '2024-09-25',
    'author': 'Apache Doris',
    'tags': ['Release Notes'],
    "image": '/images/release-flink-doris-connector-24.0.jpg'
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

Dear community, We are excited to announce the official release of Apache Doris Flink Connector version 24.0.0 on September 5th, 2024. This release brings several enhancements and new capabilities, including support for Flink 1.20 and high-speed data retrieval from Doris via Arrow Flight SQL. Additionally, the FlinkCDC version required for full database synchronization has been upgraded to 3.1.x for optimal performance.

- Download Link: https://github.com/apache/doris-flink-connector/releases/tag/24.0.0

## Behavioral Changes

- FlinkCDC Upgrade: To leverage the full potential of this release, the FlinkCDC version used for full database synchronization must be upgraded to 3.1.x. Due to the incompatibility between FlinkCDC 3.1.x and earlier versions (e.g., 2.4), running full database synchronization jobs will require a stateless restart after upgrading FlinkCDC. Please refer to the [Apache Flink CDC 3.1.0 Release Announcement](https://mp.weixin.qq.com/s/qYW5Bw0IqUHUc8bnfWOIog) for details on compatibility.

- Version Renaming: To maintain consistency with other Connectors (e.g., Spark and Kafka) and account for the aforementioned incompatibilities, the Connector version has been renamed to the 24.x series. See the discussion thread [DISCUSS\] About the next version change of Connector](https://lists.apache.org/thread/8tp215yk0tkgtdfkjdl4svvbljnmxzst) for more information.

## New Features

- Supported Flink v1.20.

- DB2 Database synchronization is supported.

- CDC Schema Change enhancement supported the use of the JSQLParser framework for DDL.

- Supported Stream Load with GZ compression.

- Enabled Arrow Flight SQL integration for high-speed data retrieval from Doris.

## Improvements

- Upgraded FlinkCDC  to 3.1.1.

- JDBC parameter configuration for DB2/Postgres/SQLServer synchronization.

- Optimized batch writing mode.

- Refined CDC synchronization logic.

- Supported MySQL full database synchronization with `INTEGER` type.

## Bug Fixes

- Resolved serialization issues with `MAP` subtypes of `DATE`/ `DATETIME`

- Fixed FlinkSQL projection pushdown bugs

- Resolved `DECIMAL` type sync issues with MongoDB

- Compatibility update for Doris arrow-based timestamp reading

- Fixed non-effective delete events in CDC full database synchronization

- Corrected schema change logic when default values are null

## Credits

@bingquanzhao、@DongLiang-0、@JasonLeeCoding、@JNSimba@MaoMiMao、@qg-lin@tmc9031、@vinlee19