---
{
"title": "MD5SUM",
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

## description

Calculates an MD5 128-bit checksum for the strings

## Syntax

```sql
MD5SUM( VARCHAR <str> [ , <str> ... ] )
```

## Parameters

|  parameter | description |
|---------| -- |
| `<str>` | The MD5 value to be calculated |

## Return Value

Returns the MD5 value of multiple strings

## Examples

```sql
select md5("abcd"),md5sum("ab","cd");
```

```text
+----------------------------------+----------------------------------+
| md5('abcd')                      | md5sum('ab', 'cd')               |
+----------------------------------+----------------------------------+
| e2fc714c4727ee9395f324cd2e7f331f | e2fc714c4727ee9395f324cd2e7f331f |
+----------------------------------+----------------------------------+
```