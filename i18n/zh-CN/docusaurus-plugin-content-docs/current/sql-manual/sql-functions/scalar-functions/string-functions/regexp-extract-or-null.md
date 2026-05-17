---
{
    "title": "REGEXP_EXTRACT_OR_NULL",
    "language": "ZH-CN",
    "description": "从文本字符串中提取与目标正则表达式模式匹配的第一个子字符串，并根据表达式组索引从中提取特定组。"
}
---

## 描述

从文本字符串中提取与目标正则表达式模式匹配的第一个子字符串，并根据表达式组索引从中提取特定组。

需要注意的是，在处理字符集匹配时，应使用 Utf-8 标准字符类。这确保函数能够正确识别和处理来自不同语言的各种字符。

如果 'pattern' 参数不符合正则表达式，则抛出错误

:::info
从 Apache Doris 3.0.2 版本开始支持
:::

默认支持的字符匹配种类 : https://github.com/google/re2/wiki/Syntax

Doris 支持通过会话变量 `enable_extended_regex`（默认为 `false`）来启用更高级的正则表达式功能，例如 look-around 零宽断言。

会话变量`enable_extended_regex`设置为`true`时,
支持的字符匹配种类 : https://www.boost.org/doc/libs/latest/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html

## 语法

```sql
REGEXP_EXTRACT_OR_NULL(<str>, <pattern>, <pos>)
```

## 参数

| Parameter | Description |
| -- | -- |
| `<str>` | 字符串参数。表示要执行正则表达式匹配的文本字符串。此字符串可以包含任意字符组合，函数将在其中搜索与<pattern>匹配的子字符串。 |
| `<pattern>` |字符串参数。它是目标正则表达式模式。此模式可以包含各种正则表达式元字符和字符类，精确定义要匹配的子字符串规则。 |
| `<pos>` |整数参数。表示要提取的表达式组的索引。索引从 1 开始。如果<pos>设置为 0，则返回整个第一个匹配的子字符串。如果<pos>为负数或超过模式中表达式组的数量，函数将返回 NULL |

## 返回值

返回字符串类型，结果为与<pattern>匹配的部分。

 如果输入的<pos>为 0，则返回整个第一个匹配的子字符串。
 如果输入的<pos>无效（负数或超过表达式组数量），则返回 NULL。
 如果正则表达式匹配失败，则返回 NULL。
 如果 `<pos>` < 0,则返回NULL;
 如果 `pos` > 参数字符串`<str>`的长度,返回 NULL;

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

模式修饰符仅在使用默认正则引擎时生效。若启用了 `enable_extended_regex=true` 同时使用零宽断言（如 `(?<=...)`、`(?=...)`），查询将由 Boost.Regex 引擎处理，此时修饰符行为可能与预期不符，建议不要混合使用。

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

## 例子

从匹配中提取特定组,正则表达式([[:lower:]]+)C([[:lower:]]+)查找由 'C' 分隔的一个或多个小写字母序列。索引为 1 的组对应第一个小写字母序列，因此返回 'b'。

```sql
SELECT REGEXP_EXTRACT_OR_NULL('123AbCdExCx', '([[:lower:]]+)C([[:lower:]]+)', 1);
```

```text
+---------------------------------------------------------------------------+
| REGEXP_EXTRACT_OR_NULL('123AbCdExCx', '([[:lower:]]+)C([[:lower:]]+)', 1) |
+---------------------------------------------------------------------------+
| b                                                                         |
+---------------------------------------------------------------------------+
```

返回整个匹配的子字符串当<pos>为 0 时，返回匹配模式的整个第一个子字符串。

```sql
SELECT REGEXP_EXTRACT_OR_NULL('123AbCdExCx', '([[:lower:]]+)C([[:lower:]]+)', 0);
```

```text
+---------------------------------------------------------------------------+
| REGEXP_EXTRACT_OR_NULL('123AbCdExCx', '([[:lower:]]+)C([[:lower:]]+)', 0) |
+---------------------------------------------------------------------------+
| bCd                                                                       |
+---------------------------------------------------------------------------+
```

