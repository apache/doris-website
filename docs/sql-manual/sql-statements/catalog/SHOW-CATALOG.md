---
{
    "title": "SHOW CATALOGS",
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

This statement is used for view created catalogs

## Syntax

```sql
SHOW CATALOGS [LIKE <catalog_name>]
```

illustrate:

1. LIKE: Fuzzy query can be performed according to the catalog name


## Return Value

| Column Name    | Description |
|---|---|
| CatalogId      | Unique ID of the data catalog |
| CatalogName    | Name of the data catalog. The default built-in catalog is named "internal" and cannot be modified. |
| Type           | Type of the data catalog |
| IsCurrent      | Indicates whether it is the currently active data catalog |
| CreateTime     | Creation time  |
| LastUpdateTime | Last updated time |
| Comment        | comments about the catalog |


## Examples

1. View the data catalogs that have been created currently

   ```sql
   SHOW CATALOGS;
   ```
   ```sql
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    | CatalogId | CatalogName | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    |    130100 | hive        | hms      |           | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
    |         0 | internal    | internal | yes       | UNRECORDED              | NULL                | Doris internal catalog |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    ```

2. Fuzzy query by catalog name

   ```sql
   SHOW CATALOGS LIKE 'hi%';
   ```
    ```sql
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    | CatalogId | CatalogName | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    |    130100 | hive        | hms      |           | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
   ```