---
{
    "title": "MASK_LAST_N",
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

The MASK_LAST_N function is mainly used to mask the last N bytes of data to protect sensitive information, and is commonly used in data anonymization scenarios. Its behavior is to replace a uppercase letter with `X`, a lowercase letter with `x`, and a number with `n` in the first N bytes.

## Syntax

```sql
mask_last_n( <str> [, <n> ])
```

## Parameters

| Parameter | Description                                                                                           |
|-----------|-------------------------------------------------------------------------------------------------------|
| `<str>`   | String that need to be masked                                                                         |
| `<n>`     | Optional Parameter, limit data masking to only the last N bytes, default to masking the entire string |

## Return Value

Returns a string after masking uppercase character, lowercase character and lnumeric character in last N bytes. Special cases:

- If any Parameter is NULL, NULL will be returned.
- Non-alphabetic and non-numeric characters will do not masking

## Examples

```sql
select mask_last_n("1234-5678-8765-4321", 4);
```

```text
+---------------------------------------+
| mask_last_n('1234-5678-8765-4321', 4) |
+---------------------------------------+
| 1234-5678-8765-nnnn                   |
+---------------------------------------+
```

```sql
select mask_last_n("1234-5678-8765-4321", null);
```

```text
+-------------------------------------------+
| mask_last_n('1234-5678-8765-4321', NULL) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```
