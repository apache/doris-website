---
{
  "title": "ST_GEOMETRYTYPE",
  "language": "ja",
  "description": "ジオメトリオブジェクトの型名を返します。"
}
---
## 説明

指定されたgeometryオブジェクトの型名を（大文字で）返します。幾何学図形の特定の型を識別するために使用されます。

:::info Note
Apache Doris 4.0.4以降でサポート
:::

## 構文

```sql
ST_GEOMETRYTYPE( <shape> )
```
## パラメータ

| パラメータ | 説明 |
| :--- | :--- |
| `<shape>` | 入力ジオメトリ。GEOMETRY型またはVARCHAR型（WKT形式）でGEOMETRY型に変換可能なもの。 |

## 戻り値

ジオメトリオブジェクトの型を表すVARCHAR型の大文字文字列を返します。

`ST_GEOMETRYTYPE`には以下のエッジケースがあります：
-   入力パラメータが`NULL`の場合、`NULL`を返します。
-   入力パラメータが有効なジオメトリオブジェクトに解析できない場合、`NULL`を返します。
-   サポートされているジオメトリ型とその戻り値の例は以下の通りです：
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
**線の種類**

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
**ポリゴンのタイプ**

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
**円の型（Doris拡張）**

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
**無効なパラメータ（NULLを返す）**

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
**NULLパラメータ**

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
