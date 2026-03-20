---
{
  "title": "BITMAP_CONTAINS",
  "language": "ja",
  "description": "入力値がBITMAP内にあるかどうかを計算し、boolean値を返します。"
}
---
## 説明

入力値がBITMAPに含まれているかどうかを計算し、boolean値を返します。

## 構文

```sql
BITMAP_CONTAINS(<bitmap>, <bigint>)
```
## パラメータ

| パラメータ  | 説明                             |
|------------|----------------------------------|
| `<bitmap>` | BITMAPコレクション                |
| `<bitint>` | 存在確認を行う整数                |

## 戻り値

booleanを返します
- パラメータがNULLの場合、NULLを返します

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
