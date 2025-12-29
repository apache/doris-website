---
{
    "title": "AI_MASK",
    "language": "zh-CN",
    "description": "用于掩盖（mask）文本中与指定标签相关的敏感信息"
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

用于掩盖（mask）文本中与指定标签相关的敏感信息

## 语法


```sql
AI_MASK([<resource_name>], <text>, <labels>)
```

## 参数

|    参数    | 说明 |
| ---------- | -------- |
| `<resource_name>`| 指定的资源名称|
| `<text>`   | 包含可能敏感信息的文本 |
| `<labels>` | 需要掩盖的信息标签数组，例如 `ARRAY('name', 'phone', 'email')` |

## 返回值

返回掩盖了敏感信息的文本，被掩盖的部分用 "[MASKED]" 替代

当输入有值为 NULL 时返回 NULL

结果为大模型生成，所以返回内容并不固定

## 示例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_MASK('Wccccat is a 20-year-old Doris community contributor.', ['name', 'age']) AS Result;
```
```text
+-----------------------------------------------------+
| Result                                              |
+-----------------------------------------------------+
| [MASKED] is a [MASKED] Doris community contributor. |
+-----------------------------------------------------+
```

```sql
SELECT AI_MASK('resource_name', 'My email is rarity@example.com and my phone is 123-456-7890',
                ['email', 'phone_num']) AS RESULT
```

```text
+-----------------------------------------------+
| RESULT                                        |
+-----------------------------------------------+
| My email is [MASKED] and my phone is [MASKED] |
+-----------------------------------------------+
```