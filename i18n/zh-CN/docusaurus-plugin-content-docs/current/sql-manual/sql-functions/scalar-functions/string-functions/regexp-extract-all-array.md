---
{
    "title": "REGEXP_EXTRACT_ALL_ARRAY",
    "language": "zh-CN",
    "description": "REGEXP_EXTRACT_ALL_ARRAY 函数用于正则匹配并返回第一个子模式捕获到的全部结果数组。"
}
---

## 描述

`REGEXP_EXTRACT_ALL_ARRAY` 函数用于对字符串 `str` 执行正则匹配，并返回 `pattern` 中第一个子模式捕获到的全部结果数组。

如果没有匹配，或者模式中没有子模式，则返回空数组。

默认支持的字符匹配语法： https://github.com/google/re2/wiki/Syntax

Doris 支持通过会话变量 `enable_extended_regex`（默认 `false`）启用高级正则能力（如 look-around 零宽断言）。

当 `enable_extended_regex=true` 时，支持的语法参见 Boost.Regex： https://www.boost.org/doc/libs/latest/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html

## 语法

```sql
REGEXP_EXTRACT_ALL_ARRAY(<str>, <pattern>)
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<str>` | 待匹配的输入字符串。 |
| `<pattern>` | 正则表达式。函数提取第一个捕获组的所有匹配结果。 |

## 返回值

返回 `ARRAY<STRING>`。

若未匹配到结果，返回 `[]`。

任一参数为 null， 返回 null

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

## 示例

围绕 'C' 的小写字母基本匹配,在这个示例中，模式([[:lower:]]+)C([[:lower:]]+)匹配字符串中一个或多个小写字母后跟 'C' 再跟一个或多个小写字母的部分。'C' 之前的第一个子模式([[:lower:]]+)匹配 'b'，因此结果为['b']。

```sql
SELECT regexp_extract_all_array('AbCdE', '([[:lower:]]+)C([[:lower:]]+)') AS res;
+-------+
| res   |
+-------+
| ["b"] |
+-------+
```

返回类型为Array<String>
```sql
SELECT 
    array_size(
        regexp_extract_all_array('AbCdE', '([[:lower:]]+)C([[:lower:]]+)') 
    )AS res_size;
+----------+
| res_size |
+----------+
|        1 |
+----------+
```

字符串中的多个匹配项,在这里，模式在字符串中匹配两个部分。第一个匹配的第一个子模式匹配 'b'，第二个匹配的第一个子模式匹配 'f'。因此结果为['b', 'f']。

```sql
SELECT regexp_extract_all_array('AbCdEfCg', '([[:lower:]]+)C([[:lower:]]+)') AS res;
+------------+
| res        |
+------------+
| ["b", "f"] |
+------------+
```

从键值对中提取键, 该模式匹配字符串中的键值对。第一个子模式捕获键，因此结果为 ['abc', 'def', 'ghi']。

```sql
SELECT regexp_extract_all_array('abc=111, def=222, ghi=333','("[^"]+"|\\w+)=("[^"]+"|\\w+)') AS res;
+-----------------------+
| res                   |
+-----------------------+
| ["abc", "def", "ghi"] |
+-----------------------+
```

匹配汉字, 模式(\p{Han}+)(.+)首先通过第一个子模式(\p{Han}+)匹配一个或多个汉字，因此结果为['这是一段中文']。

```sql
SELECT regexp_extract_all_array('这是一段中文 This is a passage in English 1234567', '(\\p{Han}+)(.+)') AS res;
+------------------------+
| res                    |
+------------------------+
| ["这是一段中文"]       |
+------------------------+
```

插入数据并使用 REGEXP_EXTRACT_ALL

```sql
CREATE TABLE test_regexp_extract_all_array (
    id INT,
    text_content VARCHAR(255),
    pattern VARCHAR(255)
) PROPERTIES ("replication_num"="1");

INSERT INTO test_regexp_extract_all_array VALUES
(1, 'apple1, banana2, cherry3', '([a-zA-Z]+)\\d'),
(2, 'red#123, blue#456, green#789', '([a-zA-Z]+)#\\d+'),
(3, 'hello@example.com, world@test.net', '([a-zA-Z]+)@');

SELECT id, regexp_extract_all_array(text_content, pattern) AS extracted_data
FROM test_regexp_extract_all_array;
+------+-------------------------------+
| id   | extracted_data                |
+------+-------------------------------+
|    1 | ["apple", "banana", "cherry"] |
|    2 | ["red", "blue", "green"]      |
|    3 | ["hello", "world"]            |
+------+-------------------------------+
```

