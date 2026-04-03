---
{
  "title": "BITMAP_MAX",
  "language": "ja",
  "description": "Bitmapの最大値を計算して返します。"
}
---
## 説明

Bitmap内の最大値を計算して返します。

## 構文

```sql
BITMAP_MAX(<bitmap>)
```
## パラメータ

| パラメータ  | 説明                     |
|------------|---------------------------------|
| `<bitmap>` | Bitmap型の列または式 |

## 戻り値

Bitmap内の最大値。  
Bitmapが空の場合は`NULL`を返します。

## 例

空のBitmap内の最大値を計算するには：

```sql
select bitmap_max(bitmap_from_string('')) value;
```
結果は次のようになります：

```text
+-------+
| value |
+-------+
|  NULL |
+-------+
```
複数の要素を持つBitmapで最大値を計算するには：

```sql
select bitmap_max(bitmap_from_string('1,9999999999')) value;
```
結果は以下のようになります：

```text
+------------+
| value      |
+------------+
| 9999999999 |
+------------+
```
