---
{
    "title": "AI_SENTIMENT",
    "language": "zh-CN",
    "description": "用于分析文本的情感倾向"
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

用于分析文本的情感倾向

## 语法


```sql
AI_SENTIMENT([<resource_name>], <text>)
```

## 参数

|    参数    | 说明 |
| ---------- | -------- |
| `<resource_name>`| 指定的资源名称|
| `<text>`   | 需要分析情感的文本 |

## 返回值

返回情感分析结果，可能的值包括：
- positive（积极）
- negative（消极）
- neutral（中性）
- mixed（混合）

当输入有值为 NULL 时返回 NULL

结果为大模型生成，所以返回内容并不固定

## 示例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SENTIMENT('Apache Doirs is a great DB system.') AS Result;
```
```text
+----------+
| Result   |
+----------+
| positive |
+----------+
```

```sql
SELECT AI_SENTIMENT('resrouce_name', 'I hate sunny days.') AS Result;
```
```text
+----------+
| Result   |
+----------+
| negative |
+----------+
```