---
{
"title": "SUB_REPLACE",
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

The `sub_replace` function is used to replace substrings within a string. You can specify the substring to be replaced and the target string to replace it with. It returns a new string where the substring starting from `start` with length `len` in `str` is replaced by `new_str`. If `start` or `len` is a negative integer, it returns NULL. The default value for `len` is the length of `new_str`.

## Syntax

```sql
sub_replace(<str>, <new_str>, [ ,<start> [ , <len> ] ]
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The target string in which the replacement will occur |
| `<new_str>` | The string that will replace the specified substring |
| `<start[, len]>` | start specifies the position where the replacement starts. The optional len specifies the length of the substring to be replaced |

## Return Value

Returns the string after replacement.

## Examples

```sql
select sub_replace("this is origin str","NEW-STR",1);
```

```text
+-------------------------------------------------+
| sub_replace('this is origin str', 'NEW-STR', 1) |
+-------------------------------------------------+
| tNEW-STRorigin str                              |
+-------------------------------------------------+
```

```sql
select sub_replace("doris","***",1,2);
```

```text
+-----------------------------------+
| sub_replace('doris', '***', 1, 2) |
+-----------------------------------+
| d***is                            |
+-----------------------------------+
```
