---
{
    "title": "PARSE_DATA_SIZE",
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

Parse a string in the format of "value + unit" and convert the value into a number, where the value represents a fractional amount of the unit.

If the input parameter is invalid, an error will be raised. The maximum return value is Int128 Max.

**Data Storage Unit Table**

| Unit  | Description        | Value          |
|------|-----------|------------|
| B    | Bytes      | 1          |
| kB   | Kilobytes    | 1024       |
| MB   | Megabytes    | 1024²      |
| GB   | Gigabytes    | 1024³      |
| TB   | Terabytes    | 1024⁴      |
| PB   | Petabytes    | 1024⁵      |
| EB   | Exabytes    | 1024⁶      |
| ZB   | Zettabytes    | 1024⁷      |
| YB   | Yottabytes    | 1024⁸      |

## Syntax

```sql
PARSE_DATA_SIZE(<str>)
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<str>` | The value is to be calculated |  

## Return Value  

The return number value represents a fractional amount of the unit. 

## Example

```sql
SELECT parse_data_size('1B');
```

```text
+-----------------------+
| parse_data_size('1B') |
+-----------------------+
| 1                     |
+-----------------------+
```

```sql
SELECT parse_data_size('1kB');
```

```text
+------------------------+
| parse_data_size('1kB') |
+------------------------+
| 1024                   |
+------------------------+
```

```sql
SELECT parse_data_size('2.3MB');
```

```text
+--------------------------+
| parse_data_size('2.3MB') |
+--------------------------+
| 2411724                  |
+--------------------------+
```
