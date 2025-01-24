---
{
    "title": "ORTHOGONAL_BITMAP_EXPR_CALCULATE_COUNT",
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

The ORTHOGONAL_BITMAP_EXPR_CALCULATE_COUNT function returns the number of elements in the set after performing intersection, union, and difference calculations on the Bitmap expression.

## Syntax

```sql
ORTHOGONAL_BITMAP_EXPR_CALCULATE_COUNT(<bitmap_column>, <column_to_filter>, <input_string>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<bitmap_column>` | The Bitmap type expression needs to be obtained |
| `<column_to_filter>` | The filtering dimension column, the Key column for calculation |
| `<input_string>` | The calculation expression string, meaning that the Bitmap intersection, union, and difference set expressions are calculated based on the Key column. The supported operators in the expression: &represents intersection calculation, \| represents union calculation, - represents difference calculation, ^ represents XOR calculation, and \ represents escape characters |

## Return Value

Returns a value of type BIGINT.

## Example

```sql
select orthogonal_bitmap_expr_calculate_count(user_id, tag, '(833736|999777)&(1308083|231207)&(1000|20000-30000)') from user_tag_bitmap where tag in (833736,999777,130808,231207,1000,20000,30000);
Note: 1000, 20000, 30000 plastic tags represent different labels of users
```

```text
+-----------------------------------------------------------------------------------------------------------------+
| orthogonal_bitmap_expr_calculate_count(`user_id`, `tag`, '(833736|999777)&(1308083|231207)&(1000|20000-30000)') |
+-----------------------------------------------------------------------------------------------------------------+
|                                                                                                            1000 |
+-----------------------------------------------------------------------------------------------------------------+
```

```sql
select orthogonal_bitmap_expr_calculate_count(user_id, tag, '(A:a/b|B:2\\-4)&(C:1-D:12)&E:23') from user_str_tag_bitmap where tag in ('A:a/b', 'B:2-4', 'C:1', 'D:12', 'E:23');
Note: 'A:a/b', 'B:2-4', etc. are string types tag, representing different labels of users, where 'B:2-4' needs to be escaped as'B:2\\-4'
```

```text
+---------------------------------------------------------------------------------------------+
| orthogonal_bitmap_expr_calculate_count(`user_id`, `tag`, '(A:a/b|B:2\\-4)&(C:1-D:12)&E:23') |
+---------------------------------------------------------------------------------------------+
|                                                                                          30 |
+---------------------------------------------------------------------------------------------+
```