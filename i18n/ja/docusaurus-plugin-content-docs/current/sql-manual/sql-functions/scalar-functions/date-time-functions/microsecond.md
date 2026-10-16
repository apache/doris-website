---
{
    "title": "MICROSECOND",
    "language": "ja",
    "description": "DATETIME または TIMESTAMP_NS の値から小数秒部分の先頭六桁を、四捨五入せずに抽出します。"
}
---

## 説明

MICROSECOND 関数は、入力された日時値の小数秒部分から先頭六桁を抽出し、0から999999までの値を返します。DATETIME 型と TIMESTAMP_NS 型に対応しています。桁数が足りない場合は末尾をゼロで補います。TIMESTAMP_NS 型では、末尾のナノ秒三桁を無視します。九桁すべてを取得するには、[NANOSECOND](./nanosecond) を使用してください。


この関数の動作は、MySQL の [microsecond 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_microsecond) と同じです。

## 構文

```sql
MICROSECOND(`<datetime>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<datetime>` | 入力する日時値。DATETIME 型または TIMESTAMP_NS 型を指定します。対応する形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[TIMESTAMP_NS の変換](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md)を参照してください。 |

## 戻り値

日時値のマイクロ秒部分を表す INT 型の値を返します。範囲は0から999999までです。精度が6桁未満の入力では、足りない桁をゼロで補います。

- 入力された日時値にマイクロ秒部分がない場合（例：'2023-01-01 10:00:00'）、0を返します。
- 入力が NULL の場合、NULL を返します。
- 入力された日時値のマイクロ秒精度が6桁未満の場合、足りない桁を自動的にゼロで補います（例：12:34:56.123 は123000マイクロ秒として解析されます）。
- TIMESTAMP_NS 型では、末尾の三桁を四捨五入せず、小数秒部分の先頭六桁を返します。

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

-- For TIMESTAMP_NS, the final three nanosecond digits are ignored
SELECT MICROSECOND(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS));
+-----------------------------------------------------------------------+
| MICROSECOND(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS)) |
+-----------------------------------------------------------------------+
|                                                                123456 |
+-----------------------------------------------------------------------+

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
