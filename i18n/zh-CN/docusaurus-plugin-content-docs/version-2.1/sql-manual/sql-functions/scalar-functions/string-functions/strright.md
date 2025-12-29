---
{
    "title": "STRRIGHT",
    "language": "zh-CN",
    "description": "STRRIGHT 函数用于返回字符串右边指定长度的部分。长度的单位为 UTF8 字符。"
}
---

## 描述

STRRIGHT 函数用于返回字符串右边指定长度的部分。长度的单位为 UTF8 字符。

## 别名

RIGHT

## 语法

```sql
STRRIGHT(<str>, <len>)
```

## 参数
| 参数 | 说明 |
| ------- | ----------------------------------------- |
| `<str>` | 需要截取的字符串。类型：VARCHAR |
| `<len>` | 要返回的字符数量。类型：INT |

## 返回值

返回 VARCHAR 类型，表示截取的字符串。

特殊情况：
- 如果任意参数为 NULL，返回 NULL
- 如果 len 为负数，返回从第 abs(len) 个字符开始向右的部分
- 如果 len 大于字符串长度，返回整个字符串

## 示例

1. 基本用法
```sql
SELECT strright('Hello doris', 5);
```
```text
+----------------------------+
| strright('Hello doris', 5) |
+----------------------------+
| doris                      |
+----------------------------+
```

2. 负数长度处理
```sql
SELECT strright('Hello doris', -7);
```
```text
+-----------------------------+
| strright('Hello doris', -7) |
+-----------------------------+
| doris                       |
+-----------------------------+
```

3. NULL 参数处理
```sql
SELECT strright('Hello doris', NULL);
```
```text
+-------------------------------+
| strright('Hello doris', NULL) |
+-------------------------------+
| NULL                          |
+-------------------------------+
```

4. NULL 字符串处理
```sql
SELECT strright(NULL, 5);
```
```text
+-------------------+
| strright(NULL, 5) |
+-------------------+
| NULL              |
+-------------------+
```