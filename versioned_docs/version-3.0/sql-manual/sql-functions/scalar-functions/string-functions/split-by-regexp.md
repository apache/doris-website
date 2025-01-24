---
{
    "title": "SPLIT_BY_REGEXP",
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

## split_by_regexp

### description

#### Syntax

`ARRAY<STRING> split_by_regexp(STRING str, STRING pattern[, int max_limit])`

Split the string 'str' based on the input regular expression 'pattern', with the option to retain up to the maximum number 'max_imit'. By default, all strings will be retained, and a split string array will be returned.

#### Arguments
`Str ` - The string that needs to be split Type: `String`
`Pattern `- Regular expression Type: `String`
`Max_imit ` - Reserved number, optional parameter Type: `Int`


### example

```
mysql [test_query_qa]>select split_by_regexp('abcde',"");
+------------------------------+
| split_by_regexp('abcde', '') |
+------------------------------+
| ["a", "b", "c", "d", "e"]    |
+------------------------------+
1 row in set (0.02 sec)

mysql [test_query_qa]>select split_by_regexp('a12bc23de345f',"\\d+");
+-----------------------------------------+
| split_by_regexp('a12bc23de345f', '\d+') |
+-----------------------------------------+
| ["a", "bc", "de", "f"]                  |
+-----------------------------------------+
1 row in set (0.01 sec)
```
### keywords

SPLIT_BY_REGEXP,SPLIT