---
{
    "title": "ST_OVERLAPS",
    "language": "zh-CN",
    "description": "判断同维度空间值是否部分重叠：内部交集必须具有相同维度，且双方都不完全覆盖对方。"
}
---

## 描述

判断两个同维度的 GEOGRAPHY 值是否部分重叠。这里的维度指点、线或多边形。两者的内部在该维度上相交，且两者都各有一部分落在对方之外。任一参数为 NULL 时返回 NULL。

## 语法

```sql
ST_OVERLAPS(<a>, <b>)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<a>`, `<b>` | 默认类型 `GEOGRAPHY('OGC:CRS84', 'spherical')` 的非空二维点、线或多边形。 |

## 返回值

返回 BOOLEAN。部分重叠时返回 `true`。维度不同、两个值相同、一方完全包含另一方，或两个值都是单个点时返回 `false`。两条线仅在一个点交叉、多边形只共边或共顶点时也返回 `false`。有 NULL 参数时返回 NULL。

多边形边界非常接近时，如果无法可靠判断内部是否重叠，函数会报精度错误。

## 示例

线段 (0, 0)–(2, 0) 和 (1, 0)–(3, 0) 有一段重叠。

```sql
SELECT ST_Overlaps(
    ST_GeogFromWKB('0102000000020000000000000000000000000000000000000000000000000000400000000000000000'),
    ST_GeogFromWKB('010200000002000000000000000000f03f000000000000000000000000000008400000000000000000')
) AS overlaps;
```

```text
true
```

一个点与自身没有部分重叠。

```sql
SELECT ST_Overlaps(g, g) FROM (SELECT ST_GeogFromWKB('0101000000000000000000F03F0000000000000040') AS g) values_with_geography;
```

```text
false
```

NULL 参数：

```sql
SELECT ST_Overlaps(NULL, g) FROM (SELECT ST_GeogFromWKB('0101000000000000000000F03F0000000000000040') AS g) values_with_geography;
```

```text
NULL
```

相关说明：[Iceberg 空间类型](../../../../lakehouse/catalogs/iceberg-catalog.mdx#iceberg-spatial-types)。
