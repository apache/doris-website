---
{
    "title": "LLM_TRANSLATE",
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

用于将文本翻译为特定语言

## 语法


```sql
LLM_TRANSLATE([<resource_name>], <text>, <target_language>)
```

## 参数

|    参数    | 说明 |
| ---------- | -------- |
| `<resource_name>`| 指定的资源名称|
| `<text>`   | 文本   |
| `<target_language>`   | 目标语言 |

## 返回值

返回翻译后的文本字符串

当输入有值为 NULL 时返回 NULL

结果为大模型生成，所以返回内容并不固定

## 示例

```sql
SET default_llm_resource = 'resourse_name';
SELECT LLM_TRANSLATE('In my mind, doris is the best databases management system.', 'zh-CN') AS Result;
```
```text
+-------------------------------------------------+
| Result                                          |
+-------------------------------------------------+
| 在我心目中，Doris是最棒的数据库管理系统。       |
+-------------------------------------------------+
```

```sql
SELECT LLM_Translate('resource_name', 'This is an example', 'Franch') AS Result;
```
```text
+------------------+
| Result           |
+------------------+
| Voici un exemple |
+------------------+
```