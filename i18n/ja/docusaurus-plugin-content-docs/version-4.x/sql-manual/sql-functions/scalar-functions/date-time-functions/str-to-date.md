---
{
    "title": "STR_TO_DATE",
    "language": "ja",
    "description": "指定された形式に従って、入力した日時文字列を DATETIME 型の値に変換します。"
}
---

## 説明

指定された形式に従って、入力した日時文字列を DATETIME 型の値に変換します。

この関数は、MySQL の [str_to_date 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_str-to-date) と同じ動作をします。

## 構文

```sql
STR_TO_DATE(<datetime_str>, <format>)
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `<datetime_str>` | 必須。変換する日付または時刻を表す入力文字列です。サポートされる入力形式については、[日時変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<format>` | 必須。`%Y-%m-%d %H:%i:%s` などの日時形式を指定する文字列です。使用できる形式指定子については、[DATE_FORMAT](./date-format#parameters) のドキュメントを参照してください。 |

また、`<format>` には次の代替形式も指定できます。これらは対応する通常の形式として解釈されます。

| 代替入力形式 | 解釈される形式 |
|--------------|----------------|
| `yyyyMMdd`                 | `%Y%m%d`             |
| `yyyy-MM-dd`               | `%Y-%m-%d`           |
| `yyyy-MM-dd HH:mm:ss`      | `%Y-%m-%d %H:%i:%s`  |

## 戻り値

変換された日付と時刻を表す DATETIME 値を返します。

日付と時刻の照合では、二つのポインタをそれぞれの文字列の先頭に置き、次のように処理します。

1. 形式文字列で % 記号に到達した場合は、その次の文字を使って日時文字列の対応する部分を照合します。一致しない場合（たとえば %Y で 10:10:10 のような時刻部分を照合しようとした場合や、%* のように % の後にサポートされない文字が続く場合）はエラーを返します。一致した場合は、次の文字に進んで解析します。
2. いずれかの文字列で空白文字に到達した場合は、その文字を読み飛ばして次の文字を解析します。
3. 通常の文字を照合する場合は、両方のポインタが指す文字が同じか確認します。異なればエラーを返し、同じであれば次の文字を解析します。
4. 日時文字列のポインタが末尾に達したとき、日時文字列に日付部分しかない場合は、形式文字列に時刻部分を表す文字（%H など）が含まれるか確認します。含まれる場合、時刻部分を 00:00:00 に設定します。
5. 形式文字列のポインタが末尾に達すると、照合を終了します。
6. 最後に、照合した日時の各部分が有効か確認します（たとえば月は [1,12] の範囲内である必要があります）。無効であればエラーを返し、有効であれば解析した日付と時刻を返します。

エラー処理：

- いずれかの引数が NULL の場合は、NULL を返します。
- `<format>` が空文字列の場合は、NULL を返します。
- `<datetime_str>` と `<format>` の照合に失敗した場合は、NULL を返します。

## 例

```sql
-- Parse using standard format specifiers
SELECT STR_TO_DATE('2025-01-23 12:34:56', '%Y-%m-%d %H:%i:%s') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- Parse using alternative format
SELECT STR_TO_DATE('2025-01-23 12:34:56', 'yyyy-MM-dd HH:mm:ss') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- Date string only (time defaults to 00:00:00)
SELECT STR_TO_DATE('20230713', 'yyyyMMdd') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 00:00:00 |
+---------------------+

-- Parse string with week number and weekday
SELECT STR_TO_DATE('200442 Monday', '%X%V %W') AS result;
+------------+
| result     |
+------------+
| 2004-10-18 |
+------------+

-- Parse abbreviated month name and 12-hour time
SELECT STR_TO_DATE('Oct 5 2023 3:45:00 PM', '%b %d %Y %h:%i:%s %p') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-10-05 15:45:00 |
+---------------------+

-- Format does not match string (returns NULL)
SELECT STR_TO_DATE('2023/01/01', '%Y-%m-%d') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- String contains extra characters (automatically ignored)
SELECT STR_TO_DATE('2023-01-01 10:00:00 (GMT)', '%Y-%m-%d %H:%i:%s') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 10:00:00 |
+---------------------+

-- Parse microseconds (precision preserved)
SELECT STR_TO_DATE('2023-07-13 12:34:56.789', '%Y-%m-%d %H:%i:%s.%f') AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 12:34:56.789000 |
+----------------------------+

-- Any parameter is NULL (returns NULL)
SELECT STR_TO_DATE(NULL, '%Y-%m-%d'), STR_TO_DATE('2023-01-01', NULL) AS result;
+--------------------------------+--------+
| str_to_date(NULL, '%Y-%m-%d')  | result |
+--------------------------------+--------+
| NULL                           | NULL   |
+--------------------------------+--------+

-- Format is an empty string (returns NULL)
SELECT STR_TO_DATE('2023-01-01', '') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
