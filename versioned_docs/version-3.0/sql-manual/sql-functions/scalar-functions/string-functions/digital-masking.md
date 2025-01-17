---
{
    "title": "DIGITAL_MASKING",
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

The `digital_masking` function is used for masking numbers. Based on the specified masking rule, certain characters in the number are replaced with *. This function is an alias for the original function `concat(left(id, 3), '****', right(id, 4))`.

## Syntax

`DIGITAL_MASKING( <digital_number> )`

## Parameters

| Parameter | Description |
| -- | -- |
| `<digital_number>` | The digital string that needs to be masked |

## Return Value

Returns the masked digital string.

## Examples

```sql
select digital_masking(13812345678);
```

```
+------------------------------+
| digital_masking(13812345678) |
+------------------------------+
| 138****5678                  |
+------------------------------+
```
