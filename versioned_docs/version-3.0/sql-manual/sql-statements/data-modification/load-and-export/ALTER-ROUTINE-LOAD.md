---
{
    "title": "ALTER ROUTINE LOAD",
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

This syntax is used to modify an existing routine load job. Only jobs in PAUSED state can be modified.

## Syntax

```sql
ALTER ROUTINE LOAD FOR [<db>.]<job_name>
[<job_properties>]
FROM [<data_source>]
[<data_source_properties>]
```

## Required Parameters

**1. `[<db>.]<job_name>`**

> Specifies the name of the job to be modified. The identifier must begin with a letter character and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks.
>
> The identifier cannot use reserved keywords. For more details, please refer to identifier requirements and reserved keywords.

## Optional Parameters

**1. `<job_properties>`**

> Specifies the job parameters to be modified. Currently supported parameters include:
> 
> - desired_concurrent_number
> - max_error_number
> - max_batch_interval
> - max_batch_rows
> - max_batch_size
> - jsonpaths
> - json_root
> - strip_outer_array
> - strict_mode
> - timezone
> - num_as_string
> - fuzzy_parse
> - partial_columns
> - max_filter_ratio

**2. `<data_source_properties>`**

> Properties related to the data source. Currently supports:
> 
> - `<kafka_partitions>`
> - `<kafka_offsets>`
> - `<kafka_broker_list>`
> - `<kafka_topic>`
> - Custom properties, such as `<property.group.id>`

**3. `<data_source>`**

> The type of data source. Currently supports:
> 
> - KAFKA

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| LOAD_PRIV | Table | SHOW ROUTINE LOAD requires LOAD privilege on the table |

## Notes

- `kafka_partitions` and `kafka_offsets` are used to modify the offset of kafka partitions to be consumed, and can only modify currently consumed partitions. New partitions cannot be added.

## Examples

- Modify `desired_concurrent_number` to 1

    ```sql
    ALTER ROUTINE LOAD FOR db1.label1
    PROPERTIES
    (
        "desired_concurrent_number" = "1"
    );
    ```

- Modify `desired_concurrent_number` to 10, modify partition offsets, and modify group id

    ```sql
    ALTER ROUTINE LOAD FOR db1.label1
    PROPERTIES
    (
        "desired_concurrent_number" = "10"
    )
    FROM kafka
    (
        "kafka_partitions" = "0, 1, 2",
        "kafka_offsets" = "100, 200, 100",
        "property.group.id" = "new_group"
    );
    ```