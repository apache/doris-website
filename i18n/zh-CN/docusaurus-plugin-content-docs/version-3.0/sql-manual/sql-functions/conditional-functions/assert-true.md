---
{
    "title": "ASSERT_TRUE",
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

### Description
#### Syntax

`BOOLEAN assert_true(BOOLEAN condition, VarcharLiteral errmsg)`

当 `condition` 为 `true` 时, 返回 `true`. 否则抛出一个异常，异常信息为 `errmsg`.
`errmsg` 必须为字面量。

### Example

```sql
mysql> select assert_true(1, "wrong");
+------------------------------------------+
| assert_true(cast(1 as BOOLEAN), 'wrong') |
+------------------------------------------+
|                                        1 |
+------------------------------------------+
1 row in set (0.12 sec)

mysql> select assert_true(1, nullable("wrong"));
ERROR 1105 (HY000): errCode = 2, detailMessage = assert_true only accept constant for 2nd argument
mysql> select assert_true(0, "wrong");
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[INVALID_ARGUMENT][E33] wrong
mysql> select assert_true(null, "wrong");
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[INVALID_ARGUMENT][E33] wrong
```

### Keywords
    ASSERT_TRUE, ASSERT, TRUE
