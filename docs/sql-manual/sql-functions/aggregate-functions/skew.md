---
{
    "title": "SKEW,SKEW_POP,SKEWNESS",
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

Returns the [skewness](https://en.wikipedia.org/wiki/Skewness) of the expr expression.
The forumula used for this function is `3-th centrol moment / ((variance)^{1.5})`, when variance is zero, `SKEWNESS` will return `NULL`.

**Related Commands**

[kurt](./kurt.md)

## Alias

- SKEW
- SKEW_POP

## Syntax

```sql
SKEWNESS(<col>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<col>` | The column to be calculated skewness |

## Return Value

Returns the skewness of the expr expression, which is a `Double` type.

## Examples
```sql
CREATE TABLE statistic_test(
    tag int, 
    val1 double not null, 
    val2 double null
) DISTRIBUTED BY HASH(tag)
PROPERTIES (
    "replication_num"="1"
);

INSERT INTO statistic_test VALUES
(1, -10, -10),
(2, -20, NULL),
(3, 100, NULL),
(4, 100, NULL),
(5, 1000,1000);

-- NULL is ignored
SELECT 
  skew(val1), 
  skew(val2)
FROM statistic_test;
```

```text
+--------------------+------------+
| skew(val1)         | skew(val2) |
+--------------------+------------+
| 1.4337199628825619 |          0 |
+--------------------+------------+
```

```sql
-- Each group just has one row, result is NULL
SELECT 
  skew(val1), 
  skew(val2) 
FROM statistic_test
GROUP BY tag;
```

```text
+------------+------------+
| skew(val1) | skew(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
```