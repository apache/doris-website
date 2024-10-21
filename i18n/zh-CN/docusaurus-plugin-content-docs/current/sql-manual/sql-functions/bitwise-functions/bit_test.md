---
{
"title": "BIT_TEST",
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

## bit_test
### description
#### Syntax

`bit_test(Integer-type value, Integer-type pos, '......')`

将value的值转换为二进制的形式，返回指定位置pos的值，pos从0开始，从右到左。
如果pos 有多个值，则将多个pos位置上的值用与运算符结合起来，返回最终结果。
如果pos 的取值为负数或者超过value的bit位总数，则会返回结果为0.
整数value范围：TINYINT、SMALLINT、INT、BIGINT、LARGEINT

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
