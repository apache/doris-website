---
{
    "title": "OVERLAY",
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

## overlay
### Description
#### Syntax

`VARCHAR Overlay (VARCHAR str, INT pos, INT len, VARCHAR newstr)`


Returns the string str and replaces it with the string newstr, a substring of len characters starting at position pos. If pos is not within the length of the string, the original string is returned. If len is not within the length of the rest of the string, the rest of the string is replaced starting at position pos. If any argument is NULL, NULL is returned.

### example

```
mysql> select overlay('Quadratic', 3, 4, 'What');
+------------------------------------+
| overlay('Quadratic', 3, 4, 'What') |
+------------------------------------+
| QuWhattic                          |
+------------------------------------+
mysql> select overlay('Quadratic', -1, 4, 'What');
+-------------------------------------+
| overlay('Quadratic', -1, 4, 'What') |
+-------------------------------------+
| Quadratic                           |
+-------------------------------------+
mysql> select overlay('Quadratic', 3, 100, 'What');
+--------------------------------------+
| overlay('Quadratic', 3, 100, 'What') |
+--------------------------------------+
| QuWhat                               |
+--------------------------------------+
mysql> select overlay('Quadratic', 3, -1, 'What');
+-------------------------------------+
| overlay('Quadratic', 3, -1, 'What') |
+-------------------------------------+
| QuWhat                              |
+-------------------------------------+
mysql> select overlay('Quadratic', 0, 100, 'What');
+--------------------------------------+
| overlay('Quadratic', 0, 100, 'What') |
+--------------------------------------+
| Quadratic                            |
+--------------------------------------+
```
### keywords
    OVERLAY