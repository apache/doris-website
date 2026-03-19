---
{
  "title": "BITMAP_MAX",
  "description": "Bitmap内の最大値を計算して返します。",
  "language": "ja"
}
---
## 説明

Bitmap内の最大値を計算して返します。

## 構文

```sql
BITMAP_MAX(<bitmap>)
```
## パラメータ

| Parameter  | デスクリプション                     |
|------------|---------------------------------|
| `<bitmap>` | Bitmap型のカラムまたは式 |

## Return Value

Bitmap内の最大値。  
Bitmapが空の場合は`NULL`を返します。

## Examples

空のBitmap内の最大値を計算するには:

```sql
select bitmap_max(bitmap_from_string('')) value;
```
結果は以下のようになります：

```text
+-------+
| value |
+-------+
|  NULL |
+-------+
```
複数の要素を持つBitmapの最大値を計算するには：

```sql
select bitmap_max(bitmap_from_string('1,9999999999')) value;
```
結果は次のようになります:

```text
+------------+
| value      |
+------------+
| 9999999999 |
+------------+
```
