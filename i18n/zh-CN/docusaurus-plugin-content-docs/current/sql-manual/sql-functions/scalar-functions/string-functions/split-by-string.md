---
{
    "title": "SPLIT_BY_STRING",
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

将输入字符串按照指定的字符串拆分成字符串数组。

## 语法

```sql
SPLIT_BY_STRING ( <str>, <separator> )
```

## 参数

| 参数            | 说明        |
|---------------|-----------|
| `<str>`       | 需要分割的字符串  |
| `<separator>` | 用于分割的字符串 |

## 返回值

返回按照指定的字符串拆分成字符串数组。特殊情况：

- 任意两个参数中有一个为 NULL，则返回 NULL
- `<separator>`为空字符串时，`<str>`会按字节进行拆分

## 举例

```sql
SELECT split_by_string('hello','l');
```

```text
+-------------------------------+
| split_by_string('hello', 'l') |
+-------------------------------+
| ["he", "", "o"]               |
+-------------------------------+
```

```sql
SELECT split_by_string('hello','');
```

```text
+------------------------------+
| split_by_string('hello', '') |
+------------------------------+
| ["h", "e", "l", "l", "o"]    |
+------------------------------+
```
