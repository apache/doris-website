---
{
    "title": "SUB_TIME",
    "language": "ja",
    "description": "日付/時刻または時刻の式から指定した時間間隔を減算します。二番目のパラメータが負の場合、"
}
---

## 説明

日付/時刻または時刻の式から、指定した時間間隔を減算します。二番目のパラメータが負の場合は、一番目のパラメータにその時間間隔を加算することと同じです。

## 構文

```sql
SUB_TIME(`<date_or_time_expr>`, `<time>`)
```

## パラメータ

| パラメータ             | 説明 |
| ---------------------| ----------- |
| `<date_or_time_expr>`| 有効な日付式です。timestamptz/datetime/date/time 型の入力に対応します。date 型の場合は、その日の開始時刻（00:00:00）に変換されます。具体的な形式については、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[time の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)を参照してください。 |
| `<time>`             | `<date_or_time_expr>` から減算する時間の値を表す、有効な時刻式です。負の場合は加算を意味します。time 型の入力に対応します。 |

## 戻り値

`<time>` を `<date_or_time_expr>` から減算した結果を返します。戻り値の型は、一番目のパラメータの型によって異なります。
- 一番目のパラメータが timestamp 型の場合は、timestamp 型を返します。
- 一番目のパラメータが datetime 型の場合は、datetime 型を返します。
- 一番目のパラメータが time 型の場合は、time 型を返します。

特殊なケース：
- いずれかの入力パラメータが NULL の場合は、NULL を返します。
- 一番目のパラメータが time 型で、結果が time 型の範囲を超える場合は、time 型の最大値（または最小値）を返します。
- 一番目のパラメータが datetime 型または timestamptz 型で、結果が datetime 型の範囲を超える場合は、エラーが発生します。

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
