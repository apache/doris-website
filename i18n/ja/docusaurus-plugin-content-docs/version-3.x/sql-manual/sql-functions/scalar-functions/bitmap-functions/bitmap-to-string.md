---
{
  "title": "BITMAP_TO_STRING",
  "description": "Bitmapを、設定されているすべてのビット位置を含むカンマ区切りの文字列に変換します。",
  "language": "ja"
}
---
## 説明

Bitmapを、設定されているすべてのビット位置を含むカンマ区切りの文字列に変換します。

## 構文

```sql
BITMAP_TO_STRING(<bitmap>)
```
## パラメータ

| Parameter  | デスクリプション                     |
|------------|---------------------------------|
| `<bitmap>` | Bitmap型の列または式 |

## Return Value

Bitmap内で設定されているすべてのビット位置をカンマで区切った文字列。  
Bitmapが`NULL`の場合は`NULL`を返す。

## Examples

`NULL`のBitmapを文字列に変換するには：

```sql
select bitmap_to_string(null);
```
結果は次のようになります：

```text
+------------------------+
| bitmap_to_string(NULL) |
+------------------------+
| NULL                   |
+------------------------+
```
空のBitmapを文字列に変換するには：

```sql
select bitmap_to_string(bitmap_empty());
```
結果は次のようになります:

```text
+----------------------------------+
| bitmap_to_string(bitmap_empty()) |
+----------------------------------+
|                                  |
+----------------------------------+
```
単一の要素を持つBitmapを文字列に変換するには：

```sql
select bitmap_to_string(to_bitmap(1));
```
結果は以下のようになります：

```text
+--------------------------------+
| bitmap_to_string(to_bitmap(1)) |
+--------------------------------+
| 1                              |
+--------------------------------+
```
複数の要素を持つBitmapを文字列に変換するには：

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2)));
```
結果は次のようになります：

```text
+---------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2))) |
+---------------------------------------------------------+
| 1,2                                                     |
+---------------------------------------------------------+
```
