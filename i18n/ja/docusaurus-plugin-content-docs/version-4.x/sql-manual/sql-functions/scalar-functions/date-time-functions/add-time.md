---
{
    "title": "ADD_TIME",
    "language": "ja",
    "description": "指定した時間間隔を日付時刻または時刻の式に加算します。第二引数が負の場合、"
}
---

## 説明

指定した時間間隔を日付時刻または時刻の式に加算します。第二引数が負の場合は、第一引数からその時間間隔を減算するのと同じ結果になります。

## 構文

```sql
ADD_TIME(`<date_or_time_expr>`, `<time>`)
```

## 引数

| 引数                  | 説明 |
| ---------------------| ----------- |
| `<date_or_time_expr>`| 有効な日付の式。timestamptz/datetime/date/time 型の入力をサポートします。date 型の場合は、その日の開始時刻 (00:00:00) に変換されます。具体的な形式については、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[time の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion) を参照してください。 |
| `<time>`             | `<date_or_time_expr>` に加算する時間値を表す有効な時刻の式。負の値の場合は減算します。time 型の入力をサポートします。 |

## 戻り値

`<time>` を `<date_or_time_expr>` に加算した結果を返します。戻り値の型は第一引数の型によって異なります。
- 第一引数が timestamptz 型の場合、timestamptz 型を返します。
- 第一引数が datetime 型の場合、datetime 型を返します。
- 第一引数が time 型の場合、time 型を返します。

特殊なケース:
- いずれかの引数が null の場合、null を返します。
- 第一引数が time 型で、結果が time 型の範囲を超える場合、time 型の最大値（または最小値）を返します。
- 第一引数が datetime 型または timestamptz 型で、結果が datetime 型の範囲を超える場合、エラーが発生します。

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
