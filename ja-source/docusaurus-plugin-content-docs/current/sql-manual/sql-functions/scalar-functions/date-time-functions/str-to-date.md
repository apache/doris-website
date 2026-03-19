---
{
  "title": "STR_TO_DATE",
  "language": "ja",
  "description": "この関数は、指定されたフォーマットに基づいて入力datetime文字列をDATETIME型の値に変換します。"
}
---
## 説明

この関数は、指定されたフォーマットに基づいて、入力された日時文字列をDATETIME型の値に変換します。

この関数は、MySQLの[str_to_date function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_str-to-date)と一貫した動作をします。

## 構文

```sql
STR_TO_DATE(<datetime_str>, <format>)
```
## パラメータ

| パラメータ        | 説明                                                                                                                                                                                                                                                                                                      |
|------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<datetime_str>` | 必須。変換される日付または時刻を表す入力datetime文字列。サポートされる入力フォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) および [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください |
| `<format>`       | 必須。指定されたdatetimeフォーマット文字列。例：`%Y-%m-%d %H:%i:%s` など。具体的なフォーマットパラメータについては、[DATE_FORMAT](./date-format#parameters) のドキュメントを参照してください                                                                                                                               |

さらに、`<format>` は以下の代替フォーマットをサポートし、通常のフォーマットに従って解釈します：

| 代替入力          | 解釈される形式       |
|----------------------------|----------------------|
| `yyyyMMdd`                 | `%Y%m%d`             |
| `yyyy-MM-dd`               | `%Y-%m-%d`           |
| `yyyy-MM-dd HH:mm:ss`      | `%Y-%m-%d %H:%i:%s`  |

## 戻り値

変換された日付と時刻を表すDATETIME値を返します。

日付と時刻のマッチング方法では、両方の文字列の開始位置を指す2つのポインタを使用します：

1. フォーマット文字列が%記号に遭遇した場合、%の後の次の文字を使用して日付/時刻文字列の対応する部分をマッチングします。マッチしない場合（例：%Yが10:10:10のような時刻部分をマッチングしようとする、または%の後に%*のようなサポートされていない文字が続く）、エラーを返します。正常にマッチした場合、次の文字に移動して解析を続行します。
2. いずれかの文字列が空白文字に遭遇した場合、それをスキップして次の文字を解析します。
3. 通常の文字をマッチングする際、両方のポインタが指す文字が等しいかチェックします。等しくない場合はエラーを返し、等しい場合は次の文字を解析します。
4. 日付ポインタが文字列の終端に達した際、日付/時刻が日付部分のみを含む場合、フォーマット文字列は時刻部分の文字（例：%H）が含まれているかチェックします。含まれている場合、時刻部分は00:00:00に設定されます。
5. フォーマット文字列のポインタが終端に達すると、マッチングが終了します。
6. 最後に、マッチした時刻部分が有効かどうかをチェックします（例：月は[1,12]の範囲内である必要があります）。無効な場合はエラーを返し、有効な場合は解析された日付と時刻を返します。

エラーハンドリング:

- いずれかのパラメータがNULLの場合、NULLを返します
- `<format>` が空文字列の場合、NULLを返します
- `<datetime_str>` と `<format>` 間のマッチングが失敗した場合、NULLを返します

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
