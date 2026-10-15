---
{
    "title": "NOW",
    "language": "ja",
    "description": "NOW 関数は、0 から 9 までの精度を任意に指定して、現在のシステム日時を返します。"
}
---

## 説明

`NOW` 関数は、現在のシステム日時を返します。省略可能な引数で、秒の小数部の精度を 0 から 9 までの範囲で指定できます。

この関数は、MySQL の [now 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_now) と同じ動作をします。

# 別名
- current_timestamp()

## 構文

```sql
NOW([`<precision>`])
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<precision>` | 省略可能な整数定数。指定できる範囲は `[0, 9]` で、デフォルトは 0 です。0 から 6 までの値を指定すると、対応する精度の `DATETIME(p)` が返されます。7 から 9 までの値を指定すると、`TIMESTAMP_NS` が返されます。実際の時計の分解能はオペレーティングシステムと JDK に依存するため、取得できない下位の桁はゼロになります。 |

## 戻り値

現在のシステム時刻を返します。`<precision>` が 0 から 6 までの場合、戻り値の型は `DATETIME(<precision>)` です。`<precision>` が 7 から 9 までの場合、戻り値の型は `TIMESTAMP_NS` で、小数部は九桁で表示されます。値はひとつのステートメント内で一定です。

- `<precision>` が負の値または 9 より大きい値の場合、エラーになります。

## 使用例

```sql
---Get current time
select NOW(), NOW(3), NOW(6), NOW(9);
+---------------------+-------------------------+----------------------------+-------------------------------+
| now()               | now(3)                  | now(6)                     | now(9)                        |
+---------------------+-------------------------+----------------------------+-------------------------------+
| 2025-01-23 11:08:35 | 2025-01-23 11:08:35.561 | 2025-01-23 11:08:35.561000 | 2025-01-23 11:08:35.561000000 |
+---------------------+-------------------------+----------------------------+-------------------------------+

--- Invalid precision (out of range, error)
SELECT NOW(10) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Precision of NOW must be between 0 and 9. Precision was set to: 10

select NOW(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Precision of NOW must be between 0 and 9. Precision was set to: -1
```
