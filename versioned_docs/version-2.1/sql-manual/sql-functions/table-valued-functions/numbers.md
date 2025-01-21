---
{
  "title": "NUMBERS",
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

Table function that generates a temporary table containing only one column with the column name `number` and all element values are `const_value` if `const_value` is specified, otherwise they are [0,`number`) incremented.

## Syntax
```sql
NUMBERS(
    "number" = "<number>"
    [, "<const_value>" = "<const_value>" ]
  );
```

## Required Parameters

| Field         | Description               |
|---------------|---------------------------|
| **number**    | The number of rows        |

## Optional Parameters

| Field             | Description                              |
|-------------------|------------------------------------------|
| **const_value**   | Specifies the constant value generated   |



## Return Value
| Field      | Type    | Description                     |
|----------------|---------|---------------------------------|
| **number**     | BIGINT  | The value returned for each row |


## Examples
```sql
select * from numbers("number" = "5");
```
```text
+--------+
| number |
+--------+
|      0 |
|      1 |
|      2 |
|      3 |
|      4 |
+--------+
```

```sql
select * from numbers("number" = "5", "const_value" = "-123");
```
```text
+--------+
| number |
+--------+
|   -123 |
|   -123 |
|   -123 |
|   -123 |
|   -123 |
+--------+
```