---
{
    "title": "ASSERT_TRUE",
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

The function of the `assert_true` function is to check if the input boolean expression or field is true in its entirety, and if any false or NULL values are found, an exception is thrown and an exception message is returned.

## Syntax

```sql
ASSERT_TRUE(<condition>, <errmsg>)
```

## Parameters

| Parameter               | Description                      |
|-------------------------|----------------------------------|
| `<condition>`                | The boolean expression or field used for the check.            |
| `<errmsg>` | This parameter must be a literal. Throws an exception and returns the value if `<condition>` is not all true or contains NULL. |

## Return Value

- If all values in the `<condition>` input are true, returns a boolean column that is all true. 
- Otherwise, an exception is thrown and `<errmsg>` is returned.


## Examples

```sql
select assert_true(1, "wrong");
```

```text
+-------------------------+
| assert_true(1, "wrong") |
+-------------------------+
|                       1 |
+-------------------------+
```

```sql
select assert_true(1, nullable("wrong"));
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = assert_true only accept constant for 2nd argument
```

```sql
select assert_true(0, "wrong");
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT][E33] wrong
```

```sql
select assert_true(null, "wrong");
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT][E33] wrong
```

```sql
-- Create sample tables
CREATE TABLE test_assert_true(
    k0 BOOLEAN,
    k1 INT
)
DISTRIBUTED BY HASH(`k0`) BUCKETS AUTO
PROPERTIES("replication_num" = "1");

-- Insert test data
INSERT INTO test_assert_true VALUES (true, 1), (true, 2);

SELECT ASSERT_TRUE(k0, "k0 contains invalid values") FROM test_assert_true;
```

```text
+-----------------------------------------------+
| ASSERT_TRUE(k0, "k0 contains invalid values") |
+-----------------------------------------------+
|                                             1 |
|                                             1 |
+-----------------------------------------------+
```
