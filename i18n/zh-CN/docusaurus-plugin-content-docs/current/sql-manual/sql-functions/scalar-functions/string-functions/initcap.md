---
{
    "title": "INITCAP",
    "language": "zh-CN"
}
---

## 描述

INITCAP 函数用于将字符串中每个单词的首字母转换为大写，其余字母转换为小写。单词被定义为由非字母数字字符分隔的字母数字字符序列。该函数适用于格式化名称、标题等需要标准大小写格式的场景。

## 语法

```sql
INITCAP(<str>)
```

## 参数

| 参数      | 说明        |
|---------|-----------|
| `<str>` | 需要转换大小写格式的字符串。类型：VARCHAR |

## 返回值

返回 VARCHAR 类型，表示转换后的字符串。

转换规则：
- 每个单词的第一个字母转换为大写
- 单词中的其余字母转换为小写
- 单词由非字母数字字符（空格、标点、符号等）分隔
- 数字字符不进行大小写转换
- 支持 Unicode 字符的大小写转换

特殊情况：
- 如果参数为 NULL，返回 NULL
- 如果字符串为空，返回空字符串
- 连续的非字母数字字符被视为单个分隔符
- 字符串开头的字母会被大写化

## 示例

1. 基本单词首字母大写
```sql
SELECT INITCAP('hello world');
```
```text
+------------------------+
| INITCAP('hello world') |
+------------------------+
| Hello World            |
+------------------------+
```

2. 混合大小写转换
```sql
SELECT INITCAP('hELLo WoRLD');
```
```text
+------------------------+
| INITCAP('hELLo WoRLD') |
+------------------------+
| Hello World            |
+------------------------+
```

3. NULL 值处理
```sql
SELECT INITCAP(NULL);
```
```text
+---------------+
| INITCAP(NULL) |
+---------------+
| NULL          |
+---------------+
```

4. 空字符串处理
```sql
SELECT INITCAP('');
```
```text
+-------------+
| INITCAP('') |
+-------------+
|             |
+-------------+
```

5. 包含数字和符号的字符串
```sql
SELECT INITCAP('hello hello.,HELLO123HELlo');
```
```text
+---------------------------------------+
| INITCAP('hello hello.,HELLO123HELlo') |
+---------------------------------------+
| Hello Hello.,Hello123hello            |
+---------------------------------------+
```

6. 多种分隔符
```sql
SELECT INITCAP('word1@word2#word3$word4');
```
```text
+------------------------------------+
| INITCAP('word1@word2#word3$word4') |
+------------------------------------+
| Word1@Word2#Word3$Word4            |
+------------------------------------+
```

7. UTF-8 多字节字符
```sql
SELECT INITCAP('ṭṛì ḍḍumai hello');
```
```text
+------------------------------+
| INITCAP('ṭṛì ḍḍumai hello') |
+------------------------------+
| Ṭṛì Ḍḍumai Hello            |
+------------------------------+
```

8. 人名格式化
```sql
SELECT INITCAP('john doe'), INITCAP('MARY JANE');
```
```text
+---------------------+----------------------+
| INITCAP('john doe') | INITCAP('MARY JANE') |
+---------------------+----------------------+
| John Doe            | Mary Jane            |
+---------------------+----------------------+
```

9. 标题和句子格式化
```sql
SELECT INITCAP('the quick brown fox'), INITCAP('DATABASE management SYSTEM');
```
```text
+-------------------------------+--------------------------------------+
| INITCAP('the quick brown fox') | INITCAP('DATABASE management SYSTEM') |
+-------------------------------+--------------------------------------+
| The Quick Brown Fox           | Database Management System          |
+-------------------------------+--------------------------------------+
```

10. 复杂标点和空格
```sql
SELECT INITCAP('word1   word2--word3'), INITCAP('hello, world! how are you?');
```
```text
+----------------------------------+---------------------------------------+
| INITCAP('word1   word2--word3')  | INITCAP('hello, world! how are you?') |
+----------------------------------+---------------------------------------+
| Word1   Word2--Word3             | Hello, World! How Are You?           |
+----------------------------------+---------------------------------------+
```