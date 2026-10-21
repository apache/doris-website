---
{
    "title": "REGEXP_EXTRACT_ALL_ARRAY",
    "language": "zh-CN",
    "description": "提取正则表达式第一个捕获组的全部匹配，返回字符串数组。"
}
---

<version since="dev">

</version>

## 描述

提取 `<pattern>` 的第一个捕获组在 `<str>` 中的全部非重叠匹配，并按匹配顺序返回真正的字符串数组。任一参数为 `NULL` 时返回 `NULL`。

## 语法

```sql
REGEXP_EXTRACT_ALL_ARRAY(<str>, <pattern>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<str>` | 用于匹配的字符串，类型为 `STRING`。 |
| `<pattern>` | 正则表达式字符串，类型为 `STRING`。提取第一个捕获组；不支持第三个捕获组索引参数。 |

## 返回值

返回 `ARRAY<STRING>`。无匹配或表达式没有捕获组时返回空数组 `[]`；任一参数为 `NULL` 时返回 `NULL`。非法正则表达式会报错。

默认使用 RE2 语法，匹配区分大小写。通过会话变量 `enable_extended_regex` 可启用高级正则特性，详见 [REGEXP_EXTRACT_ALL](./regexp-extract-all.md)。该函数返回数组；`REGEXP_EXTRACT_ALL` 返回格式化字符串。

## 示例

```sql
SELECT regexp_extract_all_array('id=12,id=34', 'id=([0-9]+)') AS result;
```

```text
["12", "34"]
```

使用 `(?i)` 忽略大小写：

```sql
SELECT regexp_extract_all_array('Hello hello HELLO', '(?i)(hello)') AS result;
```

```text
["Hello", "hello", "HELLO"]
```

```sql
SELECT regexp_extract_all_array('abc', '([0-9]+)') AS no_match,
       regexp_extract_all_array('abc', 'abc') AS no_capture_group;
```

```text
[]    []
```

```sql
SELECT regexp_extract_all_array(NULL, '(a)') AS null_input,
       regexp_extract_all_array('a', NULL) AS null_pattern;
```

```text
NULL    NULL
```

返回值可直接交给数组函数：

```sql
SELECT array_size(regexp_extract_all_array('a1b2', '([0-9])')) AS matches;
```

```text
2
```
