---
{
    "title": "RANDOM_BYTES",
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

The RANDOM_BYTES function is used to generate a random byte sequence of the specified length.

## Syntax

```sql
random_bytes( <len> )
```

## Parameters

| Parameter | Description                                                                                                                                               |
|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<len>`   | This parameter specifies the length of the random byte sequence to be generated. This value must be greater than 0; otherwise, an error will be occurred. |

## Return Value

Returns a random byte sequence of the specified length, encoded in hexadecimal. Special cases:

- If any of the parameters is NULL, NULL will be returned.

## Examples

```sql
select random_bytes(7);
```

```text
+------------------+
| random_bytes(7)  |
+------------------+
| 0x869684a082ab4b |
+------------------+
```

```sql
select random_bytes(-1);
```

```text
(1105, 'errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]argument -1 of function random_bytes at row 0 was invalid.')
```
