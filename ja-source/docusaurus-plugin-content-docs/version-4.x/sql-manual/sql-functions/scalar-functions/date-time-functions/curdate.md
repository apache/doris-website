---
{
  "title": "CURDATE,CURRENT_DATE",
  "description": "現在の日付を取得し、DATE型として返します。",
  "language": "ja"
}
---
## 説明

現在の日付を取得し、DATE型として返します。

この関数はMySQLの[curdate関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_curdate)と一致しています。

## エイリアス

- current_date

## 構文

```sql
CURDATE()
```
## Return Value

現在の日付。戻り値はdate型です。

## Examples

```sql
-- Get the current date
SELECT CURDATE();

+------------+
| CURDATE()  |
+------------+
| 2019-12-20 |
+------------+
```
