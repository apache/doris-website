---
{
  "title": "ST_LINEFROMTEXT",
  "language": "ja",
  "description": "WKT（Well Known Text）をLine形式のメモリ表現に変換する"
}
---
## 説明

WKT（Well Known Text）をLineの形式でメモリ表現に変換します

## エイリアス

- ST_LINESTRINGFROMTEXT

## 構文

```sql
ST_LINEFROMTEXT( <wkt>)
```
## パラメータ

| パラメータ  | 説明         |
|-----|------------|
| `<wkt>` | 2つの座標からなる線分 |

## 戻り値

線分のメモリ形式。

## 例

```sql
SELECT ST_AsText(ST_LineFromText("LINESTRING (1 1, 2 2)"));
```
```text
+---------------------------------------------------------+
| st_astext(st_geometryfromtext('LINESTRING (1 1, 2 2)')) |
+---------------------------------------------------------+
| LINESTRING (1 1, 2 2)                                   |
+---------------------------------------------------------+
```
