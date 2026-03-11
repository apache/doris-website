---
{
  "title": "BITMAP_COUNT",
  "description": "入力BITMAPの要素数をカウントします",
  "language": "ja"
}
---
## 説明

入力されたBITMAP内の要素数を数える

## 構文

```sql
BITMAP_COUNT(<bitmap>)
```
## パラメータ

| パラメータ | 説明 |
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
```sql
select bitmap_count(bitmap_empty()) cnt;
```
```text
+------+
| cnt  |
+------+
|    0 |
+------+
```
