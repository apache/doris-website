---
{
  "title": "BITMAP_FROM_ARRAY",
  "description": "TINYINT/SMALLINT/INT/BIGINT型の配列をBITMAPに変換します。入力フィールドが不正な場合、結果はNULLを返します。",
  "language": "ja"
}
---
## デスクリプション

TINYINT/SMALLINT/INT/BIGINT型の配列をBITMAPに変換します。入力フィールドが不正な場合、結果はNULLを返します。

## Syntax

```sql
BITMAP_FROM_ARRAY(<arr>)
```
## パラメータ

| Parameter | デスクリプション   |
|-----------|---------------|
| `<arr>`   | integer配列 |

## Return Value

BITMAPを返します
- 入力フィールドが無効な場合、結果はNULLになります

## Examples

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
