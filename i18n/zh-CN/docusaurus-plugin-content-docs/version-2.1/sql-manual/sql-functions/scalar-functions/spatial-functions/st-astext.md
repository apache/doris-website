---
{
    "title": "ST_ASTEXT",
    "language": "zh-CN",
    "description": "将一个几何图形转化为 WKT（Well Known Text）的表示形式"
}
---

## 描述

将一个几何图形转化为 WKT（Well Known Text）的表示形式

## 别名

- ST_ASWKT

## 语法

```sql
ST_ASTEXT( <geo>)
```

# 参数

| 参数 | 说明       |
| -- |----------|
| `<geo>` | 待转换的几何图形 |

## 返回值

该几何图形的 WKT 表示形式

## 举例

```sql
SELECT ST_AsText(ST_Point(24.7, 56.7));
```

```text
+---------------------------------+
| st_astext(st_point(24.7, 56.7)) |
+---------------------------------+
| POINT (24.7 56.7)               |
+---------------------------------+
```
