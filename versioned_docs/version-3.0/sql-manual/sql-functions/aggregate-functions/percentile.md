---
{
    "title": "PERCENTILE",
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

### Description
#### Syntax

`PERCENTILE(expr, DOUBLE p)`

Calculates the exact percentile for small amounts of data. The specified columns are sorted in descending order and then the exact `p` percentile is taken. The value of `p` is between `0` and `1`.
If `p` does not point to an exact position, the linear interpolation of the values adjacent to either side of the pointed position at the position pointed to by `p` is returned. Note that this is not an average of the two numbers.

Parameters:
`expr`: required. The value is an integer (`bigint` at most).
`p`: required. The const value is `[0.0,1.0]`.

:::tip
Since version Doris 3.0.3, expr supports more input types, such as float and double. This enables floating-point data to participate in calculations, reducing the overhead of casting data.
:::

### Example

```sql
MySQL > select `table`, percentile(cost_time,0.99) from log_statis group by `table`;
+---------------------+---------------------------+
| table    |         percentile(`cost_time`, 0.99)|
+----------+--------------------------------------+
| test     |                                54.22 |
+----------+--------------------------------------+

MySQL > select percentile(NULL,0.3) from table1;
+-----------------------+
| percentile(NULL, 0.3) |
+-----------------------+
|                  NULL |
+-----------------------+
```

### Keywords
    PERCENTILE
