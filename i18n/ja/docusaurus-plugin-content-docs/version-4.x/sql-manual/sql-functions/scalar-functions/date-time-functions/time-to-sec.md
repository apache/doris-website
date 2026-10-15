---
{
    "title": "TIME_TO_SEC",
    "language": "ja",
    "description": "TIME_TO_SEC 関数は、入力された時刻を合計秒数に変換します。"
}
---

## 説明

TIME_TO_SEC 関数は、入力された時刻を合計秒数に変換します。TIME 型と DATETIME 型に対応しており、DATETIME 型の場合は時刻部分（HH:MM:SS）を取り出して計算し、時刻値の場合はそのまま合計秒数に変換します。

この関数の動作は、MySQL の [time_to_sec 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_time-to-sec) と同じです。

## 構文

```sql
TIME_TO_SEC(<date_or_time_expr>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<date_or_time_expr>` | 必須。TIME 型または DATETIME 型を指定できます。DATETIME 型の場合は時刻部分を取り出して計算します。日時と日付の具体的な形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

入力された時刻に対応する合計秒数を INT 型で返します。計算式は「時×3600 + 分×60 + 秒」です。

- 日時を表す文字列を入力する場合は、明示的に DATETIME 型に変換する必要があります。変換しない場合、デフォルトでは TIME 型として変換され、NULL が返されます。
- 入力が負の時刻（例: -01:30:00）の場合は、対応する負の秒数（例: -5400）を返します。
- 入力が NULL の場合は、NULL を返します。
- マイクロ秒部分は無視します（例: 12:34:56.789 は 12:34:56 として計算します）。

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