没有匹配到，返回空字符串

```sql
SELECT REGEXP_EXTRACT_ALL_ARRAY('ABC', '(\\d+)');
+-------------------------------------------+
| REGEXP_EXTRACT_ALL_ARRAY('ABC', '(\\d+)') |
+-------------------------------------------+
| []                                        |
+-------------------------------------------+
```
emoji字符匹配

```sql
SELECT REGEXP_EXTRACT_ALL_ARRAY('👩‍💻,👨‍🚀', '(💻|🚀)') AS res;
+------------------+
| res              |
+------------------+
| ["💻", "🚀"]         |
+------------------+
```

'Str' 是 NULL,返回 NULL

```sql
SELECT regexp_extract_all_array(NULL, '([a-z]+)') AS res;
+------+
| res  |
+------+
| NULL |
+------+
```

'pattern' 是 NULL,返回 NULL

```sql
SELECT regexp_extract_all_array('Hello World', NULL) AS res;
+------+
| res  |
+------+
| NULL |
+------+
```

全部参数都是 NULL，返回 NULL

```sql
SELECT regexp_extract_all_array(NULL, NULL) AS res;
+------+
| res  |
+------+
| NULL |
+------+
```

如果 'pattern' 参数不符合正则表达式，则抛出错误

```sql
SELECT regexp_extract_all_array('hello (world) 123', '([[:alpha:]+') AS res;
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Invalid regex pattern: ([[:alpha:]+. Error: missing ]: [[:alpha:]+. If you need advanced regex features, try setting enable_extended_regex=true
```

高级的正则表达式

```sql
SELECT REGEXP_EXTRACT_ALL_ARRAY('ID:AA-1,ID:BB-2,ID:CC-3', '(?<=ID:)([A-Z]{2}-\\d)');
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Invalid regex pattern: (?<=ID:)([A-Z]{2}-\d). Error: invalid perl operator: (?<. If you need advanced regex features, try setting enable_extended_regex=true
```

```sql
SET enable_extended_regex = true;
SELECT REGEXP_EXTRACT_ALL_ARRAY('ID:AA-1,ID:BB-2,ID:CC-3', '(?<=ID:)([A-Z]{2}-\\d)') AS res;
+--------------------------+
| res                      |
+--------------------------+
| ["AA-1", "BB-2", "CC-3"] |
+--------------------------+
```

模式修饰符

大小写不敏感：`(?i)` 使匹配忽略大小写

```sql
SELECT REGEXP_EXTRACT_ALL_ARRAY('Hello hello HELLO', '(hello)') AS case_sensitive,
       REGEXP_EXTRACT_ALL_ARRAY('Hello hello HELLO', '(?i)(hello)') AS case_insensitive;
+----------------+-----------------------------+
| case_sensitive | case_insensitive            |
+----------------+-----------------------------+
| ["hello"]      | ["Hello", "hello", "HELLO"] |
+----------------+-----------------------------+
```

多行模式：`(?m)` 使 `^` 和 `$` 匹配每行行首/行尾
```sql
SELECT REGEXP_EXTRACT_ALL_ARRAY('foo\nbar\nbaz', '^([a-z]+)') AS single_line,
       REGEXP_EXTRACT_ALL_ARRAY('foo\nbar\nbaz', '(?m)^([a-z]+)') AS multi_line;
+-------------+---------------------+
| single_line | multi_line          |
+-------------+---------------------+
| ['foo']     | ['foo','bar','baz'] |
+-------------+---------------------+
```

贪婪与非贪婪：`(?U)` 使量词尽可能少地匹配
```sql
SELECT REGEXP_EXTRACT_ALL('aXbXcXd', '(a.*X)') AS greedy,
       REGEXP_EXTRACT_ALL('aXbXcXd', '(?U)(a.*X)') AS non_greedy;
+----------+------------+
| greedy   | non_greedy |
+----------+------------+
| ['aXbXcX'] | ['aX']   |
+----------+------------+
```
