---
{
    "title": "FROM_BASE64",
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

返回对输入的字符串进行Base64解码后的结果。特殊情况:

- 当输入字符串不正确时（出现非Base64编码后可能出现的字符串）将会返回NULL

## 语法

```sql
from_base64(VARCHAR str)
```

## 参数

| 参数 | 说明              |
| -- |-----------------|
| `str` | 需要被Base64解码的字符串 |

## 返回值

参数 str 通过Base64解码后的结果。 特殊情况：

- 当输入字符串不正确时（出现非Base64编码后可能出现的字符串）将会返回NULL

## 举例

```sql
select from_base64('MQ=='),from_base64('MjM0'),from_base64(NULL)
```

```text
+---------------------+---------------------+-------------------+
| from_base64('MQ==') | from_base64('MjM0') | from_base64(NULL) |
+---------------------+---------------------+-------------------+
| 1                   | 234                 | NULL              |
+---------------------+---------------------+-------------------+
```