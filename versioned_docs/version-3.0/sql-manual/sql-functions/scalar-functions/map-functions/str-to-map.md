---
{
    "title": "STR_TO_MAP",
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
> after version 3.0.6

Constructs a `Map<String, String>` from a string.

## Syntax

```sql
STR_TO_MAP(<str> [, <pair_delimiter> [, <key_value_delimiter>]])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The string to be converted to a map |
| `<pair_delimiter>` | The delimiter for the pairs in the string, default is `,` |
| `<key_value_delimiter>` | The delimiter for the keys and values in the string, default is `:` |

## Return Value

Returns a `Map<String, String>` constructed from a string.

## Example

```sql
select str_to_map('a=1&b=2&c=3', '&', '=') as map1, str_to_map('x:10|y:20|z:30', '|', ':') as map2;
```

```text
+-----------------------------+--------------------------------+
| map1                        | map2                           |
+-----------------------------+--------------------------------+
| {"a":"1", "b":"2", "c":"3"} | {"x":"10", "y":"20", "z":"30"} |
+-----------------------------+--------------------------------+
```
