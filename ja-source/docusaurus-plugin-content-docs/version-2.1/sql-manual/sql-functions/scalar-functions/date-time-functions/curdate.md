---
{
  "title": "CURDATE,CURRENT_DATE",
  "language": "ja",
  "description": "現在の日付を取得し、DATE型として返します。"
}
---
## 説明

現在の日付を取得し、DATE型として返します。

## エイリアス

- curdate
- current_date

## 構文

```sql
CURDATE()
```
## 戻り値

現在の日付。

## 例

```sql
SELECT CURDATE();
```
```text
+------------+
| CURDATE()  |
+------------+
| 2019-12-20 |
+------------+
```
```sql
SELECT CURDATE() + 0;
```
```text
+---------------+
| CURDATE() + 0 |
+---------------+
|      20191220 |
+---------------+
```
