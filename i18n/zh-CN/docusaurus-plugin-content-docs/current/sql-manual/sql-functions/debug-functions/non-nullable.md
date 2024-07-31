---
{
    "title": "NON_NULLABLE",
    "language": "zh-CN"
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
仅供开发者调试用，请勿在生产环境手动调用该函数。
:::

#### Syntax

`T non_nullable(T expr)`

如果 `expr` 为非 nullable 类型，或为 nullable 类型且其中包含 `NULL` 值，则报错。否则返回该列的非 nullable 属性数据列。

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