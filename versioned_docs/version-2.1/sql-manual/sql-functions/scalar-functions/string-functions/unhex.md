---
{
    "title": "UNHEX",
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

The `unhex` function is used to convert a hexadecimal string back into the original string. It converts every two hexadecimal characters into one byte. When an invalid value is passed as a parameter, it will return empty string.

## Syntax

```sql
UNHEX(<str>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The hexadecimal character string |

## Return Value

If the input string has a length of 0 or is odd, `unhex` function returns an empty string.
If the string contains characters other than [0-9], [a-f], or [A-F], `unhex` function returns an empty string.
In other cases, every two characters are converted to their hexadecimal representation and concatenated into a string for output.

## Examples

```sql
select unhex('@');
```

```text
+------------+
| unhex('@') |
+------------+
|            |
+------------+
```

```sql
select unhex('41');
```

```text
+-------------+
| unhex('41') |
+-------------+
| A           |
+-------------+
```

```sql
select unhex('4142');
```

```text
+---------------+
| unhex('4142') |
+---------------+
| AB            |
+---------------+
```
