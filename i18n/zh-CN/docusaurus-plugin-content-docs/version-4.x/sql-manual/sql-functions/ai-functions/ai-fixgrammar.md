---
{
    "title": "AI_FIXGRAMMAR",
    "language": "zh-CN",
    "description": "用于修复文本中的语法错误"
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

用于修复文本中的语法错误

## 语法


```sql
AI_FIXGRAMMAR([<resource_name>], <text>)
```

## 参数

|    参数    | 说明 |
| ---------- | -------- |
| `<resource_name>`| 指定的资源名称，可空|
| `<text>`   | 需要修复语法的文本 |

## 返回值

返回修复语法后的文本字符串

当输入有值为 NULL 时返回 NULL

结果为大模型生成，所以返回内容并不固定

## 示例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_FIXGRAMMAR('Apache Doris a great system DB') AS Result;
```
```text
+------------------------------------------+
| Result                                   |
+------------------------------------------+
| Apache Doris is a great database system. |
+------------------------------------------+
```

```sql
SELECT AI_FIXGRAMMAR('resource_name', 'I am like to using Doris') AS Result;
```
```text
+--------------------+
| Result             |
+--------------------+
| I like using Doris |
+--------------------+
```