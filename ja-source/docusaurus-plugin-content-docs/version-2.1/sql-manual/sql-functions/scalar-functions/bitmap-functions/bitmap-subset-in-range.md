---
{
  "title": "BITMAP_SUBSET_IN_RANGE",
  "language": "ja",
  "description": "指定された範囲内（範囲の終端は除く）のBitmapのサブセットを返します。"
}
---
## 説明

指定された範囲内のBitmapのサブセットを返します（範囲の終端は除く）。

## 構文

```sql
BITMAP_SUBSET_IN_RANGE(<bitmap>, <range_start_include>, <range_end_exclude>)
```
## パラメータ

| パラメータ             | 説明                   |
|-----------------------|-------------------------------|
| `<bitmap>`            | Bitmap値              |
| `<range_start_include>` | 範囲の開始（含む） |
| `<range_end_exclude>`   | 範囲の終了（含まない）   |

## 戻り値

指定された範囲内のBitmapのサブセット。

## 例

0から9までの範囲でBitmapのサブセットを取得するには：

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 0, 9)) value;
```
結果は以下のようになります：

```text
+-----------+
| value     |
+-----------+
| 1,2,3,4,5 |
+-----------+
```
2から3の範囲でBitmapのサブセットを取得するには：

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, 3)) value;
```
結果は以下のようになります：

```text
+-------+
| value |
+-------+
| 2     |
+-------+
```
