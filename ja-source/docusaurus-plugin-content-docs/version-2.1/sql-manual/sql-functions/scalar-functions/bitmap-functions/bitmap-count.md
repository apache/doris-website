---
{
  "title": "BITMAP_COUNT",
  "language": "ja",
  "description": "入力BITMAPの要素数を数える"
}
---
## 説明

入力BITMAPの要素数をカウントします

## 構文

```sql
BITMAP_COUNT(<bitmap>)
```
## パラメータ

| パラメータ  | 説明 |
|------------|-------------|
| `<bitmap>` | BITMAP    |

## 戻り値

整数を返します

## 例

```sql
select bitmap_count(to_bitmap(1)) cnt;
```
```text
+------+
| cnt  |
+------+
|    1 |
+------+
```
