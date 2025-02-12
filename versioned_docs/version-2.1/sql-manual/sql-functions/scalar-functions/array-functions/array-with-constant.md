---
{
    "title": "ARRAY_WITH_CONSTANT",
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
ARRAY_WITH_CONSTANT(<n>, <element>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<n>` | Number of digits |
| `<element>` | Specifying Elements |

## Return Value

Returns an array containing n repeated elements. array_repeat has the same function as array_with_constant and is used to be compatible with the hive syntax format.

## Example

```sql
SELECT ARRAY_WITH_CONSTANT(2, "hello"),ARRAY_WITH_CONSTANT(3, 12345);
```

```text
+---------------------------------+-------------------------------+
| array_with_constant(2, 'hello') | array_with_constant(3, 12345) |
+---------------------------------+-------------------------------+
| ["hello", "hello"]              | [12345, 12345, 12345]         |
+---------------------------------+-------------------------------+
```
