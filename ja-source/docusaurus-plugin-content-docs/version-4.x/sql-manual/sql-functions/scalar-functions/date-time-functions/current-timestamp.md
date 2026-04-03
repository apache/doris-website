---
{
  "title": "CURRENT_TIMESTAMP",
  "description": "この関数は現在のシステム時刻を取得するために使用され、datetime型（DATETIME）を返します。",
  "language": "ja"
}
---
## 説明
この関数は現在のシステム時刻を取得するために使用され、datetime型（`DATETIME`）を返します。オプションで精度を指定して、戻り値の秒の小数部分の桁数を調整できます。

この関数はMySQLの[current_timestamp function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_current-timestamp)と一致しています。

## エイリアス

- NOW()

## 構文

```sql
CURRENT_TIMESTAMP([<precision>])
```
## パラメータ

| Parameter     | デスクリプション                                                                                                                                  |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `<precision>` | 戻り値の小数秒部分の精度を示すオプションパラメータで、0から6の範囲で指定します。デフォルトは0で、小数秒部分が返されないことを意味します。 |

## Return Value
- 現在のシステム時刻を`DATETIME`型として返します
- 指定された`<precision>`が範囲外（負の値や6より大きい値など）の場合、関数はエラーを返します。

## Examples

```sql
-- Return different scale
select CURRENT_TIMESTAMP(),CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(6);

+---------------------+-------------------------+----------------------------+
| now()               | now(3)                  | now(6)                     |
+---------------------+-------------------------+----------------------------+
| 2025-01-23 11:26:01 | 2025-01-23 11:26:01.771 | 2025-01-23 11:26:01.771000 |
+---------------------+-------------------------+----------------------------+

---Return NULL if input NULL
select CURRENT_TIMESTAMP(NULL);
+-------------------------+
| CURRENT_TIMESTAMP(NULL) |
+-------------------------+
| NULL                    |
+-------------------------+

--input out of precision range, return error
select CURRENT_TIMESTAMP(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: -1

select CURRENT_TIMESTAMP(7);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: 7
```
