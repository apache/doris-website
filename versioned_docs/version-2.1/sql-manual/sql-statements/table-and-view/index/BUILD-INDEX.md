---
{
    "title": "BUILD INDEX",
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

Build an index for the entire table or table partitions. You must specify the table name and index name, and optionally specify the partition list.

## Syntax

```sql
BUILD INDEX <index_name> ON <table_name> [partition_list]
```

Where:

```sql
partition_list
  : PARTITION (<partition_name1>[ , parition_name2 ][ ... ])
```
## Required Parameters

**<index_name>**

> Specifies the identifier (name) of the index, which must be unique within its table.
>
> The identifier must start with a letter character (or any language character if unicode name support is enabled) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My Object`).
>
> The identifier cannot use reserved keywords.
>
> For more details, see Identifier Requirements and Reserved Keywords.

**<table_name>**

> Specifies the identifier (name) of the table, which must be unique within its database.
>
> The identifier must start with a letter character (or any language character if unicode name support is enabled) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My Object`).
>
> The identifier cannot use reserved keywords.
>
> For more details, see Identifier Requirements and Reserved Keywords.

## Optional Parameters

**<partition_list>**

> Specifies a list of partition identifiers (names) separated by commas, which must be unique within their table.
>
> The identifier must start with a letter character (or any language character if unicode name support is enabled) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My Object`).
>
> The identifier cannot use reserved keywords.
>
> For more details, see Identifier Requirements and Reserved Keywords.

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege  | Object | Notes                                        |
| :--------- | :----- | :------------------------------------------- |
| ALTER_PRIV | Table  | BUILD INDEX is an ALTER operation on a table |

## Usage Notes

- Currently only valid for inverted indexes, other indexes such as BloomFilter index are not valid.
- Currently only valid for compute-storage integrated mode, not valid for compute-storage separated mode.
- The progress of BUILD INDEX can be viewed through SHOW BUILD INDEX

## Examples

- Build index index1 on the entire table1.

  ```sql
  BUILD INDEX index1 ON TABLE table1
  ```

- Build index index1 on partitions p1 and p2 of table1.

  ```sql
  BUILD INDEX index1 ON TABLE table1 PARTITION(p1, p2)
  ```