---
{
    "title": "UTC_TIMESTAMP",
    "language": "ja",
    "description": "UTCTIMESTAMP 関数は、UTC タイムゾーンでの現在の日付と時刻を返します。"
}
---

## 説明
UTC_TIMESTAMP 関数は、UTC タイムゾーンでの現在の日付と時刻を返します。この関数はローカルのタイムゾーンの影響を受けず、常に UTC を基準とした現在時刻を返すため、タイムゾーンが異なる環境でも一貫した時刻を取得できます。

この関数の動作は、MySQL の [utc_timestamp 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-timestamp)と一致します。

## 構文

```sql
UTC_TIMESTAMP([`<precision>`])
```

## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<precision>` | 省略可能。`[0, 9]` の範囲の整数定数です。デフォルトは 0 です。 |

## 戻り値
現在の UTC の日付と時刻を返します。

精度が 0 から 6 の場合は `DATETIME(<precision>)` を返します。精度が 7 から 9 の場合は `TIMESTAMP_NS` を返し、小数部を九桁で表示します。戻り値を数値演算に使用すると、[整数形式](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-datetime)（形式は YYYYMMDDHHmmss）に変換されます。同一のステートメント内では値は一定です。

入力が NULL の場合、または精度が範囲外の場合は、エラーが発生します。

## 例

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
SELECT UTC_TIMESTAMP(10);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = Precision of UTC_TIMESTAMP must be between 0 and 9. Precision was set to: 10

SELECT UTC_TIMESTAMP(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = UTC_TIMESTAMP argument cannot be NULL.
```
