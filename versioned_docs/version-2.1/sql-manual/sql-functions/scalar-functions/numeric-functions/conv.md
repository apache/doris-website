---
{
    "title": "CONV",
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

Do radix conversion for input parameter.

## Syntax

```sql
CONV(<input>, <from_base>, <to_base>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<input>` | Parameters to be converted, either as strings or integers |
| `<from_base>` | Numeric, the source base, within `[2,36]`. |
| `<to_base>` | Numeric, the target base, within `[2,36]`. |

## Return Value

The number under the converted target binary `<to_base>` is returned as a string.

## Examples

```sql
SELECT CONV(15,10,2);
```

```text
+-----------------+
| conv(15, 10, 2) |
+-----------------+
| 1111            |
+-----------------+
```

```sql
SELECT CONV('ff',16,10);
```

```text
+--------------------+
| conv('ff', 16, 10) |
+--------------------+
| 255                |
+--------------------+
```

```sql
SELECT CONV(230,10,16);
```

```text
+-------------------+
| conv(230, 10, 16) |
+-------------------+
| E6                |
+-------------------+
```
