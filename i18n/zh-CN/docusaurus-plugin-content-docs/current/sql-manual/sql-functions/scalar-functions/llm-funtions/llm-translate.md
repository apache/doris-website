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
LLM_TRANSLATE(<text>, <target_language>)
```

## 参数

|    参数    | 说明 |
| ---------- | -------- |
| `<text>`   | 文本   |
| `<target_language>`   | 目标语言 |

## 返回值

返回翻译后的文本字符串

结果为大模型生成，所以返回内容并不固定

## 示例

```sql
SELECT LLM_TRANSLATE('Apache Doris is an MPP-based real-time data warehouse known for its high query speed.', 'zh-CN') AS Result;
```
```text
+--------------------------------------------------------------------------------------------------+
| Result                                                                                           |
+--------------------------------------------------------------------------------------------------+
| Apache Doris 是一款基于 MPP 架构的实时数据仓库，以极高的查询速度著称。                           |
+--------------------------------------------------------------------------------------------------+
```