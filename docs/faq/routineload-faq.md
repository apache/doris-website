---
{
    "title": "Routine Load FAQ",
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

# Routine Load FAQ

This document records common issues, bug fixes, and optimization improvements related to Routine Load in Doris. It will be updated periodically.

## Major Bug Fixes

| Issue Description                                           | Trigger Conditions                          | Impact Scope      | Temporary Solution                                         | Affected Versions | Fixed Versions | Fix PR                                                     |
| ----------------------------------------------------------- | ------------------------------------------- | ----------------- | ---------------------------------------------------------- | ----------------- | -------------- | ---------------------------------------------------------- |
| When at least one job times out while connecting to Kafka, it affects the import of other jobs, slowing down global Routine Load imports. | At least one job times out while connecting to Kafka. | Shared-nothing and shared-storage | Stop or manually pause the job to resolve the issue.        | <2.1.9 <3.0.5    | 2.1.9 3.0.5   | [#47530](https://github.com/apache/doris/pull/47530)       |
| User data may be lost after restarting the FE Master.       | The job's offset is set to OFFSET_END, and the FE is restarted. | Shared-storage     | Change the consumption mode to OFFSET_BEGINNING.           | 3.0.2-3.0.4      | 3.0.5          | [#46149](https://github.com/apache/doris/pull/46149)       |
| A large number of small transactions are generated during import, causing compaction to fail and resulting in continuous -235 errors. | Doris consumes data too quickly, or Kafka data flow is in small batches. | Shared-nothing and shared-storage | Pause the Routine Load job and execute the following command: `ALTER ROUTINE LOAD FOR jobname FROM kafka ("property.enable.partition.eof" = "false");` | <2.1.8 <3.0.4    | 2.1.8 3.0.4   | [#45528](https://github.com/apache/doris/pull/45528), [#44949](https://github.com/apache/doris/pull/44949), [#39975](https://github.com/apache/doris/pull/39975) |
| Kafka third-party library destructor hangs, causing data consumption to fail. | Kafka topic deletion (possibly other conditions). | Shared-nothing and shared-storage | Restart all BE nodes.                                       | <2.1.8 <3.0.4    | 2.1.8 3.0.4   | [#44913](https://github.com/apache/doris/pull/44913)       |
| Routine Load scheduling hangs.                              | Timeout occurs when FE aborts a transaction in Meta Service. | Shared-storage     | Restart the FE node.                                        | <3.0.2           | 3.0.2          | [#41267](https://github.com/apache/doris/pull/41267)       |
| Routine Load restart issue.                                | Restarting BE nodes.                         | Shared-nothing and shared-storage | Manually resume the job.                                    | <2.1.7 <3.0.2    | 2.1.7 3.0.2   | [#3727](https://github.com/selectdb/selectdb-core/pull/3727) |

## Default Configuration Optimizations

| Optimization Content                        | Applied Versions | Corresponding PR                                            |
| ------------------------------------------- | ---------------- | ---------------------------------------------------------- |
| Increased the timeout duration for Routine Load. | 2.1.7 3.0.3      | [#42042](https://github.com/apache/doris/pull/42042), [#40818](https://github.com/apache/doris/pull/40818) |
| Adjusted the default value of `max_batch_interval`. | 2.1.8 3.0.3      | [#42491](https://github.com/apache/doris/pull/42491)       |
| Removed the restriction on `max_batch_interval`. | 2.1.5 3.0.0      | [#29071](https://github.com/apache/doris/pull/29071)       |
| Adjusted the default values of `max_batch_rows` and `max_batch_size`. | 2.1.5 3.0.0      | [#36632](https://github.com/apache/doris/pull/36632)       |

## Observability Optimizations

| Optimization Content         | Applied Versions | Corresponding PR                                            |
| ---------------------------- | ---------------- | ---------------------------------------------------------- |
| Added observability-related metrics. | 3.0.5           | [#48209](https://github.com/apache/doris/pull/48209), [#48171](https://github.com/apache/doris/pull/48171), [#48963](https://github.com/apache/doris/pull/48963) |
