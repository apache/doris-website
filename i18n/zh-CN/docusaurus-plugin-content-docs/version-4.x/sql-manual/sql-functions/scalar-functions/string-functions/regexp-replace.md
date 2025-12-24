---
{
    "title": "REGEXP_REPLACE",
    "language": "zh-CN",
    "description": "对 STR 字符串进行正则匹配，将匹配 pattern 的部分替换为新字符串。"
}
---

## 描述

对 STR 字符串进行正则匹配，将匹配 pattern 的部分替换为新字符串。

需要注意的是，在处理字符集匹配时，应使用 Utf-8 标准字符类。这确保函数能够正确识别和处理来自不同语言的各种字符。

如果 'pattern' 参数不符合正则表达式，则抛出错误

支持的字符匹配种类 : https://github.com/google/re2/wiki/Syntax

## 语法

```sql
REGEXP_REPLACE(<str>, <pattern>, <repl>)
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<str>` | 此参数为 Varchar 类型。表示要执行正则表达式匹配的字符串。可以是字面量字符串或包含字符串值的表列。|
| `<pattern>` | 此参数为 Varchar 类型。是用于匹配字符串的正则表达式模式。该模式可以包含各种正则表达式元字符和构造，以定义复杂的匹配规则。|
| `<repl>` | 此参数为 Varchar 类型。是将替换 <str> 中匹配 <pattern> 部分的字符串。如果想引用模式中捕获的组，可以使用 \1、\2 等反向引用，其中 \1 指第一个捕获组，\2 指第二个捕获组，依此类推。|

## 返回值

函数返回替换操作后的结果字符串。返回值为 Varchar 类型。如果 <str> 中没有部分匹配 <pattern> ，则返回原始的 <str>。

## 示例

测试基本替换示例,在此示例中，字符串 'a b c' 中的所有空格都被替换为连字符。

```sql
mysql> SELECT regexp_replace('a b c', ' ', '-');
+-----------------------------------+
| regexp_replace('a b c', ' ', '-') |
+-----------------------------------+
| a-b-c                             |
+-----------------------------------+
```
测试使用捕获组,这里，字符 'b' 被模式中的组 (b) 捕获，然后使用替换字符串中的反向引用 \1 将其替换为<b>

```sql
mysql> SELECT regexp_replace('a b c', '(b)', '<\\1>');
+----------------------------------------+
| regexp_replace('a b c', '(b)', '<\1>') |
+----------------------------------------+
| a <b> c                                |
+----------------------------------------+
```
测试匹配中文字符,此示例将字符串中所有连续的中文字符替换为 '123'

```sql
mysql> select regexp_replace('这是一段中文 This is a passage in English 1234567', '\\p{Han}+', '123');
+---------------------------------------------------------------------------------------------+
| regexp_replace('这是一段中文 This is a passage in English 1234567', '\p{Han}+', '123')       |
+---------------------------------------------------------------------------------------------+
| 123This is a passage in English 1234567                                                     |
+---------------------------------------------------------------------------------------------+
```

插入和测试用例,在这组测试用例中，我们创建一个表来存储原始字符串、模式和替换字符串。然后插入各种测试数据，并使用相应的模式和替换字符串对原始字符串执行 REGEXP_REPLACE 操作。最后，我们检索并显示替换后的字符串。

```sql
-- 创建一个表来存储测试数据
CREATE TABLE test_table_for_regexp_replace (
        id INT,
        original_text VARCHAR(500),
        pattern VARCHAR(100),
        replacement VARCHAR(100)
    ) PROPERTIES ("replication_num"="1");

--  插入测试数据
INSERT INTO test_table_for_regexp_replace VALUES
    (1, 'Hello, World!', ',', '-'),    
    (2, 'apple123', '[0-9]', '*'),    
    (3, 'aabbcc', '(aa|bb|cc)', 'XX'),         
    (4, '123-456-7890', '-', ' '), 
    (5, 'test,data', ',', ';'),              
    (6, 'a1b2c3', '[0-9]', '#'),         
    (7, 'book keeper', 'oo|ee', '**'),        
    (8, 'ababab', '(ab)', 'XY'),       
    (9, 'aabbcc', '(aa|bb|cc)', 'ZZ'),         
    (10, 'apple,banana', ',', ' - ');

-- 对插入的数据执行替换操作
SELECT id, regexp_replace(original_text, pattern, replacement) as replaced_text FROM test_table_for_regexp_replace ORDER BY id;
```

```text
+------+------------------+
| id   | replaced_text    |
+------+------------------+
|    1 | Hello- World!    |
|    2 | apple***         |
|    3 | XXXXYY           |
|    4 | 123 456 7890     |
|    5 | test;data        |
|    6 | a#b#c#           |
|    7 | b**k k**per      |
|    8 | XYXYXY           |
|    9 | ZZZZYY           |
|   10 | apple - banana   |
+------+------------------+
```


emoji字符替换

```sql
SELECT regexp_replace('🌍 Earth 🍔 Food', '🌍|🍔', '*');
```

```text
+----------------------------------------------------------+
| regexp_replace('🌍 Earth 🍔 Food', '🌍|🍔', '*')                 |
+----------------------------------------------------------+
| * Earth * Food                                           |
+----------------------------------------------------------+
```


'str' 是NULL值，返回NULL值

```sql
mysql> SELECT REGEXP_REPLACE(NULL, ' ', '-');
+--------------------------------+
| REGEXP_REPLACE(NULL, ' ', '-') |
+--------------------------------+
| NULL                           |
+--------------------------------+
```

'pattern' 是NULL值，则返回NULL值

```sql
mysql> SELECT REGEXP_REPLACE('Hello World', NULL, '-');
+------------------------------------------+
| REGEXP_REPLACE('Hello World', NULL, '-') |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+
```

'repl' 是NULL值，则返回NULL值

```sql
mysql> SELECT REGEXP_REPLACE('Hello World', ' ', NULL);
+------------------------------------------+
| REGEXP_REPLACE('Hello World', ' ', NULL) |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+
```

全部参数都是NULL值，返回NULL

```sql
mysql> SELECT REGEXP_REPLACE(NULL, NULL, NULL);
+----------------------------------+
| REGEXP_REPLACE(NULL, NULL, NULL) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

如果 'pattern' 参数不符合正则表达式，则抛出错误

```sql
SELECT regexp_replace('a b c', '(b', '<\\1>');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: (b
Error: missing ): (b

```