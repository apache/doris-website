---
{
  "title": "BITMAP_FROM_ARRAY",
  "language": "ja",
  "description": "TINYINT/SMALLINT/INT/BIGINT型の配列をBITMAPに変換します。入力フィールドが不正な場合、結果はNULLを返します。"
}
---
## 説明

TINYINT/SMALLINT/INT/BIGINT型の配列をBITMAPに変換します。入力フィールドが不正な場合、結果はNULLを返します。

## 構文

```sql
BITMAP_FROM_ARRAY(<arr>)
```
## パラメータ

| パラメータ | 説明   |
|-----------|--------|
| `<arr>`   | 整数配列 |

## 戻り値

BITMAPを返します
- 入力フィールドが無効な場合、結果はNULLです

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
