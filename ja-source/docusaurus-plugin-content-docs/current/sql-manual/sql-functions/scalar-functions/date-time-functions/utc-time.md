---
{
  "title": "UTC_TIME",
  "language": "ja",
  "description": "UTCTIME関数は、UTCタイムゾーンでの現在時刻を返します。"
}
---
## 説明
UTC_TIME関数はUTCタイムゾーンでの現在時刻を返します。この関数はローカルタイムゾーンの影響を受けず、常にUTCタイムゾーンに基づいた現在時刻を返すため、異なるタイムゾーンシナリオ間での時刻の一貫性を保証します。

この関数はMySQLの[utc_time function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-time)と一貫した動作をします。

## 構文

```sql
UTC_TIME([<`precision`>])
```
## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<precision>` | 返される時刻値の精度は[0, 6]の範囲内の整数型をサポートします。整数型定数のみが受け入れられます。 |

## 戻り値
現在のUTC時刻を返します。

Time型を返します（形式：HH:mm:ss）。返された結果を数値演算に使用する場合、[integer format](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from--time)に変換されます（00:00:00からの経過時刻値、単位はマイクロ秒）。

入力がNULLまたは精度が範囲外の場合、エラーがスローされます。

## 例

```sql
-- Assume the current local time is UTC+8 2025-10-27 14:39:01
SELECT UTC_TIME(), UTC_TIME() + 1, UTC_TIME(6), UTC_TIME(6) + 1;
```
```text
------------+----------------+-----------------+-----------------+
| UTC_TIME() | UTC_TIME() + 1 | UTC_TIME(6)     | UTC_TIME(6) + 1 |
+------------+----------------+-----------------+-----------------+
| 06:39:01   |    23941000001 | 06:39:01.934119 |     23941934120 |
+------------+----------------+-----------------+-----------------+
```
```sql
SELECT UTC_TIME(7);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = scale must be between 0 and 6

SELECT UTC_TIME(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = UTC_TIME argument cannot be NULL.
```
