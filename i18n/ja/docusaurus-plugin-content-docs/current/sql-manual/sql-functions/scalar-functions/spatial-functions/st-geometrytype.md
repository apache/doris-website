---
{
    "title": "ST_GEOMETRYTYPE",
    "language": "ja",
    "description": "ジオメトリオブジェクトの型名を返します。"
}
---

## 説明

指定したジオメトリオブジェクトの型名を大文字で返します。幾何図形の具体的な型を識別するために使用します。

## 構文

```sql
ST_GEOMETRYTYPE( <shape> )
```

## パラメータ

| パラメータ | 説明 |
| :--- | :--- |
| `<shape>` | 入力ジオメトリ。型は GEOMETRY、または GEOMETRY に変換できる VARCHAR（WKT 形式）です。 |

## 戻り値

ジオメトリオブジェクトの型を表す、大文字の VARCHAR 文字列を返します。

`ST_GEOMETRYTYPE` には次の境界ケースがあります。
-   入力パラメータが `NULL` の場合、`NULL` を返します。
-   入力パラメータを有効なジオメトリオブジェクトとして解析できない場合、`NULL` を返します。
-   サポートされるジオメトリ型と戻り値の例は次のとおりです。
    -   `POINT`: `"ST_POINT"`
    -   `LINESTRING`: `"ST_LINESTRING"`
    -   `POLYGON`: `"ST_POLYGON"`
    -   `MULTIPOLYGON`: `"ST_MULTIPOLYGON"`
    -   `CIRCLE` : `"ST_CIRCLE"`

## 例

**Point の型**
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

**Line の型**
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

**Polygon の型**
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

**Circle の型（Doris 拡張）**
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

**無効なパラメータ（NULL を返す）**
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

**NULL パラメータ**
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
