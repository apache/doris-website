---
{
  "title": "BITMAP_NOT",
  "language": "ja",
  "description": "最初のBitmapと2番目のBitmapの差分を計算し、結果を新しいBitmapとして返します。"
}
---
## 説明

最初のBitmapと2番目のBitmapの差分を計算し、結果を新しいBitmapとして返します。

## 構文

```sql
BITMAP_NOT(<bitmap1>, <bitmap2>)
```
## パラメータ

| Parameter   | Description          |
|-------------|----------------------|
| `<bitmap1>` | 最初のBitmap     |
| `<bitmap2>` | 2番目のBitmap    |

## 戻り値

`<bitmap1>` にあり `<bitmap2>` にない要素を表すBitmap。

## 例

2つのBitmap間の差分を計算するには：

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4')));
```
結果は空のBitmapになります。`<bitmap1>`のすべての要素が`<bitmap2>`にも含まれているためです：

```text
+----------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_not(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) |
+----------------------------------------------------------------------------------------+
|                                                                                        |
+----------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
```
`<bitmap1>`が`<bitmap2>`に存在しない要素を持つ差分を計算するには：

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), bitmap_from_string('1,2,3,4')));
```
結果は要素`5`を含むBitmapになります：

```text
+----------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), bitmap_from_string('1,2,3,4'))) |
+----------------------------------------------------------------------------------------+
| 5                                                                                      |
+----------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
```
