---
{
    "title": "TRIM",
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

This command is used to delete Spaces or specified characters at both ends of the string. If no rhs parameter is specified, delete the Spaces that appear continuously at the beginning of the right and left parts of str. Otherwise, delete rhs

## Syntax

```sql
RTIM( <str> [ , <rhs>])
```

## Required Parameters

| Parameters | Description |
|------|------|
| `<str>` | Deletes the Spaces  at both ends of the string


## Optional Parameters

| Parameters | Description |
|------|------|
| `<rhs>` | removes the specified character |

## Return Value

Deletes Spaces at both ends or the string after a specified character


## Example

```sql
SELECT trim('   ab d   ') str;
```

```sql
+------+
| str  |
+------+
| ab d |
+------+
```

```sql
SELECT trim('ababccaab','ab') str;
```

```sql
+------+
| str  |
+------+
| cc   |
+------+
```
