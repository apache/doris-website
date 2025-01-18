---
{
    "title": "CONCAT_WS",
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

Use the first parameter sep as the connector to concatenate the second parameter and all subsequent parameters (or all strings in ARRAY) into a string. Special cases:

- If the separator is NULL, NULL is returned.

The `CONCAT_WS` function does not skip empty strings, but skips NULL values.

## Syntax

```sql
CONCAT_WS ( <sep> , <str> [ , <str> ] )
CONCAT_WS ( <sep> , <array> )
```

## Parameters

| Parameter | Description |
|-------|-----------------|
| `<sep>` | Connector for concatenating strings |
| `<str>` | String to be concatenated |
| `<array>` | Array to be concatenated |

## Return value

Parameter `<sep>` or `<array>` The string concatenated with `<str>`. Special cases:

- If delimiter is NULL, returns NULL.

## Example

Concatenate strings together using or

```sql
SELECT CONCAT_WS("or", "d", "is"),CONCAT_WS(NULL, "d", "is"),CONCAT_WS('or', 'd', NULL, 'is')
```

```text
+----------------------------+----------------------------+------------------------------------------+
| concat_ws('or', 'd', 'is') | concat_ws(NULL, 'd', 'is') | concat_ws('or', 'd', NULL, 'is') |
+----------------------------+----------------------------+------------------------------------------+
| doris                      | NULL                       | doris                              |
+----------------------------+----------------------------+------------------------------------------+
```

Concatenate array arrays together using or

```sql
SELECT CONCAT_WS("or", ["d", "is"]),CONCAT_WS(NULL, ["d", "is"]),CONCAT_WS("or", ["d", NULL,"is"])
```

```text
+------------------------------+------------------------------+------------------------------------+
| concat_ws('or', ['d', 'is']) | concat_ws(NULL, ['d', 'is']) | concat_ws('or', ['d', NULL, 'is']) |
+------------------------------+------------------------------+------------------------------------+
| doris                        | NULL                         | doris                              |
+------------------------------+------------------------------+------------------------------------+
```