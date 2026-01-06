---
{
    "title": "AI_CLASSIFY",
    "language": "zh-CN",
    "description": "用于将文本分类到指定的标签集合中"
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

用于将文本分类到指定的标签集合中

## 语法


```sql
AI_CLASSIFY([<resource_name>], <text>, <labels>)
```

## 参数

|    参数    | 说明 |
| ---------- | -------- |
| `<resource_name>`| 指定的资源名称, 可空|
| `<text>`   | 需要分类的文本 |
| `<labels>` | 分类标签数组 |

## 返回值

返回文本最匹配的单个标签字符串

当输入有值为 NULL 时返回 NULL

结果为大模型生成，所以返回内容并不固定

## 示例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_CLASSIFY('Apache Doris is a databases system.', ['useage', 'introduce']) AS Result;
```
```text
+-----------+
| Result    |
+-----------+
| introduce |
+-----------+
```

```sql
SELECT AI_CLASSIFY('resource_name', 'Apache Doris is developing rapidly.', ['science', 'sport']) AS Result;
```
```text
+---------+
| Result  |
+---------+
| science |
+---------+
```