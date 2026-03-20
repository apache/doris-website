---
{
  "title": "ADD_TIME",
  "language": "ja",
  "description": "指定された時間間隔をdate/timeまたはtime式に加算します。第2パラメータが負の値の場合、"
}
---
## 説明

指定された時間間隔を日付/時刻または時刻表現に追加します。第2パラメータが負の値の場合、第1パラメータから間隔を減算することと同等です。

## 構文

```sql
ADD_TIME(`<date_or_time_expr>`, `<time>`)
```
## パラメータ

| パラメータ             | 説明 |
| ---------------------| ----------- |
| `<date_or_time_expr>`| 有効な日付式。timestamptz/datetime/date/time型の入力をサポートします。型がdateの場合、その日の開始時刻（00:00:00）に変換されます。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、および[time conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/time-conversion)を参照してください。 |
| `<time>`             | 有効な時刻式で、`<date_or_time_expr>`に追加する時刻値を表します。負の値の場合は減算を意味します。time型の入力をサポートします。 |

## 戻り値

`<date_or_time_expr>`に`<time>`を追加した結果を返します。戻り値の型は最初のパラメータの型に依存します：
- 最初のパラメータがtimestamptz型の場合、timestamptz型を返します。
- 最初のパラメータがdatetime型の場合、datetime型を返します。
- 最初のパラメータがtime型の場合、time型を返します。

特殊ケース：
- 入力パラメータのいずれかがnullの場合、nullを返します。
- 最初のパラメータがtime型で結果がtime型の範囲を超える場合、最大値（または最小値）の時刻値を返します。
- 最初のパラメータがdatetimeまたはtimestamptz型で結果がdatetime型の範囲を超える場合、エラーが発生します。

## 例

```sql
-- Add time when the first parameter is datetime type
SELECT ADD_TIME('2025-09-19 12:00:00', '01:30:00'); 
+---------------------------------------------+
| ADD_TIME('2025-09-19 12:00:00', '01:30:00') |
+---------------------------------------------+
| 2025-09-19 13:30:00                         |
+---------------------------------------------+

-- Add time when the first parameter is time type
SELECT ADD_TIME(cast('12:15:20' as time), '00:10:40'); 
+------------------------------------------------+
| ADD_TIME(cast('12:15:20' as time), '00:10:40') |
+------------------------------------------------+
| 12:26:00                                       |
+------------------------------------------------+   

-- SET time_zone = '+08:00';
SELECT ADD_TIME('2025-10-10 11:22:33.1234567+03:00', '01:02:03');
+-----------------------------------------------------------+
| ADD_TIME('2025-10-10 11:22:33.1234567+03:00', '01:02:03') |
+-----------------------------------------------------------+
| 2025-10-10 17:24:36.123457+08:00                          |
+-----------------------------------------------------------+
         
-- NULL parameter test
SELECT ADD_TIME(NULL, '01:00:00');
+----------------------------+
| ADD_TIME(NULL, '01:00:00') |
+----------------------------+
| NULL                       |
+----------------------------+    

SELECT ADD_TIME('2025-09-19 12:00:00', NULL); 
+---------------------------------------+
| ADD_TIME('2025-09-19 12:00:00', NULL) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

SELECT ADD_TIME(NULL, NULL);
+----------------------+
| ADD_TIME(NULL, NULL) |
+----------------------+
| NULL                 |
+----------------------+                        

-- Time type out-of-range test (returns max/min value)
SELECT ADD_TIME(cast('835:30:00' as time), '21:00:00'); 
+-------------------------------------------------+
| ADD_TIME(cast('835:30:00' as time), '21:00:00') |
+-------------------------------------------------+
| 838:59:59                                       |
+-------------------------------------------------+

SELECT ADD_TIME(cast('-832:30:00' as time), '-31:00:00');   
+---------------------------------------------------+
| ADD_TIME(cast('-832:30:00' as time), '-31:00:00') |
+---------------------------------------------------+
| -838:59:59                                        |
+---------------------------------------------------+       

-- Datetime type out-of-range test (throws error)
SELECT ADD_TIME('9999-12-31 23:59:59', '00:00:01');  
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function add_time

SELECT ADD_TIME('0000-01-01 00:00:00', '-00:00:01');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function add_time
```
