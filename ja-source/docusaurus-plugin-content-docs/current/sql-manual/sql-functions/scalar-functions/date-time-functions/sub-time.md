---
{
  "title": "SUB_TIME",
  "language": "ja",
  "description": "指定された時間間隔を日付/時刻または時刻式から減算します。2番目のパラメータが負の値の場合、"
}
---
## 説明

日付/時刻または時刻式から指定された時間間隔を減算します。2番目のパラメータが負の場合、1番目のパラメータに間隔を加算することと同等です。

## 構文

```sql
SUB_TIME(`<date_or_time_expr>`, `<time>`)
```
## パラメータ

| パラメータ             | 説明 |
| ---------------------| ----------- |
| `<date_or_time_expr>`| 有効な日付式。timestamptz/datetime/date/time型の入力をサポートします。型がdateの場合、その日の開始時刻（00:00:00）に変換されます。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[time conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/time-conversion)を参照してください。 |
| `<time>`             | 有効な時間式で、`<date_or_time_expr>`から減算する時間値を表します。負の値の場合は加算を意味します。time型の入力をサポートします。 |

## 戻り値

`<date_or_time_expr>`から`<time>`を減算した結果を返します。戻り値の型は最初のパラメータの型によって決まります：
- 最初のパラメータがtimestamp型の場合、timestamp型を返します。
- 最初のパラメータがdatetime型の場合、datetime型を返します。
- 最初のパラメータがtime型の場合、time型を返します。

特殊なケース：
- 入力パラメータがnullの場合、nullを返します。
- 最初のパラメータがtime型で結果がtime型の範囲を超える場合、最大（または最小）時間値を返します。
- 最初のパラメータがdatetimeまたはtimestamptz型で結果がdatetime型の範囲を超える場合、エラーがスローされます。

## 例

```sql
-- Subtract time when the first parameter is datetime type
SELECT SUB_TIME('2025-09-19 12:00:00', '01:30:00'); 
+---------------------------------------------+
| SUB_TIME('2025-09-19 12:00:00', '01:30:00') |
+---------------------------------------------+
| 2025-09-19 10:30:00                         |
+---------------------------------------------+

-- Subtract time when the first parameter is time type
SELECT SUB_TIME(cast('12:15:20' as time), '00:10:40'); 
+------------------------------------------------+
| SUB_TIME(cast('12:15:20' as time), '00:10:40') |
+------------------------------------------------+
| 12:04:40                                       |
+------------------------------------------------+   

-- SET time_zone = '+08:00'
select sub_time('2025-10-10 11:22:33+03:00', '3:22:33.123');
+------------------------------------------------------+
| sub_time('2025-10-10 11:22:33+03:00', '3:22:33.123') |
+------------------------------------------------------+
| 2025-10-10 12:59:59.877+08:00                        |
+------------------------------------------------------+
         
-- NULL parameter test
SELECT SUB_TIME(NULL, '01:00:00');
+----------------------------+
| SUB_TIME(NULL, '01:00:00') |
+----------------------------+
| NULL                       |
+----------------------------+    

SELECT SUB_TIME('2025-09-19 12:00:00', NULL); 
+---------------------------------------+
| SUB_TIME('2025-09-19 12:00:00', NULL) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

SELECT SUB_TIME(NULL, NULL);
+----------------------+
| SUB_TIME(NULL, NULL) |
+----------------------+
| NULL                 |
+----------------------+                        

-- Time type out-of-range test (returns max/min value)
SELECT SUB_TIME(cast('835:30:00' as time), '-21:00:00');
+--------------------------------------------------+
| SUB_TIME(cast('835:30:00' as time), '-21:00:00') |
+--------------------------------------------------+
| 838:59:59                                        |
+--------------------------------------------------+

SELECT SUB_TIME(cast('-832:30:00' as time), '31:00:00');   
+---------------------------------------------------+
| SUB_TIME(cast('-832:30:00' as time), '31:00:00') |
+---------------------------------------------------+
| -838:59:59                                        |
+---------------------------------------------------+       

-- Datetime type out-of-range test (throws error)
SELECT SUB_TIME('0000-01-01 00:00:00', '00:00:01');  
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function sub_time

SELECT SUB_TIME('9999-12-31 23:59:59', '-00:00:01');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function sub_time
```
