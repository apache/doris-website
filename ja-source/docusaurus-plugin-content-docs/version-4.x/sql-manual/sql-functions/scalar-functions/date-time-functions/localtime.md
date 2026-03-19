---
{
  "title": "LOCALTIME、LOCALTIMESTAMP",
  "description": "この関数は現在のシステム時刻を取得するために使用され、戻り値はDATETIME型です。",
  "language": "ja"
}
---
## 説明
この関数は現在のシステム時刻を取得するために使用され、戻り値は`DATETIME`型です。オプションで精度を指定して、戻り値の秒の小数部分の桁数を調整できます。

この関数はMySQLの[localtime function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_localtime)と同じ動作をします。

## エイリアス

- NOW()

## 構文

```sql
LOCALTIME([`<precision>`])
LOCALTIMESTAMP([`<precision>`])
```
## パラメータ

| Parameter       | デスクリプション                                                                                                                        |
|------------------|------------------------------------------------------------------------------------------------------------------------------------|
| `<precision>`    | 戻り値の小数秒部分の精度を指定するオプションのパラメータです。範囲は0から6です。デフォルトは0で、小数秒は返されないことを意味します。 |

## Return Value
- `DATETIME`型で現在のシステム時刻を返します。
- 指定された`<precision>`が範囲外（例：負の値または6より大きい値）の場合、関数はエラーを返します。

## Examples

```sql

-- With JDK 17, supports up to six decimal places of precision
mysql> select LOCALTIME(), LOCALTIME(3), LOCALTIME(6);

+---------------------+-------------------------+----------------------------+
| LOCALTIME()         | LOCALTIME(3)           | LOCALTIME(6)               |
+---------------------+-------------------------+----------------------------+
| 2025-08-11 11:04:49 | 2025-08-11 11:04:49.535 | 2025-08-11 11:04:49.535992 |
+---------------------+-------------------------+----------------------------+

-- Input parameter is NULL, returns NULL
mysql> select LOCALTIME(NULL);
+-----------------+
| LOCALTIME(NULL) |
+-----------------+
| NULL            |
+-----------------+

-- Precision out of range, returns an error
mysql> select LOCALTIME(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: -1
mysql> select LOCALTIME(7);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to:
