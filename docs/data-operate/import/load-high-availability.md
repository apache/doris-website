---
{
    "title": "Load High Availability",
    "language": "en-US"
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

# Load High Availability

## Overview

Doris provides various mechanisms to ensure high availability during data import. This article will detail Doris's default import behavior and additional options for improving import availability, especially the minimum write replica number feature.

## Majority Write

By default, Doris adopts a majority write strategy to ensure data reliability and consistency:

- An import is considered successful when the number of successfully written replicas exceeds half of the total number of replicas.
- For example, for a table with three replicas, at least two replicas must be successfully written for the import to be considered successful.

### How It Works

1. Data Distribution: The import task first distributes data to all relevant BE nodes.

2. Parallel Writing: Each BE node processes data writing operations in parallel.

3. Write Confirmation: After completing the data write, each BE node sends a confirmation to the FE.

4. Majority Judgment: The FE counts the number of successfully written replicas, and considers the import successful when a majority is reached.

5. Transaction Commit: The FE commits the import transaction, making the data visible externally.

6. Asynchronous Replication: For replicas that were not successfully written, the system will asynchronously replicate data in the background to ensure eventual consistency across all replicas.

The majority write strategy is Doris's balance between data reliability and system availability. For scenarios with special requirements, Doris provides other options such as the minimum write replica number to further enhance system flexibility.

## Minimum Write Replica Number

While the majority write strategy ensures data reliability, it may affect system availability in certain scenarios. For example, in a two-replica situation, both replicas must be successfully written to complete the import, meaning no replica is allowed to be unavailable during the import process.

To address this issue and improve import availability, Doris provides the Min Load Replica Num option.

### Feature Description

The minimum write replica number allows users to specify the minimum number of replicas that need to be successfully written during data import. The import is considered successful when the number of successfully written replicas is greater than or equal to this value.

### Use Cases

- When some nodes are unavailable, but data import still needs to be guaranteed.

- When there are high requirements for data import speed, and users are willing to sacrifice some reliability for higher availability.

### Configuration Methods

#### Single Table Configuration

1. Set when creating a table:

```sql
CREATE TABLE example_table
(
id INT,
name STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES
(
'replication_num' = '3',
'min_load_replica_num' = '2'
);
```

2. Modify an existing table:

```sql
ALTER TABLE example_table
SET ( 'min_load_replica_num' = '2' );
```

#### Global Configuration
Set through the FE configuration item `min_load_replica_num`.

- Valid values: greater than 0

- Default value: -1 (indicating that the global minimum write replica number is not enabled)

Priority: Table property > Global configuration > Default majority rule

If the table property is not set or invalid, and the global configuration is valid, the minimum write replica number for the table is:

`min(FE configured min_load_replica_num, table's replica number/2 + 1)`

For viewing and modifying FE configuration items, please refer to the [FE Configuration Document](../../admin-manual/config/fe-config.md).

## Other High Availability Mechanisms

In addition to the minimum write replica number option, Doris also adopts the following mechanisms to improve import availability:

1. Import Retry: Automatically retry failed import tasks caused by temporary failures.

2. Load Balancing: Distribute import tasks to different BE nodes to avoid excessive pressure on a single point.

3. Transaction Mechanism: Ensure data consistency, automatically rollback in case of failure.

