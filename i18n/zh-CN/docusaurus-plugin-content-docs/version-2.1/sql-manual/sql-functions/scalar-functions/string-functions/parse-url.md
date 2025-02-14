---
{
    "title": "PARSE_URL",
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

PARSE_URL 函数主要用于解析 URL 字符串，并从中提取各种组成部分，如协议、主机、路径、查询参数等。

## 语法

```sql
PARSE_URL( <url>, <name> )
```

## 参数

| 参数       | 说明                                                                                               |
|----------|--------------------------------------------------------------------------------------------------|
| `<url>`  | 需要被解析的 URL                                                                                       |
| `<name>` | 需要提取的部分，可选的值有`PROTOCOL`，`HOST`，`PATH`，`REF`，`AUTHORITY`，`FILE`，`USERINFO`，`PORT`，`QUERY`（不区分大小写） |

## 返回值

返回`<url>`指定的部分。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL
- `<name>`传入其他非法值，则会报错

## 举例

```sql
SELECT parse_url ('https://doris.apache.org/', 'HOST');
```

```text
+------------------------------------------------+
| parse_url('https://doris.apache.org/', 'HOST') |
+------------------------------------------------+
| doris.apache.org                               |
+------------------------------------------------+
```

```sql
SELECT parse_url ('https://doris.apache.org/', null);
```

```text
+----------------------------------------------+
| parse_url('https://doris.apache.org/', NULL) |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```

## 相关命令

如果想获取 QUERY 中的特定参数，可使用[extract_url_parameter](./extract-url-parameter.md)。
