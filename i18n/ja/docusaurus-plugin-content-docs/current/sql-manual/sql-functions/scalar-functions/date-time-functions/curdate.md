---
{
  "title": "CURDATE,CURRENT_DATE",
  "language": "ja",
  "description": "現在の日付を取得し、DATE型として返します。"
}
---
## 説明

現在の日付を取得し、DATE型として返します。

この関数は、MySQLの[curdate function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_curdate)と一致しています。

## エイリアス

- current_date

## 構文

```sql
CURDATE()
```
## 戻り値

現在の日付。戻り値はdate型です。

## 例

```sql
-- Get the current date
SELECT CURDATE();

+------------+
| CURDATE()  |
+------------+
| 2019-12-20 |
+------------+
```
