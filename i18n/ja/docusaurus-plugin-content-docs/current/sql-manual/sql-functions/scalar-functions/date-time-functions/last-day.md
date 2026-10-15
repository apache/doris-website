---
{
    "title": "LAST_DAY",
    "language": "ja",
    "description": "入力した日付が属する月の末日を返します。月によって、末日は次のようになります。"
}
---

## 説明

入力した日付が属する月の末日を返します。月によって、末日は次のようになります。

- 28 日：平年（うるう年以外）の二月
- 29 日：うるう年の二月
- 30 日：四月、六月、九月、十一月
- 31 日：一月、三月、五月、七月、八月、十月、十二月

この関数は MySQL の [LAST_DAY 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_last-day) と同じ動作をします。

## 構文

```sql
LAST_DAY(`<date_or_time_expr>`)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<date_or_time_expr>` | 有効な `DATE`、`DATETIME`、または `TIMESTAMP_NS` 型の式。 |

## 戻り値

入力した日付が属する月の末日を表す `DATE` 型の値を返します（形式は `YYYY-MM-DD`）。

- 入力が `NULL` の場合は、`NULL` を返します。

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
