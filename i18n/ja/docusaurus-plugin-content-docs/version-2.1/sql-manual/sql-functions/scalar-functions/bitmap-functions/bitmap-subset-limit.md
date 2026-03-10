---
{
  "title": "BITMAP_SUBSET_LIMIT",
  "language": "ja",
  "description": "指定された位置から開始して、cardinality limitで指定された要素数の制限で、Bitmap要素のサブセットを抽出します。"
}
---
## 説明

指定された位置から開始して、カーディナリティ制限で指定された要素数の制限を持つBitmap要素のサブセットを抽出し、そのサブセットを新しいBitmapとして返します。

## 構文

```sql
BITMAP_SUBSET_LIMIT(<bitmap>, <position>, <cardinality_limit>)
```
## パラメータ

| パラメータ             | 説明                   |
|-----------------------|-------------------------------|
| `<bitmap>`            | Bitmap値              |
| `<position>`          | 開始位置（包含） |
| `<cardinality_limit>` | 要素の最大数 |

## 戻り値

指定された範囲と制限内のサブセットBitmap。

## 例

位置0から開始してcardinality制限を3とするBitmapのサブセットを取得するには：

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 0, 3)) value;
```
結果は以下のようになります：

```text
+-----------+
| value     |
+-----------+
| 1,2,3     |
+-----------+
```
位置4から開始して基数制限を3とするBitmapのサブセットを取得するには:

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, 3)) value;
```
結果は以下のようになります：

```text
+-------+
| value |
+-------+
| 4,5   |
+-------+
```
