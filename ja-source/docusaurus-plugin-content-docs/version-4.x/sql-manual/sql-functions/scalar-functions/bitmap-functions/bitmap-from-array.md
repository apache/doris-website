---
{
  "title": "BITMAP_FROM_ARRAY",
  "description": "TINYINT/SMALLINT/INT/BIGINT型の配列をBITMAPに変換します。入力フィールドが不正な場合、結果はNULLを返します。",
  "language": "ja"
}
---
## 説明

TINYINT/SMALLINT/INT/BIGINT型の配列をBITMAPに変換します。入力フィールドが不正な場合、結果はNULLを返します。

## 構文

```sql
BITMAP_FROM_ARRAY(<arr>)
```
## パラメータ

| Parameter | デスクリプション   |
|-----------|---------------|
| `<arr>`   | integer array |

## 戻り値

BITMAPを返す
- 入力フィールドが無効な場合、結果はNULLになる

## 例

```sql
SELECT bitmap_to_string(bitmap_from_array(array(1, 0, 1, 1, 0, 1, 0))) AS bs;
```
```text
+------+
| bs   |
+------+
| 0,1  |
+------+
```
```sql
SELECT bitmap_to_string(bitmap_from_array(NULL)) AS bs;
```
```text
+------+
| bs   |
+------+
| NULL |
+------+
```
```sql
select bitmap_to_string(bitmap_from_array([1,2,3,-1]));
```
```text
+-------------------------------------------------+
| bitmap_to_string(bitmap_from_array([1,2,3,-1])) |
+-------------------------------------------------+
| NULL                                            |
+-------------------------------------------------+
```
