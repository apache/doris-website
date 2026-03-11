---
{
  "title": "BITMAP_SUBSET_LIMIT",
  "description": "指定された位置から開始して、cardinality limitで指定された要素数の制限を持つ、Bitmapエレメントのサブセットを抽出します。",
  "language": "ja"
}
---
## 説明

指定された位置から開始して、カーディナリティ制限によって指定された要素数の制限を設けて、Bitmap要素のサブセットを抽出し、そのサブセットを新しいBitmapとして返します。

## 構文

```sql
BITMAP_SUBSET_LIMIT(<bitmap>, <position>, <cardinality_limit>)
```
## パラメータ

| Parameter             | デスクリプション                   |
|-----------------------|-------------------------------|
| `<bitmap>`            | Bitmap値              |
| `<position>`          | 開始位置（包含的） |
| `<cardinality_limit>` | 要素の最大数 |

## Return Value

指定された範囲と制限内のサブセットBitmap。

## Examples

位置0から開始してカーディナリティ制限を3とするBitmapのサブセットを取得するには：

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
position 4から始まりcardinality制限が3のBitmapのサブセットを取得するには：

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
