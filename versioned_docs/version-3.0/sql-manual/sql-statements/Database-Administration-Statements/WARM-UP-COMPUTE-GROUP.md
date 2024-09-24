---
{
    "title": "WARM UP COMPUTE GROUP",
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

## Description

The WARM UP COMPUTE GROUP statement is used to warm up data in a compute group to improve query performance. The warming operation can either retrieve resources from another compute group or specify particular tables and partitions for warming. The warming operation returns a job ID that can be used to track the status of the warming job.

## Syntax

```sql
WARM UP COMPUTE GROUP <destination_compute_group_name> WITH COMPUTE GROUP <source_compute_group_name>;

WARM UP COMPUTE GROUP <destination_compute_group_name> WITH <warm_up_list>;

warm_up_list ::= warm_up_item [AND warm_up_item...];

warm_up_item ::= TABLE <table_name> [PARTITION <partition_name>];

```

## Parameters

* destination_compute_group_name: The name of the destination compute group that is to be warmed up.

* source_compute_group_name(Optional) The name of the source cluster from which resources will be warmed up.

* warm_up_list: (Optional) A list of specific items to warm up, which can include tables and partitions.

* table_name: The name of the table is used to warmup.

* partition_name: The name of the partition is used to warmup.

## Return Values

* JobId: the id of warm-up job.

## Example

1. Warm up a compute group named destination_group_name with a compute group named source_group_name.

```sql
   WARM UP COMPUTE GROUP destination_group_name WITH COMPUTE GROUP source_group_name;

```

2. Warm up a compute group named destination_group with table sales_data and customer_info and partition q1_2024 of table orders .

```
    WARM UP COMPUTE GROUP destination_group WITH 
        TABLE sales_data 
        AND TABLE customer_info 
        AND TABLE orders PARTITION q1_2024;

```

## Keywords

    WARM UP, COMPUTE GROUP, CACHE
