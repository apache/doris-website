---
{
    "title": "ST_GEOMETRYFROMTEXT",
    "language": "zh-CN"
}
---

## 描述

将一个线型 WKT（Well Known Text）转化为对应的内存的几何形式

## 别名

- ST_GEOMFROMTEXT

## 语法

```sql
ST_GEOMETRYFROMTEXT( <wkt>)
```
## 参数

| 参数      | 说明      |
|---------|---------|
| `<wkt>` | 图形的内存形式 |

## 返回值

WKB 的对应的几何存储形式

## 举例

```sql
SELECT ST_AsText(ST_GeometryFromText("LINESTRING (1 1, 2 2)"));
```

```text
+---------------------------------------------------------+
| st_astext(st_geometryfromtext('LINESTRING (1 1, 2 2)')) |
+---------------------------------------------------------+
| LINESTRING (1 1, 2 2)                                   |
+---------------------------------------------------------+
```