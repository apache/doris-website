---
{
    "title": "ARRAY_ZIP",
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

将所有数组合并成一个单一的数组。结果数组包含源数组中按参数列表顺序分组的相应元素。

## 语法

```sql
ARRAY_ZIP(<array1>, <array2>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<array1>` | 待合并的数组 |
| `<array2>` | 待合并的数组 |

## 返回值

返回来自源数组的元素分组成结构体的数组。结构体中的数据类型与输入数组的类型相同，并按照传递数组的顺序排列。

## 举例

```sql
SELECT ARRAY_ZIP(['a', 'b', 'c'], [1, 2, 3]);
```

```text
+--------------------------------------------------------+
| array_zip(['a', 'b', 'c'], [1, 2, 3])                  |
+--------------------------------------------------------+
| [{"1":"a", "2":1}, {"1":"b", "2":2}, {"1":"c", "2":3}] |
+--------------------------------------------------------+
```
