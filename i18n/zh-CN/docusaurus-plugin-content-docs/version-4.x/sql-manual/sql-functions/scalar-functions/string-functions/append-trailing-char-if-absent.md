---
{
    "title": "APPEND_TRAILING_CHAR_IF_ABSENT",
    "language": "zh-CN",
    "description": "APPENDTRAILINGCHARIFABSENT 函数用于确保字符串以指定字符结尾。如果字符串末尾不存在该字符，则添加；如果已存在，则保持不变。"
}
---

## 描述

APPEND_TRAILING_CHAR_IF_ABSENT 函数用于确保字符串以指定字符结尾。如果字符串末尾不存在该字符，则添加；如果已存在，则保持不变。

## 语法

```sql
APPEND_TRAILING_CHAR_IF_ABSENT(<str>, <trailing_char>)
```

## 参数

| 参数 | 说明 |
| ------------------ | ----------------------------------------- |
| `<str>` | 需要处理的目标字符串。类型：VARCHAR |
| `<trailing_char>` | 需要确保出现在字符串末尾的字符。类型：VARCHAR |

## 返回值

返回 VARCHAR 类型：
- 如果 `<str>` 末尾不存在 `<trailing_char>`，返回 `<str>` 与 `<trailing_char>` 拼接后的字符串
- 如果 `<str>` 末尾已存在 `<trailing_char>`，返回原始 `<str>`

特殊情况：
- 如果任意参数为 NULL，返回 NULL
- 如果 `<str>` 为空字符串，返回 `<trailing_char>`

## 示例

1. 基本用法：字符不存在时添加
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('a', 'c');
```
```text
+------------------------------------------+
| append_trailing_char_if_absent('a', 'c') |
+------------------------------------------+
| ac                                       |
+------------------------------------------+
```

2. 字符已存在时不添加
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('ac', 'c');
```
```text
+-------------------------------------------+
| append_trailing_char_if_absent('ac', 'c') |
+-------------------------------------------+
| ac                                        |
+-------------------------------------------+
```

3. 空字符串处理
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('', '/');
```
```text
+------------------------------------------+
| append_trailing_char_if_absent('', '/')  |
+------------------------------------------+
| /                                        |
+------------------------------------------+
```

4. NULL 值处理
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT(NULL, 'c');
```
```text
+-------------------------------------------+
| append_trailing_char_if_absent(NULL, 'c') |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```

5. utf-8 字符
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('acf', 'ṛ');
```
```text
+----------------------------------------------+
| APPEND_TRAILING_CHAR_IF_ABSENT('acf', 'ṛ')   |
+----------------------------------------------+
| acfṛ                                         |
+----------------------------------------------+
```