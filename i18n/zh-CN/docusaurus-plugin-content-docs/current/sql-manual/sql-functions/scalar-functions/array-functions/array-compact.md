---
{
    "title": "ARRAY_COMPACY",
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

从数组中删除连续地重复元素，结果值的顺序由源数组中的顺序决定。

## 语法
```sql
ARRAY_COMPACT(<arr>)
```

## 参数
| 参数 | 说明 |
|---|---|
| `<arr>` | The array to calculate the average values from |

## 返回值
不存在连续重复元素的数组。

## 举例
```sql
select array_compact([1, 2, 3, 3, null, null, 4, 4]);
```
```text
+----------------------------------------------------+
| array_compact(ARRAY(1, 2, 3, 3, NULL, NULL, 4, 4)) |
+----------------------------------------------------+
| [1, 2, 3, NULL, 4]                                 |
+----------------------------------------------------+
```
```sql
select array_compact(['aaa','aaa','bbb','ccc','ccccc',null, null,'dddd']);
```
```text
+-------------------------------------------------------------------------------+
| array_compact(ARRAY('aaa', 'aaa', 'bbb', 'ccc', 'ccccc', NULL, NULL, 'dddd')) |
+-------------------------------------------------------------------------------+
| ['aaa', 'bbb', 'ccc', 'ccccc', NULL, 'dddd']                                  |
+-------------------------------------------------------------------------------+
```
```sql
select array_compact(['2015-03-13','2015-03-13']);
```
```text
+--------------------------------------------------+
| array_compact(ARRAY('2015-03-13', '2015-03-13')) |
+--------------------------------------------------+
| ['2015-03-13']                                   |
+--------------------------------------------------+
```