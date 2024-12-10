---
{
    "title": "Model Overview",
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


This topic introduces the data models in Doris from a logical perspective so you can make better use of Doris in different business scenarios.

## Basic Concepts

This document mainly describes the data model of Doris from a logical perspective, aiming to assist users in better utilizing Doris for different scenarios.

In Doris, data is logically represented in the form of tables. A table comprises Rows and Columns. Row represents a single data entry from the user. This row contains a set of related values that represent different attributes or fields, which are defined by the columns (Column) of the table.

Columns can be broadly categorized into two types: Key and Value. From a business perspective, Key and Value can correspond to dimension columns and metric columns, respectively. In Doris, the Key columns are those specified in the table creation statement. The columns that follow the keywords `unique key`, `aggregate key`, or `duplicate key` in the table creation statement are considered Key columns, while the remaining columns are Value columns.

The data models in Doris are classified into three types:

- Duplicate: This data model allows for storing duplicate rows based on the specified key columns. It is suitable for scenarios where preserving all the original data records is essential.

- Unique: In this data model, each row is uniquely identified by the combination of values in the key columns. This ensures that no duplicate rows exist for a given set of key values. It is suitable for scenarios where data needs updating.

- Aggregate: This model enables the aggregation of data based on the key columns. It is commonly used for scenarios where summary or aggregated information, such as totals or averages, is required.

