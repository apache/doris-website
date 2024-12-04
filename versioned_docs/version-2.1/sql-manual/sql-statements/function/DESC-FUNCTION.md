---
{
    "title": "DESC FUNCTION",
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

Use the desc function table_valued_function to obtain the schema information for the corresponding table-valued function.

## Syntax

```sql
DESC FUNCTION <table_valued_function>
```

## Required Parameters

**<table_valued_function>**

> table_valued_function, the name of the table-valued function, such as CATALOGS. For a list of supported table-valued functions, please refer to the "[Table-Valued Functions](https://doris.apache.org/en/docs/dev/sql-manual/sql-functions/table-valued-functions/s3/)" section

## Examples

Query the information of the table-valued function CATALOGS:

```sql
DESC FUNCTION catalogs();
```

The result is as follows:

```sql
+-------------+--------+------+-------+---------+-------+
| Field       | Type   | Null | Key   | Default | Extra |
+-------------+--------+------+-------+---------+-------+
| CatalogId   | bigint | No   | false | NULL    | NONE  |
| CatalogName | text   | No   | false | NULL    | NONE  |
| CatalogType | text   | No   | false | NULL    | NONE  |
| Property    | text   | No   | false | NULL    | NONE  |
| Value       | text   | No   | false | NULL    | NONE  |
+-------------+--------+------+-------+---------+-------+
```
