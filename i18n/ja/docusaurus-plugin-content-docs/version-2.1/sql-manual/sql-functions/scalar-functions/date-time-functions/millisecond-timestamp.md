---
{
  "title": "MILLISECOND_TIMESTAMP",
  "language": "ja",
  "description": "MILLISECONDTIMESTAMP関数は、DATETIME値を1970-01-01 00:00:00 UTCから始まるUnixタイムスタンプ（ミリ秒単位）に変換します。"
}
---
## 説明

`MILLISECOND_TIMESTAMP`関数は、`DATETIME`値を`1970-01-01 00:00:00 UTC`から開始するUnixタイムスタンプ（ミリ秒単位）に変換します。


## 構文

```sql
MILLISECOND_TIMESTAMP(<datetime>)
```
## パラメータ

| パラメータ | 説明 |
|------------|------|
| `<datetime>` | 必須。Unixタイムスタンプ（ミリ秒）に変換される DATETIME 値。 |

## 戻り値

- 入力されたdatetime値に対応するUnixタイムスタンプ（ミリ秒）を表す整数を返します。
- `<datetime>` が NULL の場合、関数は NULL を返します。
- `<datetime>` が有効な範囲外の場合、関数はエラーまたは予期しない値を返す可能性があります。

## 例

```sql
SELECT MILLISECOND_TIMESTAMP('2025-01-23 12:34:56');
```
```text
+---------------------------------------------------------------------+
| millisecond_timestamp(cast('2025-01-23 12:34:56' as DATETIMEV2(0))) |
+---------------------------------------------------------------------+
|                                                       1737606896000 |
+---------------------------------------------------------------------+
```
