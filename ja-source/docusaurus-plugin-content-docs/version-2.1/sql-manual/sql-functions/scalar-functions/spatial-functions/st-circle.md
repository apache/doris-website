---
{
  "title": "ST_CIRCLE",
  "language": "ja",
  "description": "WKT（Well Known Text）を地球の球面上の円に変換する。"
}
---
## 説明

WKT（Well Known Text）を地球の球面上の円に変換します。

## 構文

```sql
ST_CIRCLE( <center_lng>, <center_lat>, <radius>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<center_lng>` | 円の中心の経度 |
| `<center_lat>` | 円の中心の緯度 |
| `<radius>` | 円の半径 |

- 半径の単位はメートルです。最大9999999のRADIUSがサポートされています

## 戻り値

円の基本情報に基づく球面上の円

## 例

```sql
SELECT ST_AsText(ST_Circle(111, 64, 10000));
```
```text
+--------------------------------------------+
| st_astext(st_circle(111.0, 64.0, 10000.0)) |
+--------------------------------------------+
| CIRCLE ((111 64), 10000)                   |
+--------------------------------------------+
```
