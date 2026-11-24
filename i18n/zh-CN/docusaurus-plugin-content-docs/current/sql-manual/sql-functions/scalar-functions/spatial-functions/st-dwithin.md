---
{
    "title": "ST_DWITHIN",
    "language": "zh-CN",
    "description": "判断两个空间值之间的球面最短距离是否小于或等于阈值，单位米，包含等号。"
}
---

## 描述

判断两个 GEOGRAPHY 值的最短球面距离是否在指定米数以内。任一参数为 NULL 时返回 NULL。

## 语法

```sql
ST_DWITHIN(<a>, <b>, <distance_meters>)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<a>`, `<b>` | 默认类型 `GEOGRAPHY('OGC:CRS84', 'spherical')` 的非空二维点、线或多边形。 |
| `<distance_meters>` | 以米为单位的有限非负数。Doris 将其转换为 DOUBLE。 |

## 返回值

返回 BOOLEAN。距离小于或等于阈值时返回 `true`，超过阈值时返回 `false`。有 NULL 参数时返回 NULL。参数均非 NULL 时，负数、NaN 或无穷大的阈值会报错。

涉及线或多边形时，如果距离接近零且原始坐标无法可靠判断是否相交，函数可能报精度错误。返回零距离需要确认相交。阈值为零或正数时都遵循此规则。

## 示例

点 (0, 0) 到点 (1, 0) 的距离超过 100 千米，在 200 千米以内。

```sql
SELECT ST_DWithin(a, b, 100000) AS within_100_km,
       ST_DWithin(a, b, 200000) AS within_200_km
FROM (
    SELECT ST_GeogFromWKB('010100000000000000000000000000000000000000') AS a,
           ST_GeogFromWKB('0101000000000000000000f03f0000000000000000') AS b
) AS points;
```

```text
false  true
```

NULL 参数：

```sql
SELECT ST_DWithin(NULL, g, 0) FROM (SELECT ST_GeogFromWKB('0101000000000000000000F03F0000000000000040') AS g) values_with_geography;
```

```text
NULL
```

相关说明：[Iceberg 空间类型](../../../../lakehouse/catalogs/iceberg-catalog.mdx#iceberg-spatial-types)。
