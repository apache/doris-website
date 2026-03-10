---
{
  "title": "ST_ASTEXT",
  "language": "ja",
  "description": "幾何図形をWKT（Well Known Text）の表現に変換する"
}
---
## 説明

幾何図形をWKT（Well Known Text）の表現に変換します

## エイリアス

- ST_ASWKT

## 構文

```sql
ST_ASTEXT(GEOMETRY <geo>)
```
## パラメータ

| パラメータ | 説明 |
| -- |----------|
| `<geo>` | 変換が必要なグラフ |

## 戻り値

ジオメトリのWKT表現：

## 例

```sql
SELECT ST_AsText(ST_Point(24.7, 56.7));
```
```text
+---------------------------------+
| st_astext(st_point(24.7, 56.7)) |
+---------------------------------+
| POINT (24.7 56.7)               |
+---------------------------------+
```