无效的组索引,由于模式只有 2 个组，索引 5 超出范围，因此返回 NULL。

```sql
SELECT REGEXP_EXTRACT_OR_NULL('123AbCdExCx', '([[:lower:]]+)C([[:lower:]]+)', 5);
```

```text
+---------------------------------------------------------------------------+
| REGEXP_EXTRACT_OR_NULL('123AbCdExCx', '([[:lower:]]+)C([[:lower:]]+)', 5) |
+---------------------------------------------------------------------------+
| NULL                                                                      |
+---------------------------------------------------------------------------+
```
不匹配的正则表达式,字符串 'AbCdE' 中没有部分完全匹配模式

```sql
SELECT REGEXP_EXTRACT_OR_NULL('AbCdE', '([[:lower:]]+)C([[:upper:]]+)', 1);
```

```text
+---------------------------------------------------------------------+
| REGEXP_EXTRACT_OR_NULL('AbCdE', '([[:lower:]]+)C([[:upper:]]+)', 1) |
+---------------------------------------------------------------------+
| NULL                                                                |
+---------------------------------------------------------------------+
```

中文字符匹配,模式(\p{Han}+)(.+)首先匹配一个或多个中文字符，然后匹配任何剩余字符。索引为 2 的组表示中文字符后的非中文部分。

```sql
select REGEXP_EXTRACT_OR_NULL('这是一段中文 This is a passage in English 1234567', '(\\p{Han}+)(.+)', 2);
```

```text
+---------------------------------------------------------------------------------------------------------+
| REGEXP_EXTRACT_OR_NULL('这是一段中文 This is a passage in English 1234567', '(\\p{Han}+)(.+)', 2)       |
+---------------------------------------------------------------------------------------------------------+
|  This is a passage in English 1234567                                                                   |
+---------------------------------------------------------------------------------------------------------+
```

向表中插入数据并执行提取
```sql

CREATE TABLE test_regexp_extract_or_null (
    id INT,
    text_column VARCHAR(255),
    pattern_column VARCHAR(255),
    position_column INT
) PROPERTIES ("replication_num"="1");

INSERT INTO test_regexp_extract_or_null VALUES
(1, 'abc123def', '([a-z]+)([0-9]+)([a-z]+)', 2),
(2, 'Hello World', '([A-Z][a-z]+) ([A-Z][a-z]+)', 0),
(3, '123-456-789', '([0-9]{3})-([0-9]{3})-([0-9]{3})', 3),
(4, 'example@example.com', '([a-z]+)@([a-z]+)\\.([a-z]+)', 1),
(5, '测试文本 test text', '(\\p{Han}+) (.+)', 1);

SELECT id, REGEXP_EXTRACT_OR_NULL(text_column, pattern_column, position_column) AS extracted_result
FROM test_regexp_extract_or_null
ORDER BY id;

```
```text
+------+-----------------+
| id   | extracted_result|
+------+-----------------+
|    1 | 123             |
|    2 | Hello World     |
|    3 | 789             |
|    4 | example         |
|    5 | 测试文本          |
+------+-----------------+
```

emoji字符匹配

```sql
SELECT regexp_extract_or_null('😀😊😎', '😀|😊|😎',0);
```

```text
+------------------------------------------------------------+
| regexp_extract_or_null('😀😊😎', '😀|😊|😎',0)           |
+------------------------------------------------------------+
| 😀                                                          |
+------------------------------------------------------------+
```

'str' 是NULL,返回NULL

```sql
SELECT REGEXP_EXTRACT_OR_NULL(NULL, '([a-z]+)', 1);
```

```text
+---------------------------------------------+
| REGEXP_EXTRACT_OR_NULL(NULL, '([a-z]+)', 1) |
+---------------------------------------------+
| NULL                                        |
+---------------------------------------------+
```

'pattern' 是NULL,返回NULL

```sql
SELECT REGEXP_EXTRACT_OR_NULL('Hello World', NULL, 1);
```

