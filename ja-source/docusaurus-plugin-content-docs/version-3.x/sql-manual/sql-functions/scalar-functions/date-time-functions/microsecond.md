---
{
  "title": "MICROSECOND",
  "description": "datetime値からマイクロ秒部分を抽出します。戻り値の範囲は0から999999です。",
  "language": "ja"
}
---
## 説明

datetime値からマイクロ秒部分を抽出します。戻り値の範囲は0から999999です。

## 構文

```sql
MICROSECOND(<date>)
```
## パラメータ

| Parameter | デスクリプション                                      |
|-----------|--------------------------------------------------|
| `<date>`      | DATETIMEV2型の入力日時値で、精度が0より大きいもの |

## Return Value

日時値のマイクロ秒部分を表すINT型を返します。範囲は0から999999です。精度が6未満の入力に対しては、不足する桁はゼロで埋められます。

## Example

```sql
SELECT MICROSECOND(CAST('1999-01-02 10:11:12.000123' AS DATETIMEV2(6))) AS microsecond;
```
```text
+-------------+
| microsecond |
+-------------+
|         123 |
+-------------+
```
