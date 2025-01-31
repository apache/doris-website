---
{
    "title": "PROTOCOL",
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

The PROTOCOL function is mainly used to extract the protocol part from a URL string.

## Syntax

```sql
PROTOCOL( <url> )
```

## Parameters

| Parameter      | Description         |
|---------|------------|
| `<url>` | The URL to be parsed |

## Return Value

Returns the protocol part of the <url>. Special cases:

- If any of the parameters is NULL, NULL is returned.

## Examples

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

If you want to extract other parts of the URL, you can use [parse_url](./parse-url.md)。
