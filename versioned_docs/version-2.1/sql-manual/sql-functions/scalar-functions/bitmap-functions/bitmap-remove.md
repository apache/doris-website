---
{
    "title": "BITMAP_REMOVE",
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

Removes a specified value from a Bitmap column.

## Syntax

```sql
BITMAP_REMOVE(<bitmap>, <value>)
```

## Parameters

| Parameter   | Description    |
|-------------|----------------|
| `<bitmap>`  | The Bitmap value |
| `<value>`   | The value to remove |

## Return Value

Returns the Bitmap after removing the specified value.

Returns the original Bitmap if the value to be removed does not exist;  
Returns `NULL` if the value to be removed is `NULL`.

## Examples

To remove a value from a Bitmap:

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), 3)) res;
```

The result will be:

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

To remove a `NULL` value from a Bitmap:

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), null)) res;
```

The result will be:

```text
+------+
| res  |
+------+
| NULL |
+------+
```
