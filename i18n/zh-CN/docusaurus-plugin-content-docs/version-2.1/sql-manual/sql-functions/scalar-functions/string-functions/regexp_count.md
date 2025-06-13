---
{
    "title": "REGEXP_COUNT",
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

返回字符串'str'匹配正则表达式'patter'的'int'值的数量



## 语法

```sql
REGEXP_COUNT(<str>, <pattern>)
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<str>` | 匹配正则表达式的字符串.|
| `<pattern>` | 正则表达式 |
## 返回值

返回字符串匹配正则表达式的数量

## 例子

```sql
SELECT regexp_count('a.b:c;d', '[\\\\.:;]');;
```

```text
+--------------------------------------+
| regexp_count('a.b:c;d', '[\\\\.:;]') |
+--------------------------------------+
|                                    3 |
+--------------------------------------+
```