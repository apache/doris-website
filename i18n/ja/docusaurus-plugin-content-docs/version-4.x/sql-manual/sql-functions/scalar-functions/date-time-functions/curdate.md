---
{
    "title": "CURDATE,CURRENT_DATE",
    "language": "ja",
    "description": "現在の日付を取得し、DATE 型で返します。"
}
---

## 説明

現在の日付を取得し、DATE 型で返します。

この関数は、MySQL の [curdate 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_curdate) と同じ動作をします。

## 別名

- current_date

## 構文

```sql
CURDATE()
```

## 戻り値

現在の日付を DATE 型で返します。

## 使用例

```sql
-- Get the current date
SELECT CURDATE();

+------------+
| CURDATE()  |
+------------+
| 2019-12-20 |
+------------+
```
