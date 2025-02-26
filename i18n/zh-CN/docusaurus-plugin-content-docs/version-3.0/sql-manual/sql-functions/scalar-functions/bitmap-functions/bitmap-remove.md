---
{
    "title": "BITMAP_REMOVE",
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

从 Bitmap 列中删除指定的值。

## 语法

```sql
bitmap_remove(<bitmap>, <value>)
```

## 参数

| 参数        | 描述       |
|-----------|----------|
| `<bitmap>` | Bitmap 值 |
| `<value>` | 要删除的值    |

## 返回值

删除后的 Bitmap。  

若要删除的值不存在，则返回原 Bitmap；  
若要删除的值为 `NULL`, 则返回 `NULL`。

## 示例

从 Bitmap 中移除一个值：

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), 3)) res;
```

结果如下：

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

从 Bitmap 中移除一个 `NULL` 值：

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), null)) res;
```

结果如下：

```text
+------+
| res  |
+------+
| NULL |
+------+
```
