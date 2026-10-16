---
{
    "title": "NOW",
    "language": "ja",
    "description": "NOW 関数は現在のシステム日時を取得し、DATETIME 型の値を返します。"
}
---

## 説明

`NOW` 関数は現在のシステム日時を取得し、`DATETIME` 型の値を返します。省略可能なパラメーターで小数秒の精度を指定でき、返される値のマイクロ秒部分の桁数を調整できます。

この関数の動作は、MySQL の [now 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_now) と一致します。

# 別名
- current_timestamp()

## 構文

```sql
NOW([`<precision>`])
```

## パラメーター

| パラメーター | 説明 |
| --------- | ----------- |
| `<precision>` | 省略可能。戻り値の小数秒部分の精度を 0 から 6 の範囲で指定します。デフォルトは 0 で、小数秒は返されません。`<br/>`JDK の実装上の制限により、JDK8 で FE をビルドした場合、精度はミリ秒（小数点以下三桁）までしかサポートされず、それより下の桁はゼロで埋められます。より高い精度が必要な場合は JDK11 を使用してください。 |

## 戻り値

現在のシステム日時を `DATETIME` 型で返します。
- 指定した `<precision>` が範囲外（負の値または 6 より大きい値など）の場合、エラーを返します。

## 例

```sql
---Get current time
select NOW(),NOW(3),NOW(6);
+---------------------+-------------------------+----------------------------+
| now()               | now(3)                  | now(6)                     |
+---------------------+-------------------------+----------------------------+
| 2025-01-23 11:08:35 | 2025-01-23 11:08:35.561 | 2025-01-23 11:08:35.562000 |
+---------------------+-------------------------+----------------------------+

--- Invalid precision (out of range, error)
SELECT NOW(7) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Invalid precision for NOW function. Precision must be between 0 and 6.

select NOW(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: -1
```
