---
{
    "title": "PARSE_URL",
    "language": "en"
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

## Description

The PARSE_URL function is mainly used to parse URL strings and extract various components from them, such as protocols, hosts, paths, query parameters, etc.

## Syntax

```sql
PARSE_URL( <url>, <name> )
```

## Parameters

| Parameter       | Description                                                                                      |
|----------|--------------------------------------------------------------------------------------------------|
| `<url>`  | URL that need to be parsed                                                                       |
| `<name>` | The parts to be extracted, and the optional values include `PROTOCOL`, `HOST`, `PATH`, `REF`, `AUTHORITY`, `FILE`, `USERINFO`, `PORT`, `QUERY` (case insensitive). |

## Return Value

Returns a specified part of `<url>`. Special cases:

- If any Parameter is NULL, NULL will be returned.
- If `<name>` is passed with other illegal values, an error will be occurred.

## Examples

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

如果想获取 QUERY 中的特定 Parameter，可使用[extract_url_parameter](./extract-url-parameter.md)。
