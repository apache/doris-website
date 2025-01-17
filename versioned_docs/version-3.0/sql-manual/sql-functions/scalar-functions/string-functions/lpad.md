---
{
    "title": "LPAD",
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

Returns a string of length len (starting from the first letter) in str.

If len is greater than the length of str, pad characters are added to the front of str until the length of the string reaches len.

If len is less than the length of str, this function is equivalent to truncating the str string and returning only a string of length len. len refers to the character length rather than the byte length.

Special cases:

- In addition to containing NULL values, if pad is empty, the return value is an empty string.

## Syntax

```sql
lpad(VARCHAR str, INT len, VARCHAR pad)
```

## Parameters

| Parameter | Description |
| -- |------------------------------|
| `str` | The string to be padded |
| `len` | The length of the string to be padded, which refers to the character length rather than the byte length |
| `pad` | The string to be padded on the left side of the original string |

## Return value

The padded string. Special cases:

- If pad is empty, the return value is an empty string, except when it contains NULL values.

## Example

```sql
select lpad("hi", 5, "xy"),lpad("hi", 1, "xy"),lpad("", 0, "")
```

```text
+---------------------+---------------------+-----------------+
| lpad('hi', 5, 'xy') | lpad('hi', 1, 'xy') | lpad('', 0, '') |
+---------------------+---------------------+-----------------+
| xyxhi               | h                   |                 |
+---------------------+---------------------+-----------------+
```