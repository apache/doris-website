---
{
    "title": "TRIM_IN",
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


## Syntax

`VARCHAR trim_in(VARCHAR str[, VARCHAR rhs])`

When there is no rhs parameter, remove the spaces that appear consecutively at the right and left beginning of the parameter str; when there is an rhs parameter, search and remove any characters in the rhs character set at both ends of the string (regardless of order)

## Examples

```sql
mysql> SELECT trim_in('   ab d   ') str;
+------+
| str  |
+------+
| ab d |
+------+

mysql> SELECT trim_in('ababccaab','ab') str;
+------+
| str  |
+------+
| cc   |
+------+
```

## Keywords

TRIM_IN
