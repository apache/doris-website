---
{
    "title": "HOURS_ADD",
    "language": "ja",
    "description": "DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ の値に時間を加算、または値から時間を減算します。"
}
---

## 説明

HOURS_ADD 関数は、日付または日時の値に指定した時間数を加算するか、その値から減算し、計算後の日時を返します。入力には DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ を使用できます。入力が DATE 型（年、月、日のみ）の場合は、時刻部分を 00:00:00 として計算します。

この関数は、Doris の [date_add 関数](./date-add) および MySQL の [date_add 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) で `HOUR` 単位を使用した場合と同じ動作をします。

## 構文

```sql
HOURS_ADD(`<date_or_time_expr>`, `<hours>`)
```

## パラメータ

| パラメータ | 説明 |
| ---- | ---- |
| `<date_or_time_expr>` | 有効な日付または日時の式。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型をサポートします。具体的な形式については、[timestamptz 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください。 |
| `<hours>` | 加算する時間数を表す整数（INT 型）。正の値を指定するとその時間数を加算し、負の値を指定するとその時間数を減算します。 |

## 戻り値

基準となる日時 `<date_or_time_expr>` に指定した時間数 `<hours>` を加算した値を返します。戻り値の型は最初のパラメータの型によって決まります。
- 最初のパラメータが `DATE` または `DATETIME` の場合は `DATETIME` 型、`TIMESTAMP_NS` の場合は `TIMESTAMP_NS` 型を返します。
- 最初のパラメータが TIMESTAMPTZ の場合は TIMESTAMPTZ 型を返します。

特殊なケース:
- 計算結果が DATETIME 型の有効範囲 [0000-01-01 00:00:01, 9999-12-31 23:59:59] を超える場合は、エラーを返します。
- いずれかのパラメータが NULL の場合は、NULL を返します。

## 例

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
