---
{
    "title": "FORMAT_ROUND",
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

Formats a number in a format similar to "#,###,###.##", rounds to the specified decimal places, and returns the result as a string.

:::tip
This function has been supported since version 2.1.10. 
:::

## Syntax

```sql
FORMAT_ROUND(<number>, <D>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<number>` | The number to be formatted |
| `<D>` | Number of decimal places |

## Return Value

Returns the formatted string. Special cases:

- Returns NULL when the parameter is NULL
- If D is 0, the result will have no decimal point or decimal part.

## Examples

```sql
mysql> select format_round(17014116, 2);
+---------------------------+
| format_round(17014116, 2) |
+---------------------------+
| 17,014,116.00             |
+---------------------------+
```

```sql
mysql> select format_round(1123.456, 2);
+---------------------------+
| format_round(1123.456, 2) |
+---------------------------+
| 1,123.46                  |
+---------------------------+
```

```sql
mysql> select format_round(1123.4, 2);
+-------------------------+
| format_round(1123.4, 2) |
+-------------------------+
| 1,123.40                |
+-------------------------+
```

```sql
mysql> select format_round(123456, 0);
+-------------------------+
| format_round(123456, 0) |
+-------------------------+
| 123,456                 |
+-------------------------+
```

```sql
mysql> select format_round(123456, 3);
+-------------------------+
| format_round(123456, 3) |
+-------------------------+
| 123,456.000             |
+-------------------------+
```

```sql
mysql> select format_round(123456.123456, 0);
+--------------------------------+
| format_round(123456.123456, 0) |
+--------------------------------+
| 123,456                        |
+--------------------------------+
```

```sql
mysql> select format_round(123456.123456, 3);
+--------------------------------+
| format_round(123456.123456, 3) |
+--------------------------------+
| 123,456.123                    |
+--------------------------------+
```

```sql
mysql> select format_round(123456.123456, 6);
+--------------------------------+
| format_round(123456.123456, 6) |
+--------------------------------+
| 123,456.123456                 |
+--------------------------------+
``` 