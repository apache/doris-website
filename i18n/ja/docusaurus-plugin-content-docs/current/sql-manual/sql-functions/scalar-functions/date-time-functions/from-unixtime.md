---
{
    "title": "FROM_UNIXTIME",
    "language": "ja",
    "description": "FROM_UNIXTIME 関数は、Unix タイムスタンプ（秒単位）を、指定した形式の日時文字列または VARCHAR 型の値に変換します。"
}
---

## 説明


FROM_UNIXTIME 関数は、Unix タイムスタンプ（秒単位）を、指定した形式の日時文字列または VARCHAR 型の値に変換します。Unix タイムスタンプの基準時刻は 1970-01-01 00:00:00 UTC で、この関数は入力されたタイムスタンプと書式文字列に基づいて対応する日時を生成します。`%f` はマイクロ秒を出力し、値を小数点以下六桁に丸めます。`%n` は小数部分を最大九桁まで保持し、ナノ秒として出力します。

この関数は、MySQL の [from_unixtime 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_from-unixtime) と同じ動作をします。

## 構文

```sql
FROM_UNIXTIME(<unix_timestamp> [, <string_format>])
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<unix_timestamp>` | 入力する Unix タイムスタンプ。BIGINT 型または DECIMAL 型で、1970-01-01 00:00:00 UTC からの経過秒数を表します。小数秒を含めることもできます。 |
| `<string_format>` | 省略可能な書式文字列。VARCHAR 型または STRING 型を使用できます。既定値は %Y-%m-%d %H:%i:%s です。書式の詳細については、[date-format](./date-format) を参照してください。 |

## 戻り値

指定した形式の日時を VARCHAR 型で返します。UTC 基準の Unix タイムスタンプを現在のタイムゾーンの時刻に変換した結果です。入力に小数部分が含まれる場合、結果には秒未満の精度が含まれます（例：`2007-12-01 00:30:19.500000`）。
- 現在サポートされる unix_timestamp の範囲は [0, 253402271999.999999] で、1970-01-01 00:00:00 から 9999-12-31 23:59:59.999999 までの日時に対応します。この範囲外の unix_timestamp はエラーになります。
- string_format が無効な場合、期待どおりでない文字列を返します。
- `%f` と `%n` は丸め精度が異なるため、同じ書式に両方を含めることはできません。
- いずれかのパラメータが NULL の場合、NULL を返します。
- 書式の長さが 128 文字を超える場合、エラーになります。

## 例

```sql

----Since the current timezone is East 8th zone, the returned time is 8 hours ahead of UTC
select from_unixtime(0);
+---------------------+
| from_unixtime(0)    |
+---------------------+
| 1970-01-01 08:00:00 |
+---------------------+

---Default format %Y-%m-%d %H:%i:%s return
mysql> select from_unixtime(1196440219);
+---------------------------+
| from_unixtime(1196440219) |
+---------------------------+
| 2007-12-01 00:30:19       |
+---------------------------+

---Specify yyyy-MM-dd HH:mm:ss format return
mysql> select from_unixtime(1196440219, 'yyyy-MM-dd HH:mm:ss');
+--------------------------------------------------+
| from_unixtime(1196440219, 'yyyy-MM-dd HH:mm:ss') |
+--------------------------------------------------+
| 2007-12-01 00:30:19                              |
+--------------------------------------------------+


---Specify %Y-%m-%d date-only format return
mysql> select from_unixtime(1196440219, '%Y-%m-%d');
+-----------------------------------------+
| from_unixtime(1196440219, '%Y-%m-%d') |
+-----------------------------------------+
| 2007-12-01                              |
+-----------------------------------------+

---Specify %Y-%m-%d %H:%i:%s format return
mysql> select from_unixtime(1196440219, '%Y-%m-%d %H:%i:%s');
+--------------------------------------------------+
| from_unixtime(1196440219, '%Y-%m-%d %H:%i:%s') |
+--------------------------------------------------+
| 2007-12-01 00:30:19                              |
+--------------------------------------------------+

---Exceeds maximum range, returns error
select from_unixtime(253402281999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation from_unixtime_new of 253402281999, yyyy-MM-dd HH:mm:ss is invalid

---result over max length
select from_unixtime(32536799,repeat('a',129));
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation from_unixtime_new of invalid or oversized format is invalid

---string-format does not reference any time values
mysql> select from_unixtime(32536799,"gdaskpdp");
+------------------------------------+
| from_unixtime(32536799,"gdaskpdp") |
+------------------------------------+
| gdaskpdp                           |
+------------------------------------+

---Fractional timestamp input, result includes sub-second precision
mysql> select from_unixtime(1196440219.5);
+-----------------------------+
| from_unixtime(1196440219.5) |
+-----------------------------+
| 2007-12-01 00:30:19.500000  |
+-----------------------------+

---Fractional timestamp with microsecond precision
mysql> select from_unixtime(1196440219.123456);
+----------------------------------+
| from_unixtime(1196440219.123456) |
+----------------------------------+
| 2007-12-01 00:30:19.123456       |
+----------------------------------+

---Use %f format specifier to display microseconds explicitly
mysql> select from_unixtime(1196440219.123456, '%Y-%m-%d %H:%i:%s.%f');
+----------------------------------------------------------+
| from_unixtime(1196440219.123456, '%Y-%m-%d %H:%i:%s.%f') |
+----------------------------------------------------------+
| 2007-12-01 00:30:19.123456                               |
+----------------------------------------------------------+

---Use %n to preserve nanoseconds
mysql> select from_unixtime(1196440219.123456789, '%Y-%m-%d %H:%i:%s.%n');
+-------------------------------------------------------------+
| from_unixtime(1196440219.123456789, '%Y-%m-%d %H:%i:%s.%n') |
+-------------------------------------------------------------+
| 2007-12-01 00:30:19.123456789                               |
+-------------------------------------------------------------+

---Input is NULL, returns NULL
mysql> select from_unixtime(NULL);
+---------------------+
| from_unixtime(NULL) |
+---------------------+
| NULL                |
+---------------------+

```
