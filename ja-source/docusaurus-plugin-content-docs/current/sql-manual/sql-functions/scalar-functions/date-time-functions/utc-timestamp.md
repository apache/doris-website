---
{
  "title": "UTC_TIMESTAMP",
  "language": "ja",
  "description": "UTCTIMESTAMP関数は、UTCタイムゾーンでの現在の日付と時刻を返します。"
}
---
## 説明
UTC_TIMESTAMP関数は、UTCタイムゾーンでの現在の日付と時刻を返します。この関数はローカルタイムゾーンの影響を受けず、常にUTCタイムゾーンに基づいた現在時刻を返すため、異なるタイムゾーンシナリオ間での時刻の一貫性を確保します。

この関数は、MySQLの[utc_timestamp function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-timestamp)と一貫した動作をします。

## 構文

```sql
UTC_TIMESTAMP([`<precision>`])
```
## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<precision>` | 返される日時値の精度は、[0, 6]の範囲内の整数型をサポートします。整数型の定数のみが受け入れられます。 |

## 戻り値
現在のUTC日時を返します。

DATETIME型を返します（形式: YYYY-MM-DD HH:mm:ss[.ssssss]）。返された結果を数値演算に使用する場合、[integer format](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-datetime)（形式 YYYYMMDDHHmmss）に変換されます。

入力がNULLまたは精度が範囲外の場合、エラーがスローされます。

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
SELECT UTC_TIMESTAMP(7);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = scale must be between 0 and 6

SELECT UTC_TIMESTAMP(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = UTC_TIMESTAMP argument cannot be NULL.
```
