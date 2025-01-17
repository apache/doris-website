---
{
    "title": "HEX",
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

If the input parameter is a number, return the string representation of the hexadecimal value.

If the input parameter is a string, convert each character to two hexadecimal characters, concatenate all the converted characters into a string and output.

## Syntax

```sql
hex(VARCHAR str)

hex(BIGINT num)
```

## Parameters

| Parameter | Description |
|-------|----------|
| `num` | Input parameter is a number |
| `str` | Input parameter is a string |

## Return value

The hexadecimal result of parameter num or str.

## Example

The input parameter is a number
```sql
select hex(12),hex(-1)
```

```text
+---------+------------------+
| hex(12) | hex(-1)          |
+---------+------------------+
| C       | FFFFFFFFFFFFFFFF |
+---------+------------------+
```

The input parameter is a string

```sql
select hex('1'),hex('@'),hex('12')
```

```text
+----------+----------+-----------+
| hex('1') | hex('@') | hex('12') |
+----------+----------+-----------+
| 31       | 40       | 3132      |
+----------+----------+-----------+
```