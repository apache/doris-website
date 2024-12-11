---
title: Overview
language: en-US
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

## Overview

CCR (Cross Cluster Replication) is a cross-cluster data synchronization mechanism that synchronizes data changes from the source cluster to the target cluster at the database or table level. It is mainly used to improve data availability for online services, support read-write load isolation, and build a dual-region, three-center architecture.

### Use Cases

CCR is applicable to the following common scenarios:

- **Disaster Recovery and Backup**: Backing up enterprise data to another cluster and data center ensures that data can be restored or quickly switched to a backup in the event of business interruption or data loss. This high-SLA disaster recovery is commonly required in industries such as finance, healthcare, and e-commerce.

- **Read/Write Separation**: By isolating data query operations from data write operations, the impact between read and write processes is minimized, enhancing service availability. In high-concurrency or high-write-pressure scenarios, read/write separation helps to distribute the load effectively, improving database performance and stability.

- **Data Centralization**: Group headquarters need to centrally manage and analyze data from branch offices located in different regions, avoiding management confusion and decision-making errors caused by inconsistent data, thus improving the efficiency of group management and decision-making quality.

- **Isolated Upgrades**: During system cluster upgrades, CCR can be used to verify and test the new cluster to avoid rollback difficulties due to version compatibility issues. Users can upgrade each cluster incrementally while ensuring data consistency.

- **Cluster Migration**: When migrating a Doris cluster to a new data center or replacing hardware, CCR can be used to synchronize data from the old cluster to the new one, ensuring data consistency during the migration process.

### Job Types

CCR supports two types of jobs:

- **Database-Level Jobs**: Synchronize data for the entire database.
- **Table-Level Jobs**: Synchronize data for a specific table. Note that table-level synchronization does not support renaming or replacing tables. Additionally, Doris only supports one snapshot job running per database, so table-level full sync jobs must queue for execution.

## Principles and Architecture

### Terminology

- **Source Cluster**: The cluster where the data originates, typically where business data is written.
- **Target Cluster**: The cluster where the data is synchronized to in a cross-cluster setup.
- **Binlog**: The change log from the source cluster, containing schema and data changes.
- **Syncer**: A lightweight process responsible for synchronizing data.
- **Upstream**: In a database-level job, this refers to the source database; in a table-level job, it refers to the source table.
- **Downstream**: In a database-level job, this refers to the target database; in a table-level job, it refers to the target table.

### Architecture Overview

![CCR Architecture Overview](/images/ccr-architecture-description.png)

CCR relies primarily on a lightweight process called `Syncer`. `Syncer` fetch binlogs from the source cluster, apply the metadata to the target cluster, and instruct the target cluster to pull data from the source cluster, enabling full and incremental synchronization.

### Principles

1. **Full Synchronization**:
   - The CCR job first performs full synchronization, which copies all data from the upstream to the downstream in one complete operation.

2. **Incremental Synchronization**:
   - After full synchronization is complete, the CCR job continues with incremental synchronization, keeping the data between the upstream and downstream clusters consistent.

3. **Reinitiating Full Synchronization**:
   - If the job encounters a DDL operation that does not support incremental synchronization, the CCR job will restart full synchronization. For a list of DDL operations that do not support incremental synchronization, refer to [Feature Details](../feature.md).
   - If the upstream binlog is interrupted due to expiration or other reasons, the incremental synchronization will stop, triggering a restart of full synchronization.

4. **During Synchronization**:
   - Incremental synchronization will pause during the full synchronization process.
   - After full synchronization is completed, the downstream tables will undergo atomic replacement to ensure data consistency.
   - After full synchronization is complete, incremental synchronization will resume.

### Synchronization Modes

CCR supports four synchronization modes:

| Synchronization Mode | Principle                                               | Trigger Condition                                              |
|----------------------|---------------------------------------------------------|----------------------------------------------------------------|
| **Full Sync**         | Full backup of the upstream, restore on the downstream. DB-level jobs trigger DB backup, table-level jobs trigger table backup. | Initial synchronization or specific operations trigger this. See [Feature Details](../feature.md) for triggers. |
| **Partial Sync**      | Backup at the table or partition level from the upstream, restore at the same level on the downstream. | Specific operations trigger this. See [Feature Details](../feature.md) for triggers. |
| **TXN**               | Incremental data synchronization, downstream starts synchronization after upstream commit. | Specific operations trigger this. See [Feature Details](../feature.md) for triggers. |
| **SQL**               | Replaying upstream SQL operations on the downstream.    | Specific operations trigger this. See [Feature Details](../feature.md) for triggers. |
