---
{
    "title": "NON_NULLABLE",
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

## non_nullable
### description

:::tip
For developer debugging only, do not call this function manually in the production environment.
:::

#### Syntax

`T non_nullable(T expr)`

Raise an error if `expr` is of not nullable, or is of nullable and contains a `NULL` value. Otherwise, returns the non-nullable data column of the input column.

### example

```sql
mysql> select k1, non_nullable(k1) from test_nullable_functions order by k1;
+------+------------------+
| k1   | non_nullable(k1) |
+------+------------------+
|    1 |                1 |
|    2 |                2 |
|    3 |                3 |
|    4 |                4 |
+------+------------------+

mysql> select k1, non_nullable(k1) from test_nullable_functions order by k1;
ERROR 1105 (HY000): errCode = 2, detailMessage = [CANCELLED]There's NULL value in column Nullable(Int32) which is illegal for non_nullable
mysql> select non_nullable(1);
ERROR 1105 (HY000): errCode = 2, detailMessage = [CANCELLED]Try to use originally non-nullable column Int8 in nullable's non-nullable convertion.
```

### keywords
    non_nullable