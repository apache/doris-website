---
{
    "title": "UTC_TIME",
    "language": "ja",
    "description": "UTCTIME 関数は、UTC タイムゾーンの現在時刻を返します。"
}
---

## 説明
UTC_TIME 関数は、UTC タイムゾーンの現在時刻を返します。ローカルのタイムゾーンの影響を受けず、常に UTC タイムゾーンに基づく現在時刻を返すため、異なるタイムゾーンでも時刻の一貫性を保てます。

この関数の動作は、MySQL の [utc_time 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-time)と同じです。

## 構文

```sql
UTC_TIME([<`precision`>])
```

## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<precision>` | 省略可能。返される時刻の精度です。0 から 6 までの整数型の定数のみ指定できます。 |

## 戻り値
現在の UTC 時刻を返します。

Time 型の値（形式: HH:mm:ss）を返します。戻り値を数値演算に使用すると、[整数形式](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-time)（00:00:00 からの経過時間をマイクロ秒単位で表した値）に変換されます。

入力が NULL の場合、または精度が範囲外の場合はエラーが発生します。

## 例

```sql
-- Assume the current local time is UTC+8 2025-10-27 14:39:01
SELECT UTC_TIME(), UTC_TIME() + 1, UTC_TIME(6), UTC_TIME(6) + 1;
```
```text
+------------+----------------+-----------------+-----------------+
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
