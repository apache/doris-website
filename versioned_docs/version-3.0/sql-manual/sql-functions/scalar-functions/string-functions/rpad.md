---
{
    "title": "RPAD",
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

Used to pad the specified character on the right side of the original string until met the specified length.

## Syntax

```sql
RPAD ( <str> , <len> , <pad>)
```

## Parameters

| Parameter      | Description                                                                                                 |
|---------|-------------------------------------------------------------------------------------------------------------|
| `<str>` | The string to be padded.                                                                                    |
| `<len>` | The total length of the final result string, which represents character length rather than the byte length. |
| `<pad>` | The string used for padding.                                                                                |

## Return Value

Returns the padded string. Special cases:

- If any Parameter is NULL, NULL will be returned.
- If `<pad>` is empty and `<len>` is greater than the length of `<str>`, the return value is an empty string.
- If `<len>` is less than the length of `<str>`, the string obtained by truncating `<str>` to `<len>` is returned.
- If `<len>` is less than 0, the return value is NULL.

## Examples

```sql
SELECT rpad('hello', 1, '');
```

```text
+----------------------+
| rpad('hello', 1, '') |
+----------------------+
| h                    |
+----------------------+
```

```sql
SELECT rpad('hello', 10, 'world');
```

```text
+----------------------------+
| rpad('hello', 10, 'world') |
+----------------------------+
| helloworld                 |
+----------------------------+
```

```sql
SELECT rpad('hello', 10, '');
```

```text
+-----------------------+
| rpad('hello', 10, '') |
+-----------------------+
|                       |
+-----------------------+
```
