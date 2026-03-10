---
{
  "title": "ST_LENGTH",
  "language": "ja",
  "description": "線または面のジオメトリオブジェクトの長さ（または周囲長）を返します。単位はメートルです。"
}
---
## Description

線ジオメトリオブジェクトの球面長または面ジオメトリオブジェクトの境界周囲長をメートル単位で返します。この関数は計算に球面地球モデルを使用します。
- `LINESTRING`または`MULTILINESTRING`の場合、球面上のすべてのセグメントの大円距離の合計、つまり線オブジェクトの**長さ**を返します。
- `POLYGON`または`MULTIPOLYGON`の場合、球面上の外側境界と内側境界（穴）の大円距離の合計、つまり面オブジェクトの**周囲長**を返します。
- `CIRCLE`の場合、`2 * π * radius`の公式で計算された円周を返します。
- `POINT`の場合、`0.0`を返します。

## Syntax

```sql
ST_LENGTH( <shape> )
```
## パラメータ

| パラメータ | 説明 |
| :--- | :--- |
| `<shape>` | 入力ジオメトリ。GEOMETRY型またはVARCHAR型（WKT形式）でGEOMETRY型に変換可能なもの。`LINESTRING`、`POLYGON`、`CIRCLE`、`POINT`などの型をサポートします。 |

## 戻り値

ジオメトリオブジェクトの長さまたは周囲長をメートル単位で返します（DOUBLE型）。

`ST_LENGTH`には以下のエッジケースがあります：
- 入力パラメータが`NULL`の場合、`NULL`を返します。
- 入力パラメータが有効なジオメトリオブジェクトとして解析できない場合、`NULL`を返します。
- 入力ジオメトリオブジェクトが`POINT`または長さが0の線の場合、`0.0`を返します。
- `CIRCLE`型の場合、正しい円周（メートル単位）が返されるよう、`ST_CIRCLE`で作成時の半径パラメータはメートル単位である必要があります。

## 例

**線（LINESTRING）の長さを計算する**

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
**ポリゴンの周囲長を計算する (POLYGON)**

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
**円の円周を計算する (CIRCLE)**

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
**無効なパラメータ（NULLを返す）**

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
**複合線オブジェクトの長さ**

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
