---
{
    "title": "BITMAP_CONTAINS",
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

## 描述

计算输入值是否在 BITMAP 中，返回值是 boolean 值。

## 语法

```sql
BITMAP_CONTAINS(<bitmap>, <bigint>)
```

## 参数

| 参数         | 说明         |
|------------|------------|
| `<bitmap>` | BITMAP 集合  |
| `<bitint>` | 被判断是否存在的整数 |

## 返回值

返回一个 boolean
- 当参数存在空时，返回 NULL

## 举例

```sql
select bitmap_contains(to_bitmap(1),2) cnt1, bitmap_contains(to_bitmap(1),1) cnt2;
```

```text
+------+------+
| cnt1 | cnt2 |
+------+------+
|    0 |    1 |
+------+------+
```

