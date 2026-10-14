---
{
    "title": "TIME_TO_SEC",
    "language": "ja",
    "description": "TIME、DATETIME、TIMESTAMP_NS の値の時刻部分を秒数に換算します。"
}
---

## 説明

TIME_TO_SEC 関数は、入力された時刻を秒数に換算します。`TIME`、`DATETIME`、`TIMESTAMP_NS` に対応しています。日時の値については、時刻部分（HH:MM:SS）を取り出して計算します。

この関数は MySQL の [TIME_TO_SEC 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_time-to-sec) と同じように動作します。

## 構文

```sql
TIME_TO_SEC(<date_or_time_expr>)
```

## パラメータ

| パラメータ | 説明 |
|------------|------|
| `<date_or_time_expr>` | 必須。`TIME`、`DATETIME`、`TIMESTAMP_NS` に対応します。日時の値については、時刻部分を取り出して計算します。 |

## 戻り値

入力された時刻に対応する秒数を INT 型で返します。計算式は「時×3600 + 分×60 + 秒」です。

- 日時文字列を入力する場合は、明示的に日時型へ変換する必要があります。変換しない場合はデフォルトで時刻型に変換され、NULL を返します。
- 入力が負の時刻（例：-01:30:00）の場合は、対応する負の秒数（例：-5400）を返します。
- 入力が NULL の場合は、NULL を返します。
- マイクロ秒部分は無視します（例：12:34:56.789 は 12:34:56 として計算します）。

## 例

```sql
-- Pure time type
SELECT TIME_TO_SEC('16:32:18') AS result;
+--------+
| result |
+--------+
|  59538 |
+--------+

-- Process the DATETIME string and return NULL.
SELECT TIME_TO_SEC('2025-01-01 16:32:18') AS result;
+--------+
| result |
+--------+
|   NULL |
+--------+

-- A datetime string needs to be explicitly converted to a datetime type.
SELECT TIME_TO_SEC(cast('2025-01-01 16:32:18' as datetime)) AS result;
+--------+
| result |
+--------+
|  59538 |
+--------+

-- Negative time conversion
SELECT TIME_TO_SEC('-02:30:00') AS result;
+--------+
| result |
+--------+
|  -9000 |
+--------+

-- Negative time with microseconds (ignore microseconds)
SELECT TIME_TO_SEC('-16:32:18.99') AS result;
+--------+
| result |
+--------+
| -59538 |
+--------+

-- Microsecond processing (ignore microseconds)
SELECT TIME_TO_SEC('10:15:30.123456') AS result;
+--------+
| result |
+--------+
|  36930 |
+--------+

-- Invalid time
SELECT TIME_TO_SEC('12:60:00') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Exceeds TIME range
SELECT TIME_TO_SEC('839:00:00') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Parameter is NULL
SELECT TIME_TO_SEC(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
