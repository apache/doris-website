---
{
    "title": "ARRAY_REPEAT",
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

Generates an array containing n repeated elements

## Syntax

```sql
ARRAY_REPEAT(<element>, <n>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<n>` | Number of digits |
| `<element>` | Specifying Elements |

## Return Value

Returns an array containing n repeated elements. array_with_constant has the same function as array_repeat and is used to be compatible with the hive syntax format.

## Example

```sql
SELECT ARRAY_REPEAT("hello", 2),ARRAY_REPEAT(12345, 3);
```

```text
+--------------------------+------------------------+
| array_repeat('hello', 2) | array_repeat(12345, 3) |
+--------------------------+------------------------+
| ["hello", "hello"]       | [12345, 12345, 12345]  |
+--------------------------+------------------------+
```
