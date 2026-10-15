---
{
    "title": "MONTH",
    "language": "ja",
    "description": "MONTH 関数は日時値から月の値を抽出します。戻り値は 1 から 12 までで、年間の 12 か月を表します。"
}
---

## 説明

MONTH 関数は日時値から月の値を抽出します。戻り値は 1 から 12 までで、年間の 12 か月を表します。この関数は DATE 型と DATETIME 型の値を処理できます。

この関数は、MONTH を単位として使用する場合、MySQL の [MONTH 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_month) と同じ動作をします。

## 構文

```sql
MONTH(`<date_or_time_expr>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力する日時値。DATE 型と DATETIME 型に対応します。日時と日付の具体的な形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

月を表す TINYINT 型の値を返します。
- 範囲は 1 から 12 までです。
- 1 は一月、12 は十二月を表します。
- 入力が NULL の場合は NULL を返します。

## 例

```sql
-- Extract month from DATE type
SELECT MONTH('1987-01-01') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

-- Extract month from DATETIME type
SELECT MONTH('2023-07-13 22:28:18') AS result;
+--------+
| result |
+--------+
|      7 |
+--------+

-- Extract month from DATETIME with fractional seconds
SELECT MONTH('2023-12-05 10:15:30.456789') AS result;
+--------+
| result |
+--------+
|     12 |
+--------+

-- Returns NULL when input is NULL
SELECT MONTH(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
