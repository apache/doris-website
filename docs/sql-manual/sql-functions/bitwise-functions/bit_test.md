---
{
"title": "BIT_TEST",
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

## bit_test
### description
#### Syntax

`bit_test(Integer-type value, Integer-type pos, '......')`

"Convert the value of 'value' into binary form and return the value at the specified position 'pos', where 'pos' starts from 0 and goes from right to left. If there are multiple values for 'pos', combine the values at multiple 'pos' positions using the AND operator and return the final result. 
If the value of pos is negative or exceeds the total number of bits in value, the result will be 0.
Integer value ranges: TINYINT, SMALLINT, INT, BIGINT, LARGEINT."

### example

### example

mysql [(none)]>SELECT bit_test(43, 1);
+-----------------+
| bit_test(43, 1) |
+-----------------+
|               1 |
+-----------------+

mysql [(none)]>select bit_test(43,-1);
+------------------+
| bit_test(43, -1) |
+------------------+
|                0 |
+------------------+

mysql [(none)]>SELECT bit_test(43, 0, 1, 3, 5,2);
+-----------------------------+
| bit_test(43, 0, 1, 3, 5, 2) |
+-----------------------------+
|                           0 |
+-----------------------------+
```

### keywords

    bit_test,bit_test_all
