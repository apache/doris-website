---
{
  "title": "SUB_BITMAP",
  "language": "ja",
  "description": "指定された位置から開始し、指定された基数制限によって制限されたBitmap要素のサブセットを抽出します。"
}
---
## 説明

指定された位置から開始し、指定されたカーディナリティ制限によって制限されたBitmap要素のサブセットを抽出し、サブセットを新しいBitmapとして返します。

## 構文

```sql
SUB_BITMAP(<bitmap>, <position>, <cardinality_limit>)
```
## パラメータ

| パラメータ             | 説明                   |
|-----------------------|-------------------------------|
| `<bitmap>`            | Bitmap値              |
| `<position>`          | 開始位置（この位置を含む） |
| `<cardinality_limit>` | 要素の最大数 |

## 戻り値

指定された範囲と制限内のサブセットBitmap。

## 例

位置0から開始してcardinality制限が3のBitmapのサブセットを取得するには：

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 0, 3)) value;
```
結果は次のようになります：

```text
+-------+
| value |
+-------+
| 0,1,2 |
+-------+
```
位置-3から始まり基数制限が2のBitmapのサブセットを取得するには：

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), -3, 2)) value;
```
結果は以下のようになります:

```text
+-------+
| value |
+-------+
| 2,3   |
+-------+
```
位置2から始まり、カーディナリティの上限を100とするBitmapのサブセットを取得するには：

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 2, 100)) value;
```
結果は以下になります：

```text
+-------+
| value |
+-------+
| 2,3,5 |
+-------+
```