```text
+------------------------------------------------+
| REGEXP_EXTRACT_OR_NULL('Hello World', NULL, 1) |
+------------------------------------------------+
| NULL                                           |
+------------------------------------------------+
```

'pos' 是NULL,返回NULL

```sql
SELECT REGEXP_EXTRACT_OR_NULL('Hello World', '([a-z]+)', NULL);
```

```text
+---------------------------------------------------------+
| REGEXP_EXTRACT_OR_NULL('Hello World', '([a-z]+)', NULL) |
+---------------------------------------------------------+
| NULL                                                    |
+---------------------------------------------------------+
```

全部参数都是NULL,返回NULL

```sql
SELECT REGEXP_EXTRACT_OR_NULL(NULL,NULL,NULL);
```

```text
+----------------------------------------+
| REGEXP_EXTRACT_OR_NULL(NULL,NULL,NULL) |
+----------------------------------------+
| NULL                                   |
+----------------------------------------+
```

如果 'pattern' 参数不符合正则表达式，则抛出错误

```sql
mysql> SELECT REGEXP_EXTRACT_OR_NULL('123AbCdExCx', '([[:lower:]]+)C([[]ower:]]+)', 1);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: ([[:lower:]]+)C([[:lower:]+)
Error: missing ]: [[:lower:]+)
```

高级的正则表达式
```sql
SELECT regexp_extract_or_null('foo123bar', '(?<=foo)(\\d+)(?=bar)', 1);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Invalid regex pattern: (?<=foo)(\d+)(?=bar). Error: invalid perl operator: (?<
```

```sql
SET enable_extended_regex = true;
SELECT regexp_extract_or_null('foo123bar', '(?<=foo)(\\d+)(?=bar)', 1);
```
```text
+-----------------------------------------------------------------+
| regexp_extract_or_null('foo123bar', '(?<=foo)(\\d+)(?=bar)', 1) |
+-----------------------------------------------------------------+
| 123                                                             |
+-----------------------------------------------------------------+
```

模式修饰符

大小写不敏感：`(?i)` 使匹配忽略大小写

```sql
SELECT REGEXP_EXTRACT_OR_NULL('Hello World', '(hello)', 1) AS case_sensitive,
       REGEXP_EXTRACT_OR_NULL('Hello World', '(?i)(hello)', 1) AS case_insensitive;
```

```text
+----------------+------------------+
| case_sensitive | case_insensitive |
+----------------+------------------+
| NULL           | Hello            |
+----------------+------------------+
```

`.` 默认匹配换行符；使用 `(?-s)` 后 `.` 不匹配换行符

```sql
SELECT REGEXP_EXTRACT_OR_NULL('foo\nbar', '^(.+)$', 1) AS dot_match_nl,
       REGEXP_EXTRACT_OR_NULL('foo\nbar', '(?-s)^(.+)$', 1) AS dot_not_match_nl;
```

```text
+--------------+------------------+
| dot_match_nl | dot_not_match_nl |
+--------------+------------------+
| foo
bar      | NULL             |
+--------------+------------------+
```

多行模式：`(?m)` 使 `^` 和 `$` 匹配每行行首/行尾

```sql
SELECT REGEXP_EXTRACT_OR_NULL('foo\nbar', '^(bar)', 1) AS single_line,
       REGEXP_EXTRACT_OR_NULL('foo\nbar', '(?m)^(bar)', 1) AS multi_line;
```

```text
+-------------+------------+
| single_line | multi_line |
+-------------+------------+
| NULL        | bar        |
+-------------+------------+
```

贪婪与非贪婪：`(?U)` 使量词尽可能少地匹配

```sql
SELECT REGEXP_EXTRACT_OR_NULL('aXbXc', '(a.*X)', 1) AS greedy,
       REGEXP_EXTRACT_OR_NULL('aXbXc', '(?U)(a.*X)', 1) AS non_greedy;
```

```text
+--------+------------+
| greedy | non_greedy |
+--------+------------+
| aXbX   | aX         |
+--------+------------+
```