---
{
    "title": "DOMAIN_WITHOUT_WWW",
    "language": "zh-CN",
    "description": "提取字符串 URL 中不带前缀 www 的域名"
}
---

## 描述

提取字符串 URL 中不带前缀 www 的域名

## 语法

```sql
DOMAIN_WITHOUT_WWW ( <url> )
```

## 参数

| 参数      | 说明                   |
|---------|----------------------|
| `<url>` | 需要提取不带 www 域名的 `URL` |

## 返回值

参数 `<url>` 不带前缀 www 的域名

## 举例

```sql
SELECT DOMAIN_WITHOUT_WWW("https://www.apache.org/docs/gettingStarted/what-is-apache-doris")
```

```text
+---------------------------------------------------------------------------------------+
| domain_without_www('https://www.apache.org/docs/gettingStarted/what-is-apache-doris') |
+---------------------------------------------------------------------------------------+
| apache.org                                                                            |
+---------------------------------------------------------------------------------------+
```