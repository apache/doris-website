---
{
    "title": "ST_DWITHIN",
    "language": "zh-CN",
    "description": "判断两个空间值之间的球面最短距离是否小于或等于阈值，单位米，包含等号。"
}
---

## 描述

判断两个空间值之间的球面最短距离是否小于或等于阈值，单位米，包含等号。阈值遵循数值到 DOUBLE 的转换规则；非 NULL 行的负数、NaN 和无穷阈值报错。任一参数为 NULL 时返回 NULL。只支持三个参数，不提供椭球模式或用户指定的吸附容差。

开发版本的 typed 接口只支持默认 `GEOGRAPHY(OGC:CRS84, spherical)` 的非空 XY Point、LineString、Polygon。Geometry、其他 CRS/算法、Z/M、Multi*/GeometryCollection 和 EMPTY 不支持用于计算；合法原始值仍可存储和访问。NULL 参数返回 NULL。函数使用球面测地线边，沿用较小区域的多边形环解释；不提供空间索引或谓词下推。

## 语法

```sql
ST_DWITHIN(a, b, distance_meters)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `a`, `b` | 保留完整参数的 GEOGRAPHY 值。 |
| `distance_meters` | 有限、非负的距离阈值，单位米。 |

## 返回值

Nullable BOOLEAN。

## 示例

```sql
SELECT ST_DWithin(g, g, 0) FROM (SELECT ST_GeogFromWKB('0101000000000000000000F03F0000000000000040') AS g) values_with_geography;
```

```text
true
```

相关说明：[Iceberg 空间类型](../../../../lakehouse/catalogs/iceberg-catalog.mdx#iceberg-spatial-types)。
