---
{
    "title": "COUNT_SUBSTRINGS",
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

## count_substrings

### description

#### Syntax

`int count_substrings(STRING str, STRING pattern)`
Returns the total number of occurrences of the substring pattern in the string str.
Note: The current implementation shifts by the length of the pattern after each match in the string.
Therefore, when str: ccc and pattern: cc, the result returned is 1.

#### Arguments

`str` — The string to be checked. Type: `String`
`pattern` — The substring to be matched. Type: `String`


#### Returned value(s)

Returns the total number of occurrences of the substring.

### example

```
mysql [(none)]>select count_substrings('a1b1c1d','1');
+----------------------------------+
| count_substrings('a1b1c1d', '1') |
+----------------------------------+
|                                3 |
+----------------------------------+

mysql [(none)]>select count_substrings(',,a,b,c,',',');
+-----------------------------------+
| count_substrings(',,a,b,c,', ',') |
+-----------------------------------+
|                                 5 |
+-----------------------------------+

mysql [(none)]>select count_substrings('ccc','cc');
+--------------------------------+
| count_substrings('ccc', 'cc')  |
+--------------------------------+
|                              1 |
+--------------------------------+

mysql [(none)]>SELECT count_substrings(NULL,',');
+-----------------------------+
| count_substrings(NULL, ',') |
+-----------------------------+
|                        NULL |
+-----------------------------+

mysql [(none)]>select count_substrings('a,b,c,abcde','');
+-------------------------------------+
| count_substrings('a,b,c,abcde', '') |
+-------------------------------------+
|                                   0 |
+-------------------------------------+

mysql [(none)]>select count_substrings(NULL, 'a');
+-----------------------------+
| count_substrings(NULL, 'a') |
+-----------------------------+
|                        NULL |
+-----------------------------+

mysql [(none)]>select count_substrings('','asd');
+-----------------------------+
| count_substrings('', 'asd') |
+-----------------------------+
|                           0 |
+-----------------------------+

mysql [(none)]>select count_substrings('abccbaacb','c');
+------------------------------------+
| count_substrings('abccbaacb', 'c') |
+------------------------------------+
|                                  3 |
+------------------------------------+
```
### keywords

COUNT_SUBSTRINGS,SUBSTRINGS