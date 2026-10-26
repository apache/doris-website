---
{
    "title": "ST_EQUALS",
    "language": "zh-CN",
    "description": "判断两个空间值是否具有相同维度并占据相同点集。"
}
---

## 描述

判断两个空间值是否具有相同维度并占据相同点集。不同 WKB 字节序、线方向、同一测地线上的分段、环起点或环方向不会使同一对象变得不相等。不同维度返回 false。本函数不改变原始 WKB，也不开放空间 SQL `=`、分组或去重。

开发版本的 typed 接口只支持默认 `GEOGRAPHY(OGC:CRS84, spherical)` 的非空 XY Point、LineString、Polygon。Geometry、其他 CRS/算法、Z/M、Multi*/GeometryCollection 和 EMPTY 不支持用于计算；合法原始值仍可存储和访问。NULL 参数返回 NULL。函数使用球面测地线边，沿用较小区域的多边形环解释；不提供空间索引或谓词下推。

## 语法

```sql
ST_EQUALS(a, b)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `a`, `b` | 保留完整参数的 GEOGRAPHY 值。 |

## 返回值

Nullable BOOLEAN。

## 示例

```sql
SELECT ST_Equals(g, g) FROM (SELECT ST_GeogFromWKB('0101000000000000000000F03F0000000000000040') AS g) values_with_geography;
```

```text
true
```

相关说明：[Iceberg 空间类型](../../../../lakehouse/catalogs/iceberg-catalog.mdx#iceberg-spatial-types)。
