---
{
    "title": "REGEXP",
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

对字符串 str 执行正则表达式匹配，匹配成功时返回 true，否则返回 false。pattern 为正则表达式模式。
需要注意的是，在处理字符集匹配时，应使用 Unicode 标准字符类。表情包不能使用Unicode的\U等转义字符代替，只能使用原有表情包字符。这确保函数能够正确识别和处理来自不同语言的各种字符。


## 语法

```sql
REGEXP(<str>, <pattern>)
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<str>` | 字符串类型。表示要执行正则表达式匹配的字符串，可以是表中的列或字面值字符串。|
| `<pattern>` | 字符串类型。用于与字符串 <str> 匹配的正则表达式模式。正则表达式提供了定义复杂搜索模式的强大方式，包括字符类、量词和锚点。|

## 返回值

REGEXP 函数返回布尔值（BOOLEAN）。如果字符串 <str> 匹配正则表达式模式 <pattern>，函数返回 true（在 SQL 中表示为 1）；如果不匹配，返回 false（在 SQL 中表示为 0）。

## 例子

```sql
CREATE TABLE test ( k1 VARCHAR(255) ) properties("replication_num"="1")

INSERT INTO test (k1) VALUES ('billie eillish'), ('It\'s ok'), ('billie jean'), ('hello world');
```


```sql
--- 查找k1字段中以'billie'开头的所有数据
SELECT k1 FROM test WHERE k1 REGEXP '^billie'
--------------

+----------------+
| k1             |
+----------------+
| billie eillish |
| billie jean    |
+----------------+
2 rows in set (0.02 sec)

--- 查找k1字段中以'ok'结尾的数据：
SELECT k1 FROM test WHERE k1 REGEXP 'ok$'
--------------

+---------+
| k1      |
+---------+
| It's ok |
+---------+
1 row in set (0.03 sec)
```
中文测试

```sql
mysql> select regexp('这是一段中文 This is a passage in English 1234567', '\\p{Han}');
+-----------------------------------------------------------------------------+
| ('这是一段中文 This is a passage in English 1234567' regexp '\p{Han}')         |
+-----------------------------------------------------------------------------+
|                                                                           1 |
+-----------------------------------------------------------------------------+
```

插入然后进行简单的变量字符串匹配

```sql
CREATE TABLE test_regexp (
    id INT,
    name VARCHAR(255)
) PROPERTIES("replication_num"="1");

INSERT INTO test_regexp (id, name) VALUES
    (1, 'Alice'),
    (2, 'Bob'),
    (3, 'Charlie'),
    (4, 'David');

--查找以'A'开头的名字
SELECT id, name FROM test_regexp WHERE name REGEXP '^A';
```

```text
+------+-------+
| id   | name  |
+------+-------+
|    1 | Alice |
+------+-------+
```

特殊字符匹配

```sql
-- 插入具有特殊字符的名字
INSERT INTO test_regexp (id, name) VALUES
    (5, 'Anna-Maria'),
    (6, 'John_Doe');

-- 查找包含'-'字符的名字
SELECT id, name FROM test_regexp WHERE name REGEXP '-';
```
```text
+------+------------+
| id   | name       |
+------+------------+
|    5 | Anna-Maria |
+------+------------+
```

结尾字符匹配
```sql

SELECT id, name FROM test_regexp WHERE name REGEXP 'e$';
```

```text
+------+---------+
| id   | name    |
+------+---------+
|    1 | Alice   |
|    3 | Charlie |
+------+---------+
```

表情包匹配

```sql
SELECT 'Hello' REGEXP '😀'; 
```

```text
+-----------------------+
| 'Hello' REGEXP '😀'     |
+-----------------------+
|                     0 |
+-----------------------+
```