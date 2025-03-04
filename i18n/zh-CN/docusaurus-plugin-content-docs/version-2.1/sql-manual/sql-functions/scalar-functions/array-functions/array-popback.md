---
{
    "title": "ARRAY_POPBACK",
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

返回移除最后一个元素后的数组，如果输入参数为 NULL，则返回 NULL

## 语法

```sql
ARRAY_POPBACK(<arr>)
```

## 参数

| 参数 | 说明 | 
| --- | --- |
| `<arr>` | ARRAY 数组 |

## 返回值

返回移除最后一个元素后的数组。特殊情况：
- 如果输入参数为 NULL，则返回 NULL

## 举例

```sql
select array_popback(['test', NULL, 'value']);
```

```text
+-----------------------------------------------------+
| array_popback(ARRAY('test', NULL, 'value'))         |
+-----------------------------------------------------+
| ["test", NULL]                                        |
+-----------------------------------------------------+
```
