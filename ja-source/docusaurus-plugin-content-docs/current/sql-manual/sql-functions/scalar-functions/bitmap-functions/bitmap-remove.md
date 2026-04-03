---
{
  "title": "BITMAP_REMOVE",
  "language": "ja",
  "description": "Bitmap列から指定された値を削除します。"
}
---
## 説明

Bitmap列から指定された値を削除します。

## 構文

```sql
BITMAP_REMOVE(<bitmap>, <value>)
```
## パラメータ

| Parameter   | Description    |
|-------------|----------------|
| `<bitmap>`  | Bitmap値 |
| `<value>`   | 削除する値 |

## 戻り値

指定された値を削除した後のBitmapを返します。

削除対象の値が存在しない場合は元のBitmapを返します；  
削除対象の値が`NULL`の場合は`NULL`を返します。

## 例

Bitmapから値を削除するには：

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), 3)) res;
```
結果は次のようになります：

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```
Bitmapから`NULL`値を削除するには：

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), null)) res;
```
結果は以下のようになります：

```text
+------+
| res  |
+------+
| NULL |
+------+
```
