---
{
    "title": "SECOND",
    "language": "ja",
    "description": "SECOND 関数は、指定した日時値から秒の部分を抽出し、0 から 59 までの整数を返します。"
}
---

## 説明

SECOND 関数は、指定した日時値から秒の部分を抽出し、0 から 59 までの整数を返します。この関数は DATE、DATETIME、TIMESTAMP_NS、TIME 型を処理できます。

この関数の動作は、MySQL の [SECOND 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_second)と同じです。

## 構文

```sql
SECOND(<date_or_time_expr>)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力する日時値。DATE、DATETIME、TIMESTAMP_NS、TIME 型を指定できます。日時・日付・時刻の具体的な形式については、[日時変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[日付変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)、[時刻変換](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)を参照してください。 |

## 戻り値

入力した日時の秒の部分を表す INT 型の値を返します。

- 範囲: 0 から 59 まで（両端を含む）
- 入力が DATE 型の場合は、既定の時刻が 00:00:00 のため 0 を返します
- 入力が NULL の場合は NULL を返します
- マイクロ秒の部分は無視します（例: 12:34:56.789 からは秒の値 56 のみを抽出します）

## 例

```sql
-- Extract seconds from DATETIME
SELECT SECOND('2018-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
|     59 |
+--------+

-- Input is TIME type
SELECT SECOND(cast('15:42:33' as time)) AS result;
+--------+
| result |
+--------+
|     33 |
+--------+

-- Input is DATE type (default seconds is 0)
SELECT SECOND('2023-07-13') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Time with microseconds (ignores microseconds)
SELECT SECOND('2023-07-13 10:30:25.123456') AS result;
+--------+
| result |
+--------+
|     25 |
+--------+

-- Case where seconds is 0
SELECT SECOND('2024-01-01 00:00:00') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- When a string literal is valid for both datetime and time, prefer parsing it as time
SELECT SECOND("22:12:12");
+--------------------+
| SECOND("22:12:12") |
+--------------------+
|                 12 |
+--------------------+

-- Input is NULL (returns NULL)
SELECT SECOND(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
