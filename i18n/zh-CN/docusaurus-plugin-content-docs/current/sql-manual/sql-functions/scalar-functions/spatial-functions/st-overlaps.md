---
{
    "title": "ST_OVERLAPS",
    "language": "zh-CN",
    "description": "判断同维度空间值是否部分重叠：内部交集必须具有相同维度，且双方都不完全覆盖对方。"
}
---

## 描述

判断同维度空间值是否部分重叠：内部交集必须具有相同维度，且双方都不完全覆盖对方。线仅交于一点、面仅共边或共顶点、完全相等、包含、不同维度，以及单 Point/Point 均返回 false。函数关于两个参数对称。

开发版本的 typed 接口只支持默认 `GEOGRAPHY(OGC:CRS84, spherical)` 的非空 XY Point、LineString、Polygon。Geometry、其他 CRS/算法、Z/M、Multi*/GeometryCollection 和 EMPTY 不支持用于计算；合法原始值仍可存储和访问。NULL 参数返回 NULL。函数使用球面测地线边，沿用较小区域的多边形环解释；不提供空间索引或谓词下推。

## 语法

```sql
ST_OVERLAPS(a, b)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `a`, `b` | 保留完整参数的 GEOGRAPHY 值。 |

## 返回值

Nullable BOOLEAN。

## 示例

```sql
SELECT ST_Overlaps(g, g) FROM (SELECT ST_GeogFromWKB('0101000000000000000000F03F0000000000000040') AS g) values_with_geography;
```

```text
false
```

相关说明：[Iceberg 空间类型](../../../../lakehouse/catalogs/iceberg-catalog.mdx#iceberg-spatial-types)。
