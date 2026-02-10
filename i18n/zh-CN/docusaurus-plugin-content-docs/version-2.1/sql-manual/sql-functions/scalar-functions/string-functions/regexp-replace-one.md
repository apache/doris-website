---
{
    "title": "REGEXP_REPLACE_ONE",
    "language": "zh-CN",
    "description": "REGEXPREPLACEONE 函数是一个强大的工具，用于对给定字符串执行正则表达式匹配。它允许您查找并替换字符串中首次出现的特定模式。"
}
---

## 描述

REGEXP_REPLACE_ONE 函数是一个强大的工具，用于对给定字符串执行正则表达式匹配。它允许您查找并替换字符串中首次出现的特定模式。

在处理文本数据时，您经常需要根据特定规则操作字符串。正则表达式提供了一种灵活高效的方式来定义这些规则。此函数接受一个字符串 str、一个正则表达式模式 pattern 和一个替换字符串 repl。然后，它会在 str 中搜索首个匹配pattern的部分，并将其替换为repl。

需要注意的是，在处理字符集匹配时，应使用 Utf-8 标准字符类。这确保函数能够正确识别和处理来自不同语言的各种字符。

如果 'pattern' 参数不符合正则表达式，则抛出错误

支持的字符匹配种类 : https://github.com/google/re2/wiki/Syntax

## 语法

```sql
REGEXP_REPLACE_ONE(<str>, <pattern>, <repl>)
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<str>` | 此参数为字符串类型。表示要执行正则表达式匹配的字符串。这是您想要修改的目标字符串。|
| `<pattern>` | 此参数也为字符串类型。它是一个正则表达式模式。函数将在 <str> 字符串中搜索此模式的首次出现。|
| `<repl>` | 这也是一个字符串参数。它包含将替换 <str> 中首个匹配 <pattern> 部分的字符串。|

## 返回值

函数返回替换操作后的结果字符串。返回类型为 Varchar。如果 <str> 中没有部分匹配 <pattern>，则返回原始的 <str>。

## 示例

将首个空格替换为连字符,在此示例中，输入字符串 <str> 为 'a b c'，正则表达式模式 <pattern> 为单个空格 ' '，替换字符串 <repl> 为连字符 '-'。函数在字符串 'a b c' 中搜索首个空格，并将其替换为连字符。因此输出为 'a-b c'。

```sql
mysql> SELECT regexp_replace_one('a b c', ' ', '-');

+-----------------------------------+
| regexp_replace_one('a b c', ' ', '-') |
+-----------------------------------+
| a-b c                             |
+-----------------------------------+
```

替换首个匹配组,这里，输入字符串 <str> 为 'a b b'，正则表达式模式 <pattern> 为 '(b)'，这是一个匹配字符 'b' 的捕获组。替换字符串 <repl> 为 '<\1>'，其中 \1 指第一个捕获组（在本例中，即匹配的 'b'）。函数在字符串 'a b b' 中找到首个 'b'，并将其替换为'<b>'。因此，输出为 'a <b> b'


```sql
mysql> SELECT regexp_replace_one('a b b', '(b)', '<\\1>');
+----------------------------------------+
| regexp_replace_one('a b b', '(b)', '<\1>') |
+----------------------------------------+
| a <b> b                                |
+----------------------------------------+
```
替换首个中文字符,输入字符串 <str> 是一个包含中文字符和英文文本的长字符串。正则表达式模式 <pattern> 为 '\p {Han}'，这是一个匹配任何中文字符的 Unicode 字符类。替换字符串 <repl> 为 '123'。函数在字符串中搜索首个中文字符，并将其替换为 '123'。因此输出为 '123 是一段中文 This is a passage in English 1234567'

```sql
mysql> select regexp_replace_one('这是一段中文 This is a passage in English 1234567', '\\p{Han}', '123');
+------------------------------------------------------------------------------------------------+
| regexp_replace_one('这是一段中文 This is a passage in English 1234567', '\p{Han}', '123')       |
+------------------------------------------------------------------------------------------------+
| 123是一段中文This is a passage in English 1234567                                              |
+------------------------------------------------------------------------------------------------+
```

