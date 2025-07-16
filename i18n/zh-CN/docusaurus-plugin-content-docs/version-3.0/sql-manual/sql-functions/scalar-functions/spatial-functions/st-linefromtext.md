---
{
    "title": "ST_LINEFROMTEXT",
    "language": "zh-CN"
}
---

## 描述

将一个 WKT（Well Known Text）转化为一个 Line 形式的内存表现形式

## 别名

- ST_LINESTRINGFROMTEXT

## 语法

```sql
ST_LINEFROMTEXT( <wkt>)
```

## 参数

| 参数  | 说明         |
|-----|------------|
| `<wkt>` | 由两个坐标组成的线段 |

## 返回值

线段的内存形式。

## 举例

```sql
SELECT ST_AsText(ST_LineFromText("LINESTRING (1 1, 2 2)"));
```

```text
+---------------------------------------------------------+
| st_astext(st_geometryfromtext('LINESTRING (1 1, 2 2)')) |
+---------------------------------------------------------+
| LINESTRING (1 1, 2 2)                                   |
+---------------------------------------------------------+
```

