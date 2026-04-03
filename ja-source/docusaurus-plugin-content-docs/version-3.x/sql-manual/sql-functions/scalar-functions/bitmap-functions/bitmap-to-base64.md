---
{
  "title": "BITMAP_TO_BASE64",
  "description": "BitmapをBase64エンコードされた文字列に変換します。",
  "language": "ja"
}
---
## デスクリプション

BitmapをBase64エンコードされた文字列に変換します。

## Syntax

```sql
BITMAP_TO_BASE64(<bitmap>)
```
## パラメータ

| Parameter  | デスクリプション                     |
|------------|---------------------------------|
| `<bitmap>` | Bitmap型のカラムまたは式 |

## Return Value

BitmapのBase64エンコードされた文字列。  
Bitmapが`NULL`の場合は`NULL`を返します。

::: note

BE設定オプション`enable_set_in_bitmap_value`は、メモリ内のbitmap値の特定のフォーマットを変更するため、この関数の結果に影響します。  
bitmap内の要素の順序は保証されないため、生成されるBase64文字列は同じ内容であっても常に同一とは限りません。ただし、`bitmap_from_base64`からデコードされるbitmapは同じになります。

:::

## Examples

`NULL`のBitmapをBase64文字列に変換するには：

```sql
select bitmap_to_base64(null);
```
結果は次のようになります:

```text
+------------------------+
| bitmap_to_base64(NULL) |
+------------------------+
| NULL                   |
+------------------------+
```
空のBitmapをBase64文字列に変換するには：

```sql
select bitmap_to_base64(bitmap_empty());
```
結果は以下のようになります：

```text
+----------------------------------+
| bitmap_to_base64(bitmap_empty()) |
+----------------------------------+
| AA==                             |
+----------------------------------+
```
単一要素を持つBitmapをBase64文字列に変換するには：

```sql
select bitmap_to_base64(to_bitmap(1));
```
結果は以下のようになります：

```text
+--------------------------------+
| bitmap_to_base64(to_bitmap(1)) |
+--------------------------------+
| AQEAAAA=                       |
+--------------------------------+
```
複数の要素を持つBitmapをBase64文字列に変換するには：

```sql
select bitmap_to_base64(bitmap_from_string("1,9999999"));
```
結果は以下のようになります：

```text
+---------------------------------------------------------+
| bitmap_to_base64(bitmap_from_string("1,9999999"))       |
+---------------------------------------------------------+
| AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y=                |
+---------------------------------------------------------+
```
