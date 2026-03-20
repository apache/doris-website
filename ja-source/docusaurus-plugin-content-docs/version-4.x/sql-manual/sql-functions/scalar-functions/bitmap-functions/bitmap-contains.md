---
{
  "title": "BITMAP_CONTAINS",
  "description": "入力値がBITMAPに含まれているかどうかを計算し、boolean値を返します。",
  "language": "ja"
}
---
## デスクリプション

入力値がBITMAPに含まれているかどうかを計算し、ブール値を返します。

## Syntax

```sql
BITMAP_CONTAINS(<bitmap>, <bigint>)
```
## パラメーター

| Parameter  | デスクリプション                             |
|------------|-----------------------------------------|
| `<bitmap>` | BITMAPコレクション                        |
| `<bitint>` | 存在を確認する整数                         |

## 戻り値

booleanを返す
- パラメーターがNULLの場合、NULLを返す

## 例

```sql
select bitmap_contains(to_bitmap(1),2) cnt1, bitmap_contains(to_bitmap(1),1) cnt2;
```
```text
+------+------+
| cnt1 | cnt2 |
+------+------+
|    0 |    1 |
+------+------+
```
```sql
select bitmap_contains(NULL,2) cnt1, bitmap_contains(to_bitmap(1),NULL) cnt2;
```
```text
+------+------+
| cnt1 | cnt2 |
+------+------+
| NULL | NULL |
+------+------+
```