Insert data into a table and perform replacement。创建一个名为 test_table_for_regexp_replace_one 的表，包含四列：id（整数）、text_data（要执行替换的字符串）、pattern（用于匹配的正则表达式模式）和 repl（替换字符串）。 然后，向表中插入十行数据，每行包含四列的不同值。 最后，使用 SELECT 语句查询表。对于每一行，使用相应的 pattern 和 repl 值对 text_data 列应用 REGEXP_REPLACE_ONE 函数。替换结果别名为 replaced_result。行按 id 列排序

```sql
CREATE TABLE test_table_for_regexp_replace_one (
        id INT,
        text_data VARCHAR(500),
        pattern VARCHAR(100),
        repl VARCHAR(100)
    ) PROPERTIES ("replication_num"="1");

INSERT INTO test_table_for_regexp_replace_one VALUES
    (1, 'Hello World', ' ', '-'),    
    (2, 'apple123', '[0-9]', 'X'),    
    (3, 'aabbcc', '(aa)', 'AA'),         
    (4, '123-456-7890', '[0-9][0-9][0-9]', 'XXX'), 
    (5, 'test,data', ',', ';'),              
    (6, 'a1b2c3', '[a-z][0-9]', 'X'),         
    (7, 'book keeper', 'oo', 'OO'),        
    (8, 'ababab', '(ab)', 'AB'),       
    (9, 'aabbcc', '(bb)', 'BB'),         
    (10, 'apple,banana', '[aeiou]', 'X');

SELECT id, regexp_replace_one(text_data, pattern, repl) as replaced_result FROM test_table_for_regexp_replace_one ORDER BY id;
```

```text
+------+-----------------+
| id   | replaced_result |
+------+-----------------+
|    1 | Hello-World     |
|    2 | appleX23        |
|    3 | AAbbcc          |
|    4 | XXX-456-7890    |
|    5 | test;data       |
|    6 | Xb2c3           |
|    7 | BOOk keeper     |
|    8 | ABabab          |
|    9 | aaBBcc          |
|   10 | Xpple,banana    |
+------+-----------------+
```


emoji字符替换

```sql 
SELECT regexp_replace_one('😀😊😀', '😀|😊', '[SMILE]');
```

```text
+------------------------------------------------------------+
| regexp_replace_one('😀😊😀', '😀|😊', '[SMILE]')                     |
+------------------------------------------------------------+
| [SMILE]😊😀                                                    |
+------------------------------------------------------------+
```

'str' 是NULL,则返回NULL
```sql
mysql> SELECT REGEXP_REPLACE_ONE(NULL, ' ', '-');
+------------------------------------+
| REGEXP_REPLACE_ONE(NULL, ' ', '-') |
+------------------------------------+
| NULL                               |
+------------------------------------+
```

'pattern' 是NULL,则返回NULL

```sql
mysql> SELECT REGEXP_REPLACE_ONE('Hello World', NULL, '-');
+----------------------------------------------+
| REGEXP_REPLACE_ONE('Hello World', NULL, '-') |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```
'repl' 是NULL,则返回NULL

```sql
mysql> SELECT REGEXP_REPLACE_ONE('Hello World', ' ', NULL);
+----------------------------------------------+
| REGEXP_REPLACE_ONE('Hello World', ' ', NULL) |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```

全部参数是NULL，则返回NULL

```sql
mysql> SELECT REGEXP_REPLACE_ONE(NULL, NULL, NULL);
+--------------------------------------+
| REGEXP_REPLACE_ONE(NULL, NULL, NULL) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```

如果 'pattern' 参数不符合正则表达式，则抛出错误


```sql
SELECT regexp_replace_one('a b b', '(b', '<\\1>');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: (b
Error: missing ): (b

```