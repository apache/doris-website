---
{
    "title": "MONEY_FORMAT",
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

The number is output in currency format, the integer part is separated by commas every three bits, and the decimal part is reserved for two bits.

## Syntax

```sql
MONEY_FORMAT(<number>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<number>`   | The numbers to be formatted |

## Return value

Returns a string in currency format. Special cases:

- If the parameter is NULL, return NULL

## Example

```sql
select money_format(17014116);
```

```text
+------------------------+
| money_format(17014116) |
+------------------------+
| 17,014,116.00          |
+------------------------+
```

```sql
select money_format(1123.456);
```

```text
+------------------------+
| money_format(1123.456) |
+------------------------+
| 1,123.46               |
+------------------------+
```

```sql
select money_format(1123.4);
```

```text
+----------------------+
| money_format(1123.4) |
+----------------------+
| 1,123.40             |
+----------------------+
```