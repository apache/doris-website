---
{
  "title": "BITMAP_TO_ARRAY",
  "description": "BitmapをArrayに変換します。",
  "language": "ja"
}
---
## 説明

BitmapをArrayに変換します。

## 構文

```sql
BITMAP_TO_ARRAY(<bitmap>)
```
## パラメータ

| Parameter  | デスクリプション                     |
|------------|---------------------------------|
| `<bitmap>` | Bitmap型の列または式 |

## Return Value

Bitmap内のすべてのビット位置を含む配列。  
Bitmapが`NULL`の場合は`NULL`を返す。

## Examples

`NULL`のBitmapを配列に変換するには：

```sql
select bitmap_to_array(null);
```
結果は以下のようになります：

```text
+------------------------+
| bitmap_to_array(NULL)  |
+------------------------+
| NULL                   |
+------------------------+
```
空のBitmapを配列に変換するには：

```sql
select bitmap_to_array(bitmap_empty());
```
結果は以下のようになります：

```text
+---------------------------------+
| bitmap_to_array(bitmap_empty()) |
+---------------------------------+
| []                              |
+---------------------------------+
```
単一の要素を持つBitmapを配列に変換するには：

```sql
select bitmap_to_array(to_bitmap(1));
```
結果は以下のようになります：

```text
+-------------------------------+
| bitmap_to_array(to_bitmap(1)) |
+-------------------------------+
| [1]                           |
+-------------------------------+
```
複数の要素を持つBitmapを配列に変換するには：

```sql
select bitmap_to_array(bitmap_from_string('1,2,3,4,5'));
```
結果は次のようになります：

```text
+--------------------------------------------------+
| bitmap_to_array(bitmap_from_string('1,2,3,4,5')) |
+--------------------------------------------------+
| [1, 2, 3, 4, 5]                                  |
+--------------------------------------------------+
```
