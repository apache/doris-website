---
{
    "title": "NULL_OR_EMPTY",
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

The `null_or_empty` function checks if the given value is NULL or an empty string. It returns true if the input value is NULL or an empty string, otherwise, it returns false.

## Syntax

```sql
NULL_OR_EMPTY (<str>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The string to check |

## Return Value

Returns true if the string is an empty string or NULL, otherwise returns false.

## Examples

```sql
select null_or_empty(null);
```

```text
+---------------------+
| null_or_empty(NULL) |
+---------------------+
|                   1 |
+---------------------+
```

```sql
select null_or_empty("");
```

```text
+-------------------+
| null_or_empty('') |
+-------------------+
|                 1 |
+-------------------+
```

```sql
select null_or_empty("a");
```

```text
+--------------------+
| null_or_empty('a') |
+--------------------+
|                  0 |
+--------------------+
```
