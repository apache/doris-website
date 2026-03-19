---
{
  "title": "マイクロ秒",
  "language": "ja",
  "description": "MICROSECOND関数は、入力されたdatetime値からマイクロ秒部分（小数点以下最大6桁）を抽出します。"
}
---
## 説明

MICROSECOND関数は、入力されたdatetime値からマイクロ秒部分（小数点以下最大6桁）を抽出し、0から999999の範囲で値を返します。この関数はマイクロ秒精度を持つDATETIME型の処理をサポートし、精度が不十分な入力に対しては自動的にゼロパディングを行います。


この関数はMySQLの[microsecond function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_microsecond)と同じ動作をします。

## 構文

```sql
MICROSECOND(`<datetime>`)
```
## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<datetime>` | DATETIME型の入力datetime値。datetime形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください。精度は0より大きくなければなりません。 |

## 戻り値

INT型を返し、datetime値のマイクロ秒部分を表します。範囲は0から999999です。精度が6未満の入力の場合、不足する桁はゼロでパディングされます。

- 入力datetimeにマイクロ秒部分が含まれていない場合（例：'2023-01-01 10:00:00'）、0を返します。
- 入力がNULLの場合、NULLを返します。
- 入力datetimeのマイクロ秒精度が6桁未満の場合、不足する桁は自動的にゼロでパディングされます（例：12:34:56.123は123000マイクロ秒として解析されます）。

## 例

```sql

-- Extracts a value with 6-digit microseconds
SELECT MICROSECOND(CAST('1999-01-02 10:11:12.000123' AS DATETIME(6)));
+----------------------------------------------------------------+
| MICROSECOND(CAST('1999-01-02 10:11:12.000123' AS DATETIME(6))) |
+----------------------------------------------------------------+
|                                                            123 |
+----------------------------------------------------------------+

-- Scale is 4
SELECT MICROSECOND(CAST('1999-01-02 10:11:12.0123' AS DATETIME(4)));
+--------------------------------------------------------------+
| MICROSECOND(CAST('1999-01-02 10:11:12.0123' AS DATETIME(4))) |
+--------------------------------------------------------------+
|                                                        12300 |
+--------------------------------------------------------------+

-- Pads microsecond part with zeros (precision less than 6 digits)
SELECT MICROSECOND(CAST('1999-01-02 10:11:12.123' AS DATETIME(6)));
+-------------------------------------------------------------+
| MICROSECOND(CAST('1999-01-02 10:11:12.123' AS DATETIME(6))) |
+-------------------------------------------------------------+
|                                                      123000 |
+-------------------------------------------------------------+

-- Datetime without scale returns 0
SELECT MICROSECOND(CAST('1999-01-02 10:11:12' AS DATETIME(6)));
+---------------------------------------------------------+
| MICROSECOND(CAST('1999-01-02 10:11:12' AS DATETIME(6))) |
+---------------------------------------------------------+
|                                                       0 |
+---------------------------------------------------------+

-- When a string literal is valid for both datetime and time, prefer parsing it as time
SELECT MICROSECOND("22:12:12.123456");
+--------------------------------+
| MICROSECOND("22:12:12.123456") |
+--------------------------------+
|                         123456 |
+--------------------------------+

-- Input is NULL, returns NULL
SELECT MICROSECOND(NULL);
+-------------------+
| MICROSECOND(NULL) |
+-------------------+
|              NULL |
+-------------------+

```
