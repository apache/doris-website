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

```sql

select  URL_DECODE('Doris+Q%26A');
```

```sql
+---------------------------+
| url_decode('Doris+Q%26A') |
+---------------------------+
| Doris Q&A                 |
+---------------------------+

```
