---
{
    "title": "AI_EXTRACT",
    "language": "zh-CN",
    "description": "用于从文本中提取特定标签对应的信息"
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

用于从文本中提取特定标签对应的信息

## 语法

```sql
AI_EXTRACT([<resource_name>], <text>, <labels>)
```

## 参数

|    参数    | 说明 |
| ---------- | -------- |
| `<resource_name>`| 指定的资源名称，可空|
| `<text>`   | 要提取信息的文本   |
| `<labels>` | 要提取的标签数组   |

## 返回值

返回一个包含所有提取标签及其对应值的字符串

当输入有值为 NULL 时返回 NULL

结果为大模型生成，所以返回内容并不固定

## 示例
```sql
SET default_ai_resource = 'resource_name';
SELECT AI_EXTRACT('Apache Doris is an MPP-based real-time data warehouse known for its high query speed.', 
                  ['product_name', 'architecture', 'key_feature']) AS Result;
```
```text
+---------------------------------------------------------------------------------------+
| Result                                                                                |
+---------------------------------------------------------------------------------------+
| product_name="Apache Doris", architecture="MPP-based", key_feature="high query speed" |
+---------------------------------------------------------------------------------------+
```

```sql
SELECT AI_EXTRACT('resource_name', 'Apache Doris began in 2008 as an internal project named Palo.',
                  ['original name', 'founding time']) AS Result;
```
```text
+----------------------------------------+
| Result                                 |
+----------------------------------------+
| original name=Palo, founding time=2008 |
+----------------------------------------+
```