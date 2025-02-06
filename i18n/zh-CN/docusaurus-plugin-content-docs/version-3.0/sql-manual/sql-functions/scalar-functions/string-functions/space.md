---
{
    "title": "SPACE",
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

生成由指定数量的空格组成的字符串。

## 语法

```sql
SPACE ( <len> )
```

## 参数

| 参数      | 说明        |
|---------|-----------|
| `<len>` | 要生成的空格的数量 |

## 返回值

返回指定数量的空格组成的字符串。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL
- `<len>`小于 0 时，返回空字符串

## 举例

```sql
SELECT space(10);
```

```text
+------------+
| space(10)  |
+------------+
|            |
+------------+
```

```sql
SELECT space(null);
```

```text
+-------------+
| space(NULL) |
+-------------+
| NULL        |
+-------------+
```
