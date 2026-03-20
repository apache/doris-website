---
{
  "title": "BITMAP_TO_BASE64",
  "language": "ja",
  "description": "BitmapをBase64エンコード文字列に変換します。"
}
---
## 説明

BitmapをBase64エンコードされた文字列に変換します。

## 構文

```sql
BITMAP_TO_BASE64(<bitmap>)
```
## パラメータ

| パラメータ  | 説明                     |
|------------|---------------------------------|
| `<bitmap>` | Bitmap型の列または式 |

## 戻り値

BitmapのBase64エンコード文字列。  
Bitmapが`NULL`の場合は`NULL`を返します。

::: note

BE設定オプション`enable_set_in_bitmap_value`は、メモリ内のbitmap値の特定の形式を変更するため、この関数の結果に影響します。  
bitmap内の要素の順序は保証されないため、同じ内容に対して生成されるBase64文字列が常に同じとは限りません。ただし、`bitmap_from_base64`からデコードされたbitmapは同じになります。

:::

## 例

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
結果は次のようになります：

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
結果は次のようになります：

```text
+---------------------------------------------------------+
| bitmap_to_base64(bitmap_from_string("1,9999999"))       |
+---------------------------------------------------------+
| AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y=                |
+---------------------------------------------------------+
```
