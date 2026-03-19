---
{
  "title": "FROM_UNIXTIME",
  "language": "ja",
  "description": "FROMUNIXTIME関数は、Unixタイムスタンプ（秒単位）を指定された形式の日時文字列またはVARCHAR型の値に変換するために使用されます。"
}
---
## 説明

FROM_UNIXTIME関数は、Unixタイムスタンプ（秒単位）を指定されたフォーマットの日時文字列またはVARCHAR型の値に変換するために使用されます。Unixタイムスタンプの基準時刻は1970-01-01 00:00:00 UTCであり、この関数は入力されたタイムスタンプとフォーマット文字列に基づいて対応する日時表現を生成します。

この関数はMySQLの[from_unixtime function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_from-unixtime)と一致しています。

## 構文

```sql
FROM_UNIXTIME(<unix_timestamp> [, <string_format>])
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<unix_timestamp>` | 入力するUnixタイムスタンプ、整数型BIGINTで、1970-01-01 00:00:00 UTCからの秒数を表す |
| `<string_format>` | フォーマット文字列、varcharおよびstring型をサポート、デフォルトは%Y-%m-%d %H:%i:%s。具体的なフォーマットについては[date-format](./date-format)を参照してください |

## 戻り値

指定されたフォーマットの日付を返します。型はVARCHARで、UTCタイムゾーンのunixタイムスタンプを現在のタイムゾーン時刻に変換した結果を返します。
- 現在サポートされているunix_timestampの範囲は[0, 253402271999]で、1970-01-01 00:00:00から9999-12-31 23:59:59までの日付に対応します。この範囲外のunix_timestampはエラーを返します
- string_formatが無効な場合、期待に沿わない文字列を返します
- いずれかのパラメータがNULLの場合、NULLを返します
- フォーマット長が128文字を超える場合、エラーを返します

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

---Input is NULL, returns NULL
mysql> select from_unixtime(NULL);
+---------------------+
| from_unixtime(NULL) |
+---------------------+
| NULL                |
+---------------------+

```
