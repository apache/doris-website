---
{
    "title": "CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN",
    "language": "zh-CN",
    "description": "CUTTOFIRSTSIGNIFICANTSUBDOMAIN 函数用于从 URL 中提取域名的有效部分，包含顶级域名直至\"第一个有效子域\"。如果输入的 URL 不合法，则返回空字符串。"
}
---

## 描述

CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN 函数用于从 URL 中提取域名的有效部分，包含顶级域名直至"第一个有效子域"。如果输入的 URL 不合法，则返回空字符串。

## 语法

```sql
CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN(<url>)
```

## 参数
| 参数 | 说明                                 |
| ---- | ------------------------------------ |
| `<url>` | 需要处理的 URL 字符串。类型：VARCHAR |

## 返回值

返回 VARCHAR 类型，表示提取出的域名部分。

特殊情况：
- 如果 url 为 NULL，返回 NULL
- 如果 url 不是有效的域名格式，返回空字符串

## 示例

1. 基本域名处理
```sql
SELECT cut_to_first_significant_subdomain('www.baidu.com');
```
```text
+-----------------------------------------------------+
| cut_to_first_significant_subdomain('www.baidu.com')  |
+-----------------------------------------------------+
| baidu.com                                            |
+-----------------------------------------------------+
```

2. 多级域名处理
```sql
SELECT cut_to_first_significant_subdomain('www.google.com.cn');
```
```text
+---------------------------------------------------------+
| cut_to_first_significant_subdomain('www.google.com.cn')   |
+---------------------------------------------------------+
| google.com.cn                                             |
+---------------------------------------------------------+
```

3. 无效域名处理
```sql
SELECT cut_to_first_significant_subdomain('wwwwwwww');
```
```text
+------------------------------------------------+
| cut_to_first_significant_subdomain('wwwwwwww')  |
+------------------------------------------------+
|                                                 |
+------------------------------------------------+
```
