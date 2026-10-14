---
{
    "title": "ST_LENGTH",
    "language": "ja",
    "description": "線または面のジオメトリオブジェクトの長さ（または周長）をメートル単位で返します。"
}
---

## 説明

線ジオメトリオブジェクトの球面上の長さ、または面ジオメトリオブジェクトの境界の周長をメートル単位で返します。この関数は、地球を球体とみなして計算します。
- `LINESTRING` または `MULTILINESTRING` の場合、すべての線分の球面上の大円距離の合計、つまり線オブジェクトの**長さ**を返します。
- `POLYGON` または `MULTIPOLYGON` の場合、外側の境界と内側の境界（穴）の球面上の大円距離の合計、つまり面オブジェクトの**周長**を返します。
- `CIRCLE` の場合、式 `2 * π * radius` で計算した円周の長さを返します。
- `POINT` の場合、`0.0` を返します。

## 構文

```sql
ST_LENGTH( <shape> )
```

## パラメータ

| パラメータ | 説明 |
| :--- | :--- |
| `<shape>` | 入力ジオメトリ。型は GEOMETRY、または GEOMETRY に変換できる VARCHAR（WKT 形式）です。`LINESTRING`、`POLYGON`、`CIRCLE`、`POINT` などをサポートします。 |

## 戻り値

ジオメトリオブジェクトの長さまたは周長を、メートル単位の DOUBLE 値で返します。

`ST_LENGTH` には次の境界ケースがあります。
- 入力パラメータが `NULL` の場合、`NULL` を返します。
- 入力パラメータを有効なジオメトリオブジェクトとして解析できない場合、`NULL` を返します。
- 入力ジオメトリオブジェクトが `POINT`、または長さがゼロの線の場合、`0.0` を返します。
- `CIRCLE` 型の場合、正しい円周の長さ（メートル単位）を得るには、`ST_CIRCLE` で作成するときの半径パラメータをメートル単位で指定する必要があります。

## 例

**線の長さを計算する（LINESTRING）**
```sql
-- Calculate the length of a line segment with a 1-degree longitude difference on the equator
SELECT ST_LENGTH(ST_GeometryFromText('LINESTRING(0 0, 1 0)'));
```
```text
+--------------------------------------------------------+
| ST_LENGTH(ST_GeometryFromText('LINESTRING(0 0, 1 0)')) |
+--------------------------------------------------------+
|                                      111195.1011774839 |
+--------------------------------------------------------+
```

**ポリゴンの周長を計算する（POLYGON）**
```sql
-- Calculate the perimeter of a small square with a side length of approximately 0.0009 degrees (~100 meters)
SELECT ST_LENGTH(ST_GeometryFromText('POLYGON((-0.00045 -0.00045, 0.00045 -0.00045, 0.00045 0.00045, -0.00045 0.00045, -0.00045 -0.00045))')) AS perimeter;
```
```text
+-------------------+
| perimeter         |
+-------------------+
| 400.3023642327689 |
+-------------------+
```

**円の円周を計算する（CIRCLE）**
```sql
-- Calculate the circumference of a circle with a radius of 100 meters
SELECT ST_LENGTH(ST_Circle(0, 0, 100));
```
```text
+---------------------------------+
| ST_LENGTH(ST_Circle(0, 0, 100)) |
+---------------------------------+
|               628.3185307179587 |
+---------------------------------+
```

**点の長さ**
```sql
SELECT ST_LENGTH(ST_GeometryFromText('POINT(1 1)'));
```
```text
+----------------------------------------------+
| ST_LENGTH(ST_GeometryFromText('POINT(1 1)')) |
+----------------------------------------------+
|                                            0 |
+----------------------------------------------+
```

**無効なパラメータ（NULL を返す）**
```sql
SELECT ST_LENGTH('NOT_A_GEOMETRY');
```
```text
+-----------------------------+
| ST_LENGTH('NOT_A_GEOMETRY') |
+-----------------------------+
|                        NULL |
+-----------------------------+
```

**NULL パラメータ**
```sql
SELECT ST_LENGTH(NULL);
```
```text
+-----------------+
| ST_LENGTH(NULL) |
+-----------------+
|            NULL |
+-----------------+
```

**複数の線分からなる線オブジェクトの長さ**
```sql
-- Calculate the total length of a polyline
SELECT ST_LENGTH(ST_LineFromText("LINESTRING (0 0,1 0,1 1)"));
```
```text
+--------------------------------------------------------+
| ST_LENGTH(ST_LineFromText("LINESTRING (0 0,1 0,1 1)")) |
+--------------------------------------------------------+
|                                      222390.2023549679 |
+--------------------------------------------------------+
```
