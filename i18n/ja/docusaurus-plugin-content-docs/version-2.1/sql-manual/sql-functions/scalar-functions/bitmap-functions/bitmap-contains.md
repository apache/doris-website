---
{
  "title": "BITMAP_CONTAINS",
  "language": "ja",
  "description": "入力値がBITMAP内に存在するかを計算し、ブール値を返します。"
}
---
## 説明

入力値がBITMAPに含まれているかどうかを計算し、ブール値を返します。

## 構文

```sql
BITMAP_CONTAINS(<bitmap>, <bigint>)
```
## パラメータ

| パラメータ | 説明                                    |
|------------|-----------------------------------------|
| `<bitmap>` | BITMAPコレクション                      |
| `<bitint>` | 存在をチェックする整数                  |

## 戻り値

booleanを返します
- パラメータが空の場合、NULLを返します

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
