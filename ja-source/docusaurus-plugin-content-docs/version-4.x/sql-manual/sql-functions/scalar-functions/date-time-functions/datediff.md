---
{
  "title": "DATEDIFF",
  "description": "DATEDIFF関数は、2つの日付またはdatetimeの値の差を計算するために使用され、結果は日単位で精密に表されます。つまり、",
  "language": "ja"
}
---
## 説明

DATEDIFF関数は、2つの日付またはdatetime値の差を計算するために使用され、結果は日単位で正確に返されます。つまり、`expr1`から`expr2`を減算して得られる日数を返します。この関数は日付部分のみに焦点を当て、時間部分の具体的な時、分、秒は無視します。

この関数は、MySQLの[datediff function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_datediff)と一致しています。

## 構文

```sql
DATEDIFF(<expr1>, <expr2>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr1>` | 被減数の日付で、datetimeまたはdate型をサポートします。具体的なdatetimeおよびdate形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<expr2>` | 減数の日付で、dateおよびdatetime型をサポートします |

## Return Value

expr1 - expr2の値を返します。結果は日単位で精密で、型はINTです。

特殊なケース:
- expr1がexpr2より大きい場合は正の数を返し、そうでない場合は負の数を返します
- いずれかのパラメータがNULLの場合、NULLを返します
- 時間部分は無視されます

## Examples

```sql
-- The two dates differ by 1 day (ignoring the time part)
select datediff(CAST('2007-12-31 23:59:59' AS DATETIME), CAST('2007-12-30' AS DATETIME));
+-----------------------------------------------------------------------------------+
| datediff(CAST('2007-12-31 23:59:59' AS DATETIME), CAST('2007-12-30' AS DATETIME)) |
+-----------------------------------------------------------------------------------+
|                                                                                 1 |
+-----------------------------------------------------------------------------------+

-- The first date is earlier than the second date, returning a negative number
select datediff(CAST('2010-11-30 23:59:59' AS DATETIME), CAST('2010-12-31' AS DATETIME));
+-----------------------------------------------------------------------------------+
| datediff(CAST('2010-11-30 23:59:59' AS DATETIME), CAST('2010-12-31' AS DATETIME)) |
+-----------------------------------------------------------------------------------+
|                                                                               -31 |
+-----------------------------------------------------------------------------------+

-- Any parameter is NULL
mysql> select datediff('2023-01-01', NULL);
+------------------------------+
| datediff('2023-01-01', NULL) |
+------------------------------+
|                         NULL |
+------------------------------+

-- If input datetime type, will ignore time part
select datediff('2023-01-02 13:00:00', '2023-01-01 12:00:00');
+--------------------------------------------------------+
| datediff('2023-01-02 13:00:00', '2023-01-01 12:00:00') |
+--------------------------------------------------------+
|                                                      1 |
+--------------------------------------------------------+

select datediff('2023-01-02 12:00:00', '2023-01-01 13:00:00');
+--------------------------------------------------------+
| datediff('2023-01-02 12:00:00', '2023-01-01 13:00:00') |
+--------------------------------------------------------+
|                                                      1 |
+--------------------------------------------------------+
1 row in set (0.01 sec)
```
