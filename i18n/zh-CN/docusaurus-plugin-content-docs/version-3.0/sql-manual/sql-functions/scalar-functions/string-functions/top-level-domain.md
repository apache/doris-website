---
{
    "title": "TOP_LEVEL_DOMAIN",
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

TOP_LEVEL_DOMAIN 函数用于从 URL 中提取顶级域名。如果输入的 URL 不合法，则返回空字符串。

## 语法

```sql
TOP_LEVEL_DOMAIN(<url>)
```

## 参数
| 参数 | 说明                                         |
| ---- | -------------------------------------------- |
| `<url>` | 需要提取顶级域名的 URL 字符串。类型：VARCHAR |

## 返回值

返回 VARCHAR 类型，表示提取出的顶级域名。

特殊情况：
- 如果 url 为 NULL，返回 NULL
- 如果 url 不是合法的 URL 格式，返回空字符串
- 对于多级域名（如 .com.cn），返回最后一级域名

## 示例

1. 基本域名处理
```sql
SELECT top_level_domain('www.baidu.com');
```
```text
+-----------------------------------+
| top_level_domain('www.baidu.com') |
+-----------------------------------+
| com                               |
+-----------------------------------+
```

2. 多级域名处理
```sql
SELECT top_level_domain('www.google.com.cn');
```
```text
+---------------------------------------+
| top_level_domain('www.google.com.cn') |
+---------------------------------------+
| cn                                    |
+---------------------------------------+
```

3. 无效 URL 处理
```sql
SELECT top_level_domain('wwwwwwww');
```
```text
+------------------------------+
| top_level_domain('wwwwwwww') |
+------------------------------+
|                              |
+------------------------------+
```