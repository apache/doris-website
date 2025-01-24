---
{
    "title": "REVERSE",
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

The REVERSE function is used to reverse the order of characters in a string or the order of elements in an array.

## Syntax

```sql
REVERSE( <seq> )
```

## Parameters

| Parameter | Description             |
|-----------|----------------|
| `<seq>`   | The string or array whose order needs to be reversed. |

## Return Value

Returns the string or array with the reversed order. Special cases:

- If any Parameter is NULL, NULL will be returned.

## Examples

```sql
SELECT reverse('hello');
```

```text
+------------------+
| REVERSE('hello') |
+------------------+
| olleh            |
+------------------+
```

```sql
SELECT reverse(['hello', 'world']);
```

```text
+-----------------------------+
| reverse(['hello', 'world']) |
+-----------------------------+
| ["world", "hello"]          |
+-----------------------------+
```
