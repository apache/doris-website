---
{
    "title": "MONTHS_SUB",
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

Subtracts a specified number of months from the given datetime and returns the calculated new datetime.

## Syntax

```sql
MONTHS_SUB(<datetime/date>, <nums>)
```

## Parameters

| Parameter | Description |
|-------------------|---------------|
| `<datetime/date>` | The datetime value to be calculated, of type `DATETIME` or `DATE` |
| `<nums>` | The number of months to subtract |

## Return Value

Returns the calculated new date.

The return value type is consistent with the input <datetime/date> type.

Special cases:

- When <datetime/date> input is NULL, returns NULL
- If the calculation result is out of range, SQL execution will report an error. In filter conditions, you can rewrite it as [`TIMESTAMPDIFF`](./timestampdiff)

## Example

```sql
select months_sub("2020-01-31 02:02:02", 1),months_sub("2020-01-31", 1),months_sub("2020-01-31", -1);
```

```text
+--------------------------------------+-----------------------------+------------------------------+
| months_sub("2020-01-31 02:02:02", 1) | months_sub("2020-01-31", 1) | months_sub("2020-01-31", -1) |
+--------------------------------------+-----------------------------+------------------------------+
| 2019-12-31 02:02:02                  | 2019-12-31                  | 2020-02-29                   |
+--------------------------------------+-----------------------------+------------------------------+
```

```sql
select months_sub("0000-02-02", 2);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = [E-218] Operation months_sub of 0000-02-02, 2 out of range
```