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

## 描述

`assert_true` 函数的功能是检查输入的布尔表达式或字段是否全部为 true，如果发现任何 false 或 NULL 值，则抛出异常并返回异常信息。

## 语法

```sql
ASSERT_TRUE(<condition>, <errmsg>)
```

## 参数

| 参数                     | 说明                              |
|-------------------------|----------------------------------|
| `<condition>`                | 用于检查的布尔表达式或字段。            |
| `<errmsg>`              | 该参数必须是一个字面量。当 `<condition>` 不全为 true 或包含 NULL 时抛出异常并返回 `errmsg`。    |

## 返回值

- 如果 `<condition>` 输入的所有值都是 true，则返回一个全为 true 的布尔列。
- 否则，抛出异常并返回 errmsg 。


## 举例

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
-- 创建示例表
CREATE TABLE test_assert_true(
    k0 BOOLEAN,
    k1 INT
)
DISTRIBUTED BY HASH(`k0`) BUCKETS AUTO
PROPERTIES("replication_num" = "1");

-- 插入测试数据
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