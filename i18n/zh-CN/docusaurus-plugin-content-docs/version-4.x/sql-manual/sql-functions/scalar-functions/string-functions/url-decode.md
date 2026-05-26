---
{
    "title": "URL_DECODE",
    "language": "zh-CN",
    "description": "将 URL 转换为解码字符串。"
}
---

## 描述

将 URL 转换为解码字符串。

## 语法

```sql
URL_DECODE( <str> ) 
```

## 必选参数
| 参数 | 描述 |
|------|------|
| `<str>` | 待解码的字符串 |

## 返回值

解码后的值

## 示例

解码百分号编码的 URL —— `%3A` → `:`，`%2F` → `/`。

```sql
select url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions');
```

```text
+-------------------------------------------------------------------------------------------------------------+
| url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions') |
+-------------------------------------------------------------------------------------------------------------+
| https://doris.apache.org/zh-CN/docs/sql-manual/sql-functions/string-functions                               |
+-------------------------------------------------------------------------------------------------------------+
```

解码 `application/x-www-form-urlencoded` 风格的字符串 —— `+` → 空格，`%26` → `&`。

```sql
select url_decode('Doris+Q%26A');
```

```text
+---------------------------+
| url_decode('Doris+Q%26A') |
+---------------------------+
| Doris Q&A                 |
+---------------------------+
```
