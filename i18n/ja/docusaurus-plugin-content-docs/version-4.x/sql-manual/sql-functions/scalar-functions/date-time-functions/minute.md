---
{
    "title": "MINUTE",
    "language": "ja",
    "description": "MINUTE 関数は、入力された日時値から分を抽出し、0 から 59 までの整数を返します。"
}
---

## 説明

MINUTE 関数は、入力された日時値から分を抽出し、0 から 59 までの整数を返します。DATE 型、DATETIME 型、TIME 型の値に対応しています。

この関数の動作は、MySQL の [minute 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_minute) と同じです。

## 構文

```sql
MINUTE(`<date_or_time_expr>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ---- |
| `<date_or_time_expr>` | 入力する日時値。DATE 型、DATETIME 型、TIME 型を指定できます。日時、日付、時刻の形式については、[日時型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[日付型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)、[時刻型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)を参照してください。 |

## 戻り値

入力された日時値の分を表す、0 から 59 までの INT 型の整数を返します。

- 入力が DATE 型の場合は年月日のみを含み、時刻部分はデフォルトの 00:00:00 になるため、0 を返します。
- 入力が NULL の場合は NULL を返します。

## 例

```sql
-- Extract minute from DATETIME
SELECT MINUTE('2018-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
|     59 |
+--------+

-- Extract minute from DATETIME with microseconds (ignores microseconds)
SELECT MINUTE('2023-05-01 10:05:30.123456') AS result;
+--------+
| result |
+--------+
|      5 |
+--------+

SELECT MINUTE('14:25:45') AS result;
+--------+
| result |
+--------+
|     25 |
+--------+

-- Extract minute from DATE type (default time 00:00:00)
SELECT MINUTE('2023-07-13') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Input is NULL, returns NULL
SELECT MINUTE(NULL) AS result;
+--------+
| result |
+--------+
|   NULL |
+--------+
```
