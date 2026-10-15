---
{
    "title": "UTC_TIMESTAMP",
    "language": "ja",
    "description": "UTCTIMESTAMP 関数は、UTC タイムゾーンでの現在の日付と時刻を返します。"
}
---

## 説明
UTC_TIMESTAMP 関数は、UTC タイムゾーンでの現在の日付と時刻を返します。ローカルタイムゾーンの影響を受けず、常に UTC に基づく現在時刻を返すため、タイムゾーンが異なる環境でも時刻の一貫性を保てます。

この関数の動作は、MySQL の [utc_timestamp 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-timestamp) と同じです。

## 構文

```sql
UTC_TIMESTAMP([`<precision>`])
```

## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<precision>` | 返される日時値の精度。省略可能です。0～6 の範囲の整数型の定数のみ指定できます。 |

## 戻り値
現在の UTC の日付と時刻を返します。

戻り値の型は DATETIME です（形式：YYYY-MM-DD HH:mm:ss[.ssssss]）。戻り値を数値演算に使用すると、[整数形式](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-datetime)（形式：YYYYMMDDHHmmss）に変換されます。

引数が NULL の場合、または精度が範囲外の場合は、エラーが発生します。

## 使用例

```sql
-- Current local time is UTC+8 2025-10-27 14:43:21
SELECT UTC_TIMESTAMP(), UTC_TIMESTAMP() + 0, UTC_TIMESTAMP(5), UTC_TIMESTAMP(5) + 0;
```
```text
+---------------------+---------------------+---------------------------+----------------------+
| UTC_TIMESTAMP()     | UTC_TIMESTAMP() + 0 | UTC_TIMESTAMP(5)          | UTC_TIMESTAMP(5) + 0 |
+---------------------+---------------------+---------------------------+----------------------+
| 2025-10-27 06:43:21 |      20251027064321 | 2025-10-27 06:43:21.88177 |       20251027064321 |
+---------------------+---------------------+---------------------------+----------------------+
```

```sql
SELECT UTC_TIMESTAMP(7);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = scale must be between 0 and 6

SELECT UTC_TIMESTAMP(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = UTC_TIMESTAMP argument cannot be NULL.
```
