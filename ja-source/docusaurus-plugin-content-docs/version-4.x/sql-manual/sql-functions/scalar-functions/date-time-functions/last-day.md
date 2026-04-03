---
{
  "title": "LAST_DAY",
  "description": "入力日付が属する月の最終日を返します。月に応じて、最終日は以下のようになります：",
  "language": "ja"
}
---
## 説明

入力された日付が含まれる月の最終日を返します。月によって、最終日は以下のようになります：

- 28日：平年（うるう年でない）の2月
- 29日：うるう年の2月
- 30日：4月、6月、9月、11月
- 31日：1月、3月、5月、7月、8月、10月、12月

この関数はMySQLの[LAST_DAY function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_last-day)と同じ動作をします。

## 構文

```sql
LAST_DAY(`<date_or_time_expr>`)
```
## 引数

| パラメータ | 説明 |
| --- | --- |
| `<date_or_time_expr>` | 有効な日付式。`DATE`/`DATETIME`型をサポートします。正確な形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

入力された日付の月の最終日を表す`DATE`型の値を返します（形式`YYYY-MM-DD`）。

- 入力が`NULL`の場合、`NULL`を返します。

## 例

```sql
-- Input is DATE; returns the last day of February in a leap year
mysql> SELECT LAST_DAY('2000-02-03');
+------------------------+
| LAST_DAY('2000-02-03') |
+------------------------+
| 2000-02-29             |
+------------------------+

-- Input is DATETIME; time part is ignored
mysql> SELECT LAST_DAY('2023-04-15 12:34:56');
+---------------------------------+
| LAST_DAY('2023-04-15 12:34:56') |
+---------------------------------+
| 2023-04-30                      |
+---------------------------------+

-- February in a common (non‑leap) year
mysql> SELECT LAST_DAY('2021-02-01');
+------------------------+
| LAST_DAY('2021-02-01') |
+------------------------+
| 2021-02-28             |
+------------------------+

-- Example of a 31‑day month
mysql> SELECT LAST_DAY('2023-01-10');
+------------------------+
| LAST_DAY('2023-01-10') |
+------------------------+
| 2023-01-31             |
+------------------------+

-- Input is NULL; returns NULL
mysql> SELECT LAST_DAY(NULL);
+----------------+
| LAST_DAY(NULL) |
+----------------
