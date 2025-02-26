---
{
    "title": "ARRAYS_OVERLAP",
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

判断 left 和 right 数组中是否包含公共元素

## 语法

```sql
ARRAYS_OVERLAP(<left>, <right>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<left>` | 待判断的数组 |
| `<right>` | 带判断的数组 |

## 返回值

返回判断结果：1：left 和 right 数组存在公共元素；0：left 和 right 数组不存在公共元素；NULL：left 或者 right 数组为 NULL；或者 left 和 right 数组中，任意元素为 NULL

## 举例

```sql
SELECT ARRAYS_OVERLAP(['a', 'b', 'c'], [1, 2, 'b']);
```

```text
+--------------------------------------------------+
| arrays_overlap(['a', 'b', 'c'], ['1', '2', 'b']) |
+--------------------------------------------------+
|                                                1 |
+--------------------------------------------------+
```
