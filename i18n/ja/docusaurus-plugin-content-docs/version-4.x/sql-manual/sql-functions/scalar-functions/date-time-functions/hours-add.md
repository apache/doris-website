---
{
    "title": "HOURS_ADD",
    "language": "ja",
    "description": "HOURSADD 関数は、入力した日付または日時の値に指定した時間数を加算または減算し、計算後の日時を返します。"
}
---

## 説明 {#description}

HOURS_ADD 関数は、入力した日付または日時の値に指定した時間数を加算または減算し、計算後の日時を返します。この関数は DATE、DATETIME、TIMESTAMPTZ 型の入力に対応します。入力が DATE 型（年、月、日のみ）の場合は、時刻部分を 00:00:00 としてから時間数を加算します。

この関数の動作は、[date_add 関数](./date-add) および MySQL の [date_add 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) で `HOUR` 単位を使用した場合の動作と同じです。

## 構文 {#syntax}

```sql
HOURS_ADD(`<date_or_time_expr>`, `<hours>`)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| ---- | ---- |
| `<date_or_time_expr>` | DATE、DATETIME、TIMESTAMPTZ 型に対応する有効な日付式。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<hours>` | 加算する時間数。整数（INT）型です。正の値を指定するとその時間数を加算し、負の値を指定するとその時間数を減算します。 |

## 戻り値 {#return-value}

基準日時 `<date_or_time_expr>` に指定した時間数 `<hours>` を加算した結果を返します。戻り値の型は最初の引数の型によって決まります。
- 最初の引数が DATE または DATETIME 型の場合、戻り値は DATETIME 型です。
- 最初の引数が TIMESTAMPTZ 型の場合、戻り値は TIMESTAMPTZ 型です。

特殊なケース：
- 計算結果が DATETIME 型の有効範囲 [0000-01-01 00:00:01, 9999-12-31 23:59:59] を超えた場合は、エラーを返します。
- いずれかの引数が NULL の場合は NULL を返します。

## 例 {#examples}

```sql

-- Add hours to datetime type
SELECT HOURS_ADD('2020-02-02 02:02:02', 1);
+------------------------------------------------------------+
| hours_add(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), 1) |
+------------------------------------------------------------+
| 2020-02-02 03:02:02                                        |
+------------------------------------------------------------+

-- Add hours to date type (default time is 00:00:00)
SELECT HOURS_ADD('2020-02-02', 51);
+-----------------------------+
| HOURS_ADD('2020-02-02', 51) |
+-----------------------------+
| 2020-02-04 03:00:00         |
+-----------------------------+

-- Add negative hours (i.e., subtract hours)
select hours_add('2023-10-01 10:00:00', -3) ;
+--------------------------------------+
| hours_add('2023-10-01 10:00:00', -3) |
+--------------------------------------+
| 2023-10-01 07:00:00                  |
+--------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT HOURS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| HOURS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-10 13:22:33.123+08:00                 |
+-----------------------------------------------+

-- Input parameter is NULL, return NULL
select hours_add(null, 5) ;
+--------------------+
| hours_add(null, 5) |
+--------------------+
| NULL               |
+--------------------+

select hours_add('2023-10-01 10:00:00',NULL) ;
+---------------------------------------+
| hours_add('2023-10-01 10:00:00',NULL) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

-- Exceeds datetime range
select hours_add('9999-12-31 23:59:59', 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 9999-12-31 23:59:59, 2 out of range

mysql> select hours_add('0000-01-01',-2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 0000-01-01 00:00:00, -2 out of range
```
