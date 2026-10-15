---
{
    "title": "FROM_UNIXTIME",
    "language": "ja",
    "description": "FROMUNIXTIME 関数は、Unix タイムスタンプ（秒）を指定した形式の日付時刻文字列または VARCHAR 型の値に変換します。"
}
---

## 説明


FROM_UNIXTIME 関数は、Unix タイムスタンプ（秒）を指定した形式の日付時刻文字列または VARCHAR 型の値に変換します。Unix タイムスタンプの基準時刻は 1970-01-01 00:00:00 UTC です。この関数は、入力されたタイムスタンプと書式文字列に基づいて、対応する日付時刻表現を生成します。入力されたタイムスタンプに小数部がある場合、結果にはマイクロ秒単位（小数点以下 6 桁）までの精度が含まれます。

この関数は、MySQL の [from_unixtime 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_from-unixtime) と同じ動作をします。

## 構文

```sql
FROM_UNIXTIME(<unix_timestamp> [, <string_format>])
```

## 引数

| 引数 | 説明 |
| -- | -- |
| `<unix_timestamp>` | 入力する Unix タイムスタンプ。BIGINT 型または DECIMAL 型で、1970-01-01 00:00:00 UTC からの秒数を表します。小数部を指定することもできます。 |
| `<string_format>` | 省略可能な書式文字列。VARCHAR 型と STRING 型をサポートします。デフォルトは %Y-%m-%d %H:%i:%s です。使用できる書式については、[date-format](./date-format) を参照してください。 |

## 戻り値

UTC の Unix タイムスタンプを現在のタイムゾーンの時刻に変換し、指定した形式の VARCHAR 型の値を返します。入力に小数部がある場合、結果には秒未満の精度が含まれます（例: `2007-12-01 00:30:19.500000`）。
- 現在サポートされている unix_timestamp の範囲は [0, 253402271999.999999] で、1970-01-01 00:00:00 から 9999-12-31 23:59:59.999999 までの日付時刻に対応します。この範囲外の unix_timestamp を指定するとエラーが発生します。
- string_format が無効な場合、想定と異なる文字列が返されます。
- いずれかの引数が NULL の場合、NULL を返します。
- 書式文字列が 128 文字を超える場合、エラーが発生します。

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

---Input is NULL, returns NULL
mysql> select from_unixtime(NULL);
+---------------------+
| from_unixtime(NULL) |
+---------------------+
| NULL                |
+---------------------+

```
