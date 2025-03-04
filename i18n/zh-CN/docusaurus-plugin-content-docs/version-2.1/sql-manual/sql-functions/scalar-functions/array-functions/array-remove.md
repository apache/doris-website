---
{
    "title": "ARRAY_REMOVE",
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

移除数组中所有的指定元素

## 语法

```sql
ARRAY_REMOVE(<arr>, <val>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<arr>` | 对应数组 |
| `<val>` | 指定元素 |

## 返回值

返回移除所有的指定元素后的数组，如果输入参数为 NULL，则返回 NULL

## 举例

```sql
SELECT ARRAY_REMOVE(['test', NULL, 'value'], 'value');
```

```text
+------------------------------------------------+
| array_remove(['test', NULL, 'value'], 'value') |
+------------------------------------------------+
| ["test", null]                                 |
+------------------------------------------------+
```
