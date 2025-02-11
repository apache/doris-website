---
{
    "title": "ANALYZE",
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

This statement is used to collect column statistics. Statistics of columns can be collected for a table (specific columns can be specified) or for the entire database.

## Syntax

```sql
ANALYZE {TABLE <table_name> [ (<column_name> [, ...]) ] | DATABASE <database_name>}
    [ [ WITH SYNC ] [ WITH SAMPLE {PERCENT | ROWS} <sample_rate> ] ];
```

## Required Parameters

**1. `<table_name>`**

> The specified target table. This parameter and the <database_name> parameter must have and can only have one of them specified.

**2. `<database_name>`**

> The specified target database. This parameter and the <table_name> parameter must have and can only have one of them specified.

## Optional Parameters

**1. `<column_name>`**

> The specified target column. It must be an existing column in `table_name`. You can specify multiple column names separated by commas.

**2. `WITH SYNC`**

> Collect statistics synchronously. Returns after collection. If not specified, it executes asynchronously.

**3. `WITH SAMPLE {PERCENT | ROWS} <sample_rate>`**

> Specify to use the sampling method for collection. When not specified, full collection is the default. <sample_rate> is the sampling parameter. When using PERCENT sampling, it specifies the sampling percentage; when using ROWS sampling, it specifies the number of sampled rows.

## Return Value

| Column | Note           |
| -- |--------------|
| Job_Id | Unique Job Id           |
| Catalog_Name |   Catalog name           |
| DB_Name | database name           |
| Columns | column name list        |

## Access Control Requirements

The user who executes this SQL must have at least the following permissions:

| Privilege | Object | Notes                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | Table    | When executing ANALYZE, the SELECT_PRIV privilege for the queried table is required. |

## Examples

1. Collect statistics by sampling 10% of table lineitem.

```sql
ANALYZE TABLE lineitem WITH SAMPLE PERCENT 10;
```

2. Collect statistics by sampling 100,000 rows from table lineitem.

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;

