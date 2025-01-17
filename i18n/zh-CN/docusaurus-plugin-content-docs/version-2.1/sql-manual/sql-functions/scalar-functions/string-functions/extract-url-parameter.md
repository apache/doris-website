---
{
"title": "EXTRACT_URL_PARAMETER",
"language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE 
file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on 
an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 描述

返回 URL 中 `name` 参数的值（如果存在）, 否则为空字符串。

如果有许多具有此名称的参数，则返回第一个出现的参数。

此函数的工作假设参数名称在 URL 中的编码方式与在传递参数中的编码方式完全相同。

如果想获取 URL 中的其他部分，可以使用 [parse_url](parse-url.md) 

## 语法

```sql
extract_url_parameter(VARCHAR url, VARCHAR  name)
```

## 参数

| 参数 | 说明            |
| -- |---------------|
| `url` | 需要返回参数的 url 字符串 |
| `name` | 需要返回的参数名称     |

## 返回值

参数 name 在 url 中的参数值

## 举例

```sql
SELECT extract_url_parameter ("http://doris.apache.org?k1=aa&k2=bb&test=cc#999", "k2")
```

```text
+--------------------------------------------------------------------------------+
| extract_url_parameter('http://doris.apache.org?k1=aa&k2=bb&test=cc#999', 'k2') |
+--------------------------------------------------------------------------------+
| bb                                                                             |
+--------------------------------------------------------------------------------+
```