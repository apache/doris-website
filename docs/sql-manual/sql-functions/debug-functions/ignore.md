---
{
    "title": "IGNORE",
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

## ignore
### description

:::tip
For developer debugging only, do not call this function manually in the production environment.
:::

#### Syntax

`BOOLEAN ignore(T expr...)`

Returns `false` for any input.

### example

```sql
mysql> select m1, ignore(m1,m2,m1+m2,1) from t_nullable;
+------+----------------------------------------------------------------------+
| m1   | ignore(CAST(`m1` AS BIGINT), CAST(`m2` AS BIGINT), (`m1` + `m2`), 1) |
+------+----------------------------------------------------------------------+
|    1 |                                                                    0 |
+------+----------------------------------------------------------------------+

mysql> select ignore();
+----------+
| ignore() |
+----------+
|        0 |
+----------+
```

### keywords
    ignore