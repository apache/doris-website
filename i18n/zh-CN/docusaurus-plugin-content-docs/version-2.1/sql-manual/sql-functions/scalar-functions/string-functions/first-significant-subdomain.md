---
{
    "title": "FIRST_SIGNIFICANT_SUBDOMAIN",
    "language": "zh-CN",
    "description": "在 URL 中提取出“第一个有效子域”返回，若不合法则会返回空字符串。"
}
---

## 描述

在 URL 中提取出“第一个有效子域”返回，若不合法则会返回空字符串。

## 语法

```sql
FIRST_SIGNIFICANT_SUBDOMAIN ( <url> )
```

## 参数

| 参数      | 说明                   |
|---------|----------------------|
| `<url>` | 需要提取“第一个有效子域”的 URL |

## 返回值

`<url>` 中第一个有效子域。

## 举例

```sql
SELECT FIRST_SIGNIFICANT_SUBDOMAIN("www.baidu.com"),first_significant_subdomain("www.google.com.cn"),first_significant_subdomain("wwwwwwww")
```

```text
+----------------------------------------------+--------------------------------------------------+-----------------------------------------+
| first_significant_subdomain('www.baidu.com') | first_significant_subdomain('www.google.com.cn') | first_significant_subdomain('wwwwwwww') |
+----------------------------------------------+--------------------------------------------------+-----------------------------------------+
| baidu                                        | google                                           |                                         |
+----------------------------------------------+--------------------------------------------------+-----------------------------------------+
```