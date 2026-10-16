---
{
    "title": "ST_LINEFROMTEXT",
    "language": "ja",
    "description": "WKT（Well Known Text）文字列を、メモリ上の Line 型の表現に変換します"
}
---

## 説明

WKT（Well Known Text）文字列を、メモリ上の Line 型の表現に変換します。

## エイリアス

- ST_LINESTRINGFROMTEXT

## 構文

```sql
ST_LINEFROMTEXT( <wkt>)
```

## パラメータ

| パラメータ | 説明 |
|-----|------------|
| `<wkt>` | LINESTRING 型に準拠した WKT 文字列。形式は次のとおりです。
"LINESTRING (x1 y1, x2 y2)"
(x1 y1) と (x2 y2) は線分の頂点座標です。座標値は数値（整数または小数）です。 |

## 戻り値

Line 型のジオメトリオブジェクトを返します。このオブジェクトは Doris の内部空間データ形式でメモリに格納され、ST_LENGTH や ST_INTERSECTS などの空間関数に引数として直接渡して計算できます。

- 入力した WKT 文字列が無効な場合（頂点が 2 つ未満、構文エラー、数値以外の座標など）は NULL を返します。
- <wkt> が NULL または空文字列の場合は NULL を返します。

## 使用例


通常の LINE 型

```sql
mysql> SELECT ST_AsText(ST_LineFromText("LINESTRING (1 1, 2 2)"));
+-----------------------------------------------------+
| ST_AsText(ST_LineFromText("LINESTRING (1 1, 2 2)")) |
+-----------------------------------------------------+
| LINESTRING (1 1, 2 2)                               |
+-----------------------------------------------------+
```

無効な WKT（頂点不足）

```sql
mysql> SELECT ST_LineFromText("LINESTRING (1 1)");
+-------------------------------------+
| ST_LineFromText("LINESTRING (1 1)") |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

無効な WKT（構文エラー）

```sql
mysql> SELECT ST_LineFromText("LINESTRING (1 1, 2 2");
+-----------------------------------------+
| ST_LineFromText("LINESTRING (1 1, 2 2") |
+-----------------------------------------+
| NULL                                    |
+-----------------------------------------+
```

複数の頂点を持つ LINESTRING

```sql
mysql> SELECT ST_AsText(ST_LineFromText('LINESTRING (1 1, 2 2)'));
+-----------------------------------------------------+
| ST_AsText(ST_LineFromText('LINESTRING (1 1, 2 2)')) |
+-----------------------------------------------------+
| LINESTRING (1 1, 2 2)                               |
+-----------------------------------------------------+
```

入力が NULL の場合

```sql
mysql> SELECT ST_LineFromText(NULL);
+-----------------------+
| ST_LineFromText(NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
```
