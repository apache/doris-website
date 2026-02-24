---
{
    "title": "AI_SUMMARIZE",
    "language": "zh-CN",
    "description": "用于生成文本的简明摘要"
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

用于生成文本的简明摘要

## 语法


```sql
AI_SUMMARIZE([<resource_name>], <text>)
```

## 参数

|    参数    | 说明 |
| ---------- | -------- |
| `<resource_name>`| 指定的资源名称|
| `<text>`   | 需要摘要的文本 |

## 返回值

返回文本的简明摘要

当输入有值为 NULL 时返回 NULL

结果为大模型生成，所以返回内容并不固定

## 示例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SUMMARIZE('Apache Doris is an MPP-based real-time data warehouse known for its high query speed.') AS Result;
```
```text
+-------------------------------------------------------------------+
| Result                                                            |
+-------------------------------------------------------------------+
| Apache Doris is a high-speed, MPP-based real-time data warehouse. |
+-------------------------------------------------------------------+
```

```sql
SELECT AI_SUMMARIZE('resourse_name','Doris supports high-concurrency, real-time analytics and is widely used in business intelligence scenarios.') AS Result;
```

```text
+------------------------------------------------------------------------------------------------+
| Result                                                                                         |
+------------------------------------------------------------------------------------------------+
| Doris is a high-concurrency, real-time analytics tool commonly used for business intelligence. |
+------------------------------------------------------------------------------------------------+
```