---
{
    "title": "ST_EQUALS",
    "language": "zh-CN",
    "description": "判断两个空间值是否具有相同维度并占据相同点集。"
}
---

## 描述

判断两个同维度的 GEOGRAPHY 值是否覆盖同一组点。WKB 字节序、线段方向、在同一测地线上增加分段，以及多边形环的起点和方向都不影响判等。任一参数为 NULL 时返回 NULL。

## 语法

```sql
ST_EQUALS(<a>, <b>)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<a>`, `<b>` | 默认类型 `GEOGRAPHY('OGC:CRS84', 'spherical')` 的非空二维点、线或多边形。 |

## 返回值

返回 BOOLEAN。覆盖同一组点时返回 `true`，点集不同或维度不同时返回 `false`。有 NULL 参数时返回 NULL。

## 示例

点 `(180, 0)` 和 `(-180, 0)` 都位于 180° 经线上，且表示同一位置。

```sql
SELECT ST_Equals(
    ST_GeogFromWKB('010100000000000000008066400000000000000000'),
    ST_GeogFromWKB('010100000000000000008066c00000000000000000')
) AS same_point;
```

```text
true
```

NULL 参数：

```sql
SELECT ST_Equals(NULL, g) FROM (SELECT ST_GeogFromWKB('0101000000000000000000F03F0000000000000040') AS g) values_with_geography;
```

```text
NULL
```

相关说明：[Iceberg 空间类型](../../../../lakehouse/catalogs/iceberg-catalog.mdx#iceberg-spatial-types)。
