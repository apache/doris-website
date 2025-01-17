---
{
    "title": "LOCATE",
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

Returns the position of substr in str (counting from 1). If the third parameter pos is specified, the position of substr is searched from the string starting with the pos subscript. If not found, 0 is returned

## Syntax

```sql
locate(VARCHAR substr, VARCHAR str [, INT pos])
```

## Parameters

| Parameter | Description |
| -- |-----------------|
| `substr` | The substring to be searched |
| `str` | The string to be searched |
| `pos` | If this parameter is specified, str starts with the pos subscript and searches for the position of substr |

## Return value

The position of substr in str (counting from 1)

## Example

```sql
SELECT locate('bar', 'foobarbar'),locate('xbar', 'foobar'),locate('bar', 'foobarbar', 5)
```

```text
+----------------------------+--------------------------+-------------------------------+
| locate('bar', 'foobarbar') | locate('xbar', 'foobar') | locate('bar', 'foobarbar', 5) |
+----------------------------+--------------------------+-------------------------------+
|                          4 |                        0 |                             7 |
+----------------------------+--------------------------+-------------------------------+
```