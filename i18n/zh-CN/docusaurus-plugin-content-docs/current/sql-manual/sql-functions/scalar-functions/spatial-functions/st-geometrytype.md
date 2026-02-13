---
{
    "title": "ST_GEOMETRYTYPE",
    "language": "zh-CN",
    "description": "返回几何对象的类型名称。"
}
---

## 描述

返回给定几何对象的类型名称（大写字符串）。用于识别几何图形的具体类型。

## 语法

```sql
ST_GEOMETRYTYPE( <shape> )
```

## 参数

| 参数 | 说明 |
| :--- | :--- |
| `<shape>` | 输入的几何图形，类型为 GEOMETRY 或可以转换为 GEOMETRY 的 VARCHAR（WKT 格式）。 |

## 返回值

返回一个 VARCHAR 类型的大写字符串，表示几何对象的类型。

`ST_GEOMETRYTYPE` 存在以下边缘情况：
- 若输入参数为 `NULL`，返回 `NULL`。
- 若输入参数无法解析为有效的几何对象，返回 `NULL`。
- 支持的几何类型及返回值示例如下：
  - `POINT`: `"ST_POINT"`
  - `LINESTRING`: `"ST_LINESTRING"`
  - `POLYGON`: `"ST_POLYGON"`
  - `MULTIPOLYGON`: `"ST_MULTIPOLYGON"`
  - `CIRCLE` : `"ST_CIRCLE"`

## 举例

**点的类型**
```sql
SELECT ST_GEOMETRYTYPE(ST_GeometryFromText('POINT(1 1)'));
```
```text
+----------------------------------------------------+
| ST_GEOMETRYTYPE(ST_GeometryFromText('POINT(1 1)')) |
+----------------------------------------------------+
| ST_POINT                                           |
+----------------------------------------------------+
```

**线的类型**
```sql
SELECT ST_GEOMETRYTYPE(ST_LineFromText("LINESTRING (1 1,2 2,3 3)"));
```
```text
+--------------------------------------------------------------+
| ST_GEOMETRYTYPE(ST_LineFromText("LINESTRING (1 1,2 2,3 3)")) |
+--------------------------------------------------------------+
| ST_LINESTRING                                                |
+--------------------------------------------------------------+
```

**多边形的类型**
```sql
SELECT ST_GEOMETRYTYPE(ST_GeometryFromText('POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))'));
```
```text
+--------------------------------------------------------------------------------+
| ST_GEOMETRYTYPE(ST_GeometryFromText('POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+--------------------------------------------------------------------------------+
| ST_POLYGON                                                                     |
+--------------------------------------------------------------------------------+
```

**圆的类型 (Doris 扩展)**
```sql
SELECT ST_GEOMETRYTYPE(ST_Circle(0, 0, 100));
```
```text
+---------------------------------------+
| ST_GEOMETRYTYPE(ST_Circle(0, 0, 100)) |
+---------------------------------------+
| ST_CIRCLE                             |
+---------------------------------------+
```

**无效参数（返回 NULL）**
```sql
SELECT ST_GEOMETRYTYPE('NOT_A_GEOMETRY');
```
```text
+-----------------------------------+
| ST_GEOMETRYTYPE('NOT_A_GEOMETRY') |
+-----------------------------------+
| NULL                              |
+-----------------------------------+
```

**NULL 参数**
```sql
SELECT ST_GEOMETRYTYPE(NULL);
```
```text
+-----------------------+
| ST_GEOMETRYTYPE(NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
```