---
{
    "title": "REGEXP",
    "language": "zh-CN",
    "description": "对字符串 str 执行正则表达式匹配，匹配成功时返回 true，否则返回 false。pattern 为正则表达式模式。 需要注意的是，在处理字符集匹配时，应使用 Utf-8 标准字符类。这确保函数能够正确识别和处理来自不同语言的各种字符。"
}
---

## 描述

对字符串 `<str>` 执行正则表达式匹配，匹配成功返回 true，否则返回 false。模式不必匹配整个字符串；需要完整匹配时使用 `^` 和 `$`。任一参数为 NULL 时返回 NULL，非法模式会报错。字符串按 UTF-8 处理，匹配 Unicode 字符类别时可使用 `\p{Han}` 等字符类。

常规模式的语法请参阅 [RE2 语法](https://github.com/google/re2/wiki/Syntax)。

### 匹配引擎和会话变量

普通 `LIKE`、`REGEXP` 匹配可使用 Hyperscan 加速，并根据下列会话变量选择回退行为：

| 会话变量 | 默认值 | 作用 |
| --- | --- | --- |
| `enable_hyperscan_fallback` | `true` | Doris 4.1 系列自 4.1.5 起支持。实际采用 Hyperscan 编译的路径遇到编译失败或无法分配匹配空间时，允许回退到 RE2；为 `false` 时直接返回对应错误。简单模式优化或直接使用 RE2 的路径不受此开关控制。 |
| `enable_extended_regex` | `false` | `REGEXP` 的模式被 RE2 拒绝时，允许进一步使用 Boost.Regex，以支持 look-around 等扩展语法。此变量不改变 RE2 的语法能力，也不为 `LIKE`、`MATCH_REGEXP` 或 `MULTI_MATCH_ANY` 增加扩展语法。 |

Doris 4.1 系列自 4.1.5 起，`enable_extended_regex=true` 对常量模式和从列中读取的非常量模式均生效。使用 Hyperscan 的路径若已设置 `enable_hyperscan_fallback=false`，仍会在 Hyperscan 失败时返回错误，不能靠开启 `enable_extended_regex` 绕过该错误。

`enable_hyperscan_fallback` 的取值和作用域也可查阅[会话变量列表](../../../basic-element/session-variables.md#enable_hyperscan_fallback)。

Boost.Regex 的语法请参阅 [Perl 语法说明](https://www.boost.org/doc/libs/latest/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html)。仅在实际使用 Boost.Regex 时，才承担该引擎的匹配开销；复杂的回溯模式也可能报错 `Failed to match regex expression`。

### 重复次数限制

Doris 4.1 系列自 4.1.5 起，在提交给 Hyperscan 的正则模式中检测到 `{m}`、`{m,}` 或 `{m,n}` 形式包含大于 50 的数值时，会跳过 Hyperscan 编译。例如，`a{51}`、`a{51,}`、`a{0,51}` 会触发此检查，`a{50}` 和 `a{0,50}` 不会。这是保守的文本检查，字符类或注释中出现相同形式也可能触发。

| 匹配路径 | 检测到上述模式后的行为 |
| --- | --- |
| 普通 `LIKE`、`REGEXP` 的 Hyperscan 路径 | `enable_hyperscan_fallback=true` 时尝试回退；为 `false` 时返回错误。回退后的模式仍须满足目标引擎的语法和数量限制。 |
| `MATCH_REGEXP` 的行匹配和倒排索引正则匹配 | 直接拒绝，不使用 `enable_hyperscan_fallback` 回退。 |
| `MULTI_MATCH_ANY` 的多模式匹配 | 直接拒绝，不使用 `enable_hyperscan_fallback` 回退。 |

触发检查且未回退时，错误信息包含：

```text
Skip hyperscan compilation because bounded repetition exceeds 50
```

## 语法

```sql
REGEXP(<str>, <pattern>)
<str> [NOT] REGEXP <pattern>
<str> [NOT] RLIKE <pattern>
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<str>` | 字符串类型。表示要执行正则表达式匹配的字符串，可以是表中的列或字面值字符串。|
| `<pattern>` | 字符串类型。用于与字符串 `<str>` 匹配的正则表达式模式。正则表达式提供了定义复杂搜索模式的强大方式，包括字符类、量词和锚点。|

## 返回值

REGEXP 函数返回布尔值（BOOLEAN）。如果字符串 `<str>` 匹配正则表达式模式 `<pattern>`，函数返回 true（在 SQL 中表示为 1）；如果不匹配，返回 false（在 SQL 中表示为 0）。任一参数为 NULL 时返回 NULL。

Doris 4.1 系列自 4.1.5 起修复常量空模式的匹配，使其与列模式一致：空模式对任意非 NULL 字符串（包括空字符串）都返回 true。

**默认行为**：

| 默认配置                   | 行为说明                                                          |
| -------------------------- | ----------------------------------------------------------------- |
| `.` 匹配换行符             | `.` 默认可以匹配 `\n`（换行符）。                                 |
| 大小写敏感                 | 匹配时区分大小写。                                                |
| `^`/`$` 匹配整个字符串边界 | `^` 仅匹配字符串开头，`$` 仅匹配字符串结尾，而非每行的行首/行尾。 |
| 量词贪婪                   | `*`、`+` 等量词默认尽可能多地匹配。                               |
| UTF-8                      | 字符串按 UTF-8 处理。                                             |

**模式修饰符**：

可通过在 `pattern` 前缀写入 `(?flags)` 来覆盖默认行为。多个修饰符可组合，如 `(?im)`；`-` 前缀表示关闭对应选项，如 `(?-s)`。

下表描述常规 Hyperscan/RE2 路径的模式修饰符。若模式因零宽断言等语法回退到 Boost.Regex，应按 Boost.Regex 的语法解释修饰符，不能假定两种引擎的行为完全一致。

| 标志    | 含义                                         |
| ------- | -------------------------------------------- |
| `(?i)`  | 大小写不敏感匹配                             |
| `(?-i)` | 大小写敏感（默认）                           |
| `(?s)`  | `.` 匹配换行符（默认已开启）                 |
| `(?-s)` | `.` 不匹配换行符                             |
| `(?m)`  | 多行模式：`^` 匹配每行行首，`$` 匹配每行行尾 |
| `(?-m)` | 单行模式：`^`/`$` 匹配整个字符串首尾（默认） |
| `(?U)`  | 量词非贪婪：`*`、`+` 等尽可能少地匹配        |
| `(?-U)` | 量词贪婪（默认）：`*`、`+` 等尽可能多地匹配  |

<a id="例子"></a>

## 示例

```sql
CREATE TABLE test ( k1 VARCHAR(255) ) properties("replication_num"="1");

INSERT INTO test (k1) VALUES ('billie eillish'), ('It\'s ok'), ('billie jean'), ('hello world');
```


```sql
--- 查找k1字段中以'billie'开头的所有数据
SELECT k1 FROM test WHERE k1 REGEXP '^billie' ORDER BY k1;
```

```text
+----------------+
| k1             |
+----------------+
| billie eillish |
| billie jean    |
+----------------+
```

```sql
--- 查找k1字段中以'ok'结尾的数据：
SELECT k1 FROM test WHERE k1 REGEXP 'ok$';
```

```text
+---------+
| k1      |
+---------+
| It's ok |
+---------+
```
中文测试

```sql
select regexp('这是一段中文 This is a passage in English 1234567', '\\p{Han}');
```

```text
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
SELECT id, name FROM test_regexp WHERE name REGEXP 'e$' ORDER BY id;
```

```text
+------+----------+
| id   | name     |
+------+----------+
|    1 | Alice    |
|    3 | Charlie  |
|    6 | John_Doe |
+------+----------+
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

空模式匹配任意非 NULL 字符串，包括空字符串：

```sql
SELECT REGEXP('abc', ''), REGEXP('', ''), REGEXP(NULL, '');
```

```text
1    1    NULL
```

'str' 是NULL值，则返回NULL值

```sql
SELECT REGEXP(NULL, '^billie');
```

```text
+-------------------------+
| REGEXP(NULL, '^billie') |
+-------------------------+
|                    NULL |
+-------------------------+
```

'pattern' 是NULL值，则返回NULL值

```sql
SELECT REGEXP('billie eillish', NULL);
```

```text
+--------------------------------+
| REGEXP('billie eillish', NULL) |
+--------------------------------+
|                           NULL |
+--------------------------------+
```

所有参数都是NULL值，则返回NULL值

```sql
SELECT REGEXP(NULL, NULL);
```

```text
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

高级正则表达式需要开启扩展语法，普通 RE2 回退本身不支持 look-around：

```sql
SET enable_hyperscan_fallback = true;
SET enable_extended_regex = true;
SELECT REGEXP('foobar', '(?<=foo)bar');
```

```text
1
```

非常量模式也可使用扩展语法（Doris 4.1 系列自 4.1.5 起）：

```sql
CREATE TABLE regexp_patterns (
    id INT,
    s VARCHAR(32),
    p VARCHAR(64)
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO regexp_patterns VALUES
    (1, 'foobar', '(?<=foo)bar'),
    (2, 'fobar', '(?<=foo)bar'),
    (3, 'foo123bar', 'foo(?=123)'),
    (4, 'foo124bar', 'foo(?=123)');

SELECT id, REGEXP(s, p) FROM regexp_patterns ORDER BY id;
```

```text
1    1
2    0
3    1
4    0
```

还原会话设置，再查看下面的常规语法示例：

```sql
SET enable_extended_regex = false;
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
