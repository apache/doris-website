---
{
  "title": "SUB_BITMAP",
  "language": "ja",
  "description": "指定された位置から開始し、指定されたカーディナリティ制限によって制限されるBitmap要素のサブセットを抽出します。"
}
---
## 説明

指定された位置から開始し、指定されたカーディナリティ制限によって制限されたBitmap要素のサブセットを抽出し、サブセットを新しいBitmapとして返します。

## 構文

```sql
SUB_BITMAP(<bitmap>, <position>, <cardinality_limit>)
```
## パラメータ

| パラメータ            | 説明                   |
|-----------------------|-------------------------------|
| `<bitmap>`            | Bitmap値              |
| `<position>`          | 開始位置（この位置を含む）。インデックスが負の場合、最後の要素は-1になります。 |
| `<cardinality_limit>` | 要素の最大数 |

## 戻り値

指定された範囲と制限内のBitmapのサブセット。
- パラメータがNULLの場合、NULLを返します


## 例

位置0から開始し、カーディナリティ制限が3のBitmapのサブセットを取得するには：

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 0, 3)) value;
```
結果は以下のようになります：

```text
+-------+
| value |
+-------+
| 0,1,2 |
+-------+
```
位置-3から始まってカーディナリティ制限が2のBitmapのサブセットを取得するには：

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), -3, 2)) value;
```
結果は以下のようになります：

```text
+-------+
| value |
+-------+
| 2,3   |
+-------+
```
位置2から開始してカーディナリティ上限100でBitmapのサブセットを取得するには：

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 2, 100)) value;
```
結果は次のようになります：

```text
+-------+
| value |
+-------+
| 2,3,5 |
+-------+
```
```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 2, NULL)) value;
```
結果は以下のようになります：

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```
