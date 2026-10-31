---
{
    "title": "VERSION",
    "language": "zh-CN",
    "description": "无实际意义，兼容 MySQL 协议。"
}
---

## 描述

无实际意义，兼容 MySQL 协议。

## 语法

```sql
VERSION()
```

## 返回值

兼容 MySQL 协议，固定返回“5.7.99”。

## 举例

```sql
select version();
```

```text
+-----------+
| version() |
+-----------+
| 5.7.99    |
+-----------+
```

