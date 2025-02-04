---
{
    "title": "BITMAP_HASH64",
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

对任意类型的输入计算 64 位的哈希值，返回包含该哈希值的 Bitmap。

## 语法

```sql
bitmap_hash64(<expr>)
```

## 参数

| 参数        | 描述          |
|-----------|-------------|
| `<expr>` | 任何值或字段表达式 |

## 返回值

包含参数 `<expr>` 的 64 位 hash 值的 Bitmap。

## 示例

计算一个值的 64 位哈希值，你可以使用：

```sql
select bitmap_to_string(bitmap_hash64('hello'));
```

结果如下：

```text
+------------------------------------------+
| bitmap_to_string(bitmap_hash64('hello')) |
+------------------------------------------+
| 15231136565543391023                     |
+------------------------------------------+
```
