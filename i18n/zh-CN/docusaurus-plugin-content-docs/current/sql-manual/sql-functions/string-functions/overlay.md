---
{
    "title": "OVERLAY",
    "language": "zh-CN"
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


返回字符串 str，并用字符串 newstr 替换从位置 pos 开始、长度为 len 字符的子字符串。如果 pos 不在字符串长度范围内，则返回原始字符串。如果 len 不在字符串其余部分的长度范围内，则从位置 pos 开始替换字符串其余部分。如果任何参数为 NULL，则返回 NULL。

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