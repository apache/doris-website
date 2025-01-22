---
{
    "title": "LEFT",
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

返回字符串 s 中从左侧开始具有指定偏移量的子字符串。

## 语法

```sql
LEFT ( <str> , <offset> )
```

## 参数

| 参数         | 说明            |
|------------|---------------|
| `<str>`    | 需要查找的字符串      |
| `<offset>` | 需要从左侧开始计算的偏移量 |


## 返回值

字符串 `<str>` 中从左侧开始具有指定偏移量的子字符串。

## 举例

```sql
SELECT LEFT('Hello', 3)
```

```text
+------------------+
| left('Hello', 3) |
+------------------+
| Hel              |
+------------------+
```
