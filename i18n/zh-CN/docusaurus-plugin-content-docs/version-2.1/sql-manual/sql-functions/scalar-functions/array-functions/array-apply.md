---
{
    "title": "ARRAY_APPLY",
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
数组以特定的二元条件符过滤元素，并返回过滤后的结果

## 语法

```sql
ARRAY_APPLY(<arr>, <op>, <val>)
```

## 参数
| 参数 | 说明 |
|---|---|
| `<arr>` | 输入的数组 |
| `<op>` | 过滤条件，条件包括 `=`, `>=`, `<=`, `>`, `<`, `!=`|
| `<val>` | 过滤的条件值，如果是 null，则返回 null，仅支持常量 |

## 返回值
过滤后的数组

## 举例

```sql
select array_apply([1, 2, 3, 4, 5], ">=", 2);
```
```text
+--------------------------------------------+
| array_apply(ARRAY(1, 2, 3, 4, 5), '>=', 2) |
+--------------------------------------------+
| [2, 3, 4, 5]                               |
+--------------------------------------------+
```
```sql
select array_apply([1000000, 1000001, 1000002], "=", "1000002");
```
```text
+-------------------------------------------------------------+
| array_apply(ARRAY(1000000, 1000001, 1000002), '=', 1000002) |
+-------------------------------------------------------------+
| [1000002]                                                   |
+-------------------------------------------------------------+
```