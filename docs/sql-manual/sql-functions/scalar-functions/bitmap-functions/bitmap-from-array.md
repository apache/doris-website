---
{
    "title": "BITMAP_FROM_ARRAY",
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

Converts an array of TINYINT/SMALLINT/INT/BIGINT type to a BITMAP. When the input field is illegal, the result returns NULL.

## Syntax

```sql
BITMAP_FROM_ARRAY(<arr>)
```

## Parameters

| Parameter | Description   |
|-----------|---------------|
| `<arr>`   | integer array |

## Return Value

Returns a BITMAP
- When the input field is invalid, the result is NULL

## Examples

```sql
SELECT bitmap_to_string(bitmap_from_array(array(1, 0, 1, 1, 0, 1, 0))) AS bs;
```

```text
+------+
| bs   |
+------+
| 0,1  |
+------+
```