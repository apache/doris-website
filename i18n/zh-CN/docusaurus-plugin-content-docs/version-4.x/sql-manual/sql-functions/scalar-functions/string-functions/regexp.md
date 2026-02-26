---
{
    "title": "REGEXP",
    "language": "zh-CN",
    "description": "对字符串 str 执行正则表达式匹配，匹配成功时返回 true，否则返回 false。pattern 为正则表达式模式。 需要注意的是，在处理字符集匹配时，应使用 Utf-8 标准字符类。这确保函数能够正确识别和处理来自不同语言的各种字符。"
}
---

## 描述

对字符串 str 执行正则表达式匹配，匹配成功时返回 true，否则返回 false。pattern 为正则表达式模式。
需要注意的是，在处理字符集匹配时，应使用 Utf-8 标准字符类。这确保函数能够正确识别和处理来自不同语言的各种字符。

如果 'pattern' 参数不符合正则表达式，则抛出错误

支持的字符匹配种类 : https://github.com/google/re2/wiki/Syntax

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

**默认行为**：

| 默认配置 | 行为说明 |
| -------- | -------- |
| `.` 匹配换行符 | `.` 默认可以匹配 `\n`（换行符）。 |
| 大小写敏感 | 匹配时区分大小写。 |
| `^`/`$` 匹配整个字符串边界 | `^` 仅匹配字符串开头，`$` 仅匹配字符串结尾，而非每行的行首/行尾。 |
| 量词贪婪 | `*`、`+` 等量词默认尽可能多地匹配。 |
| UTF-8 | 字符串按 UTF-8 处理。 |

**模式修饰符**：

可通过在 `pattern` 前缀写入 `(?flags)` 来覆盖默认行为。多个修饰符可组合，如 `(?im)`；`-` 前缀表示关闭对应选项，如 `(?-s)`。

| 标志 | 含义 |
| ---- | ---- |
| `(?i)` | 大小写不敏感匹配 |
| `(?-i)` | 大小写敏感（默认） |
| `(?s)` | `.` 匹配换行符（默认已开启） |
| `(?-s)` | `.` 不匹配换行符 |
| `(?m)` | 多行模式：`^` 匹配每行行首，`$` 匹配每行行尾 |
| `(?-m)` | 单行模式：`^`/`$` 匹配整个字符串首尾（默认） |
| `(?U)` | 量词非贪婪：`*`、`+` 等尽可能少地匹配 |
| `(?-U)` | 量词贪婪（默认）：`*`、`+` 等尽可能多地匹配 |

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
-- Find names ending with 'e'
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

emoji字符匹配

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

'str' 是NULL值，则返回NULL值

```sql
mysql> SELECT REGEXP(NULL, '^billie');
+-------------------------+
| REGEXP(NULL, '^billie') |
+-------------------------+
|                    NULL |
+-------------------------+
```

'pattern' 是NULL值，则返回NULL值

```sql
mysql> SELECT REGEXP('billie eillish', NULL);
+--------------------------------+
| REGEXP('billie eillish', NULL) |
+--------------------------------+
|                           NULL |
+--------------------------------+
```

所有参数都是NULL值，则返回NULL值

```sql
mysql> SELECT REGEXP(NULL, NULL);
+--------------------+
| REGEXP(NULL, NULL) |
+--------------------+
|               NULL |
+--------------------+
```

如果 'pattern' 参数不符合正则表达式，则抛出错误

```sql
SELECT REGEXP('Hello, World!', '([a-z');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INTERNAL_ERROR]Invalid regex expression: ([a-z
```

模式修饰符

大小写不敏感匹配：`(?i)` 使匹配忽略大小写

```sql
SELECT REGEXP('Hello World', 'hello') AS case_sensitive, REGEXP('Hello World', '(?i)hello') AS case_insensitive;
```

```text
+----------------+------------------+
| case_sensitive | case_insensitive |
+----------------+------------------+
|              0 |                1 |
+----------------+------------------+
```

`.` 默认匹配换行符；使用 `(?-s)` 后 `.` 不匹配换行符

```sql
SELECT REGEXP('foo\nbar', '^.+$') AS dot_match_nl, REGEXP('foo\nbar', '(?-s)^.+$') AS dot_not_match_nl;
```

```text
+--------------+------------------+
| dot_match_nl | dot_not_match_nl |
+--------------+------------------+
|            1 |                0 |
+--------------+------------------+
```

多行模式：`(?m)` 使 `^` 和 `$` 匹配每行行首/行尾

```sql
SELECT REGEXP('foo\nbar', '^bar') AS single_line, REGEXP('foo\nbar', '(?m)^bar') AS multi_line;
```

```text
+-------------+------------+
| single_line | multi_line |
+-------------+------------+
|           0 |          1 |
+-------------+------------+
```

贪婪与非贪婪：`(?U)` 使量词尽可能少地匹配

```sql
SELECT REGEXP_EXTRACT('aXbXc', '(a.*X)', 1) AS greedy,
       REGEXP_EXTRACT('aXbXc', '(?U)(a.*X)', 1) AS non_greedy;
```

```text
+--------+------------+
| greedy | non_greedy |
+--------+------------+
| aXbX   | aX         |
+--------+------------+
```

