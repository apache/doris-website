---
{
    "title": "PROTOCOL",
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

PROTOCOL 函数主要用于提取 URL 字符串中的协议部分。

## 语法

```sql
PROTOCOL( <url> )
```

## 参数

| 参数      | 说明         |
|---------|------------|
| `<url>` | 需要被解析的 URL |

## 返回值

返回`<url>`中的协议部分。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL

## 举例

```sql
SELECT protocol('https://doris.apache.org/');
```

```text
+---------------------------------------+
| protocol('https://doris.apache.org/') |
+---------------------------------------+
| https                                 |
+---------------------------------------+
```

```sql
SELECT protocol(null);
```

```text
+----------------+
| protocol(NULL) |
+----------------+
| NULL           |
+----------------+
```

## 相关命令

如果想提取 URL 中的其他部分，可使用[parse_url](./parse-url.md)。
