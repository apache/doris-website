---
{
    "title": "MASK",
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

The MASK function is to shield data to protect sensitive information, and it is commonly used in data anonymization scenarios. Its default behavior is to convert a uppercase letter in the input string to `X`, a lowercase letter to `x`, and a number to `n`. 

## Syntax

```sql
MASK(<str> [, <upper> [, <lower> [, <number> ]]])
```

## Parameters

| Parameter  | Description                                                                                                                                                                                                       |
|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>`    | String that need to be masked                                                                                                                                                                                     |
| `<upper>`  | Optional Parameter, replaces uppercase character to `X` by default. If a sequence of characters are input, the first character will be taken, and if non ASCII characters are input, the first byte will be taken |
| `<lower>`  | Optional Parameter, replaces lowercase character to `x` by default. If a sequence of characters are input, the first character will be taken, and if non ASCII characters are input, the first byte will be taken |
| `<number>` | Optional Parameter, replaces numeric character to `n` by default. If a sequence of characters are input, the first character will be taken, and if non ASCII characters are input, the first byte will be taken   |

## Return Value

Returns a string after masking uppercase character, lowercase character and lnumeric character. Special cases:

- If any Parameter is NULL, NULL will be returned.
- Non-alphabetic and non-numeric characters will do not masking

## Examples

```sql
select mask('abc123EFG');
```

```text
+-------------------+
| mask('abc123EFG') |
+-------------------+
| xxxnnnXXX         |
+-------------------+
```

```sql
select mask(null);
```

```text
+------------+
| mask(NULL) |
+------------+
| NULL       |
+------------+
```

```sql
select mask('abc123EFG', '*', '#', '$');
```

```text
+----------------------------------+
| mask('abc123EFG', '*', '#', '$') |
+----------------------------------+
| ###$$$***                        |
+----------------------------------+
```
