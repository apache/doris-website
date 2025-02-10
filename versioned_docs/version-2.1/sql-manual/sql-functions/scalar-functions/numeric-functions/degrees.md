---
{
    "title": "DEGREES",
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

Input a double-precision floating-point number and convert it from radians to degrees.

- When the parameter is NULL, return NULL.

## Syntax

```sql
DEGREES(<a>)
```

## Parameters

| parameter | explain |
| -- | -- |
| `<a>` | The value that needs to be converted from radians to degrees. |

## Return Value

The angle of parameter a.

- When the parameter is NULL, return NULL.

## Examples

```sql
select degrees(3.14),degrees(1),degrees(-1),degrees(NULL)
```

```text
+-------------------------------+----------------------------+-----------------------------+---------------+
| degrees(cast(3.14 as DOUBLE)) | degrees(cast(1 as DOUBLE)) | degrees(cast(-1 as DOUBLE)) | degrees(NULL) |
+-------------------------------+----------------------------+-----------------------------+---------------+
|             179.9087476710785 |          57.29577951308232 |          -57.29577951308232 |          NULL |
+-------------------------------+----------------------------+-----------------------------+---------------+
```