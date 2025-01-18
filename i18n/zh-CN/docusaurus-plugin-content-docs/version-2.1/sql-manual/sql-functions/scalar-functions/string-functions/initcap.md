---
{
    "title": "INITCAP",
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

将参数中包含的单词首字母大写，其余字母转为小写。单词是由非字母数字字符分隔的字母数字字符序列。

## 语法

```sql
INITCAP ( <str> )
```

## 参数

| 参数      | 说明        |
|---------|-----------|
| `<str>` | 需要被转化的字符串 |

## 返回值

参数 `<str>` 中单词首字母大写，其余字母小写的结果。

## 举例

```sql
SELECT INITCAP('hello hello.,HELLO123HELlo')
```

```text
+---------------------------------------+
| initcap('hello hello.,HELLO123HELlo') |
+---------------------------------------+
| Hello Hello.,hello123hello            |
+---------------------------------------+
```