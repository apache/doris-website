---
{
    "title": "DOMAIN",
    "language": "zh-CN",
    "description": "提取字符串 URL 中的域名"
}
---

## 描述

提取字符串 URL 中的域名

## 语法

```sql
DOMAIN ( <url> )
```

## 参数

| 参数      | 说明                 |
|---------|--------------------|
| `<url>` | 需要提取域名的 `URL`        |

## 返回值

参数 `<url>` 的域名

## 举例

```sql
SELECT DOMAIN("https://doris.apache.org/docs/gettingStarted/what-is-apache-doris")
```

```text
+-----------------------------------------------------------------------------+
| domain('https://doris.apache.org/docs/gettingStarted/what-is-apache-doris') |
+-----------------------------------------------------------------------------+
| doris.apache.org                                                            |
+-----------------------------------------------------------------------------+
```