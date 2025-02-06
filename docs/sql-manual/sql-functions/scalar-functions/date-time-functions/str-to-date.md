---
{
    "title": "STR_TO_DATE",
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

The function converts the input datetime string into a DATETIME value based on the specified format.

## Syntax

```sql
STR_TO_DATE(<datetime_str>, <format>)
```
## Parameters

| Parameter        | Description                                                                                                      |
|------------------|------------------------------------------------------------------------------------------------------------------|
| `<datetime_str>` | Required. The input datetime string to be converted.                                                             |
| `<format>`       | Required. The format string specifying the datetime structure, such as %Y-%m-%d %H:%i:%s or yyyy-MM-dd HH:mm:ss. |

## Return Value

- Returns a DATETIME value representing the converted datetime.
- If the input `<datetime_str>` or `<format>` is invalid, the function returns NULL.

## Example

Convert common datetime strings to DATETIME

```sql
SELECT STR_TO_DATE('2025-01-23 12:34:56', '%Y-%m-%d %H:%i:%s'),STR_TO_DATE('2025-01-23 12:34:56', 'yyyy-MM-dd HH:mm:ss');
```

```text
+---------------------------------------------------------+-----------------------------------------------------------+
| str_to_date('2025-01-23 12:34:56', '%Y-%m-%d %H:%i:%s') | str_to_date('2025-01-23 12:34:56', 'yyyy-MM-dd HH:mm:ss') |
+---------------------------------------------------------+-----------------------------------------------------------+
| 2025-01-23 12:34:56.000000                              | 2025-01-23 12:34:56.000000                                |
+---------------------------------------------------------+-----------------------------------------------------------+
```

Others

```sql
select STR_TO_DATE('200442 Monday', '%X%V %W'),STR_TO_DATE('2023','%Y');
```

```text
+-----------------------------------------+---------------------------+
| str_to_date('200442 Monday', '%X%V %W') | str_to_date('2023', '%Y') |
+-----------------------------------------+---------------------------+
| 2004-10-18                              | 2023-01-01                |
+-----------------------------------------+---------------------------+
```