---
{
    "title": "NULLABLE",
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

## nullable
### description

:::tip
仅供开发者调试用，请勿在生产环境手动调用该函数。
:::

#### Syntax

`T nullable(T expr)`

转换 `expr` 为 nullable 属性，若 `expr` 已经是 nullable 的，则为其本身。

### example

```sql
mysql> select k1, nullable(k1), nullable(1) from test_nullable_functions order by k1;
+------+--------------+-------------+
| k1   | nullable(k1) | nullable(1) |
+------+--------------+-------------+
| NULL |         NULL |           1 |
|    1 |            1 |           1 |
|    2 |            2 |           1 |
|    3 |            3 |           1 |
|    4 |            4 |           1 |
+------+--------------+-------------+
```

### keywords
    nullable