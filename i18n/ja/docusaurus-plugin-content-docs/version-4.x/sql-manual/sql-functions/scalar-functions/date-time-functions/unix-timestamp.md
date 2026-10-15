---
{
    "title": "UNIX_TIMESTAMP",
    "language": "ja",
    "description": "Date 型または Datetime 型の値を Unix タイムスタンプに変換します。"
}
---

## 説明

Date 型または Datetime 型の値を Unix タイムスタンプに変換します。

引数を指定しない場合は、現在時刻をタイムスタンプに変換します。

引数は Date 型または Datetime 型である必要があります。

書式の指定については、date_format 関数の書式に関する説明を参照してください。

この関数はタイムゾーンの影響を受けます。詳しくは [タイムゾーンの管理](../../../../admin-manual/cluster-management/time-zone) を参照してください。

この関数の動作は、MySQL の [unix_timestamp 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_unix-timestamp) と一致します。

## 構文

```sql
UNIX_TIMESTAMP()
UNIX_TIMESTAMP(`<date_or_date_expr>`)
UNIX_TIMESTAMP(`<date_or_date_expr>`, `<fmt>`)
```

## パラメーター

| パラメーター | 説明 |
|-----------|-------------|
| `<date_or_date_expr>` | 入力する日時の値。date/datetime 型をサポートします。日時と日付の書式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) と [日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください。 |
| `<fmt>` | 日付引数のうち、タイムスタンプに変換する部分を指定する文字列です。この引数を指定すると、書式に一致する部分のみがタイムスタンプに変換されます。 |

## 戻り値
入力に応じて、次の二種類の値を返します。

1. 入力した date_or_date_expr が小数秒の桁数がゼロ以外の datetime 型である場合、または書式引数を指定した場合：
   小数点以下最大六桁の精度を持つ Decimal 型のタイムスタンプを返します。

2. 入力した date_or_date_expr の小数秒の桁数が 0 で、書式引数を指定していない場合：
   INT 型のタイムスタンプを返します。

入力した時刻を対応するタイムスタンプに変換します。エポック時刻は 1970-01-01 00:00:00 です。

- いずれかの引数が NULL の場合は、NULL を返します。
- 書式が無効な場合は、エラーを返します。

## 使用例

```sql
-- Input datetime is the begin datetime
mysql> select unix_timestamp('1970-01-01 00:00:00');
+---------------------------------------+
| unix_timestamp('1970-01-01 00:00:00') |
+---------------------------------------+
|                                     0 |
+---------------------------------------+

-- Display timestamp of current time
mysql> select unix_timestamp();
+------------------+
| unix_timestamp() |
+------------------+
|       1753933330 |
+------------------+

-- Input a datetime to display its timestamp
mysql> select unix_timestamp('2007-11-30 10:30:19');
+---------------------------------------+
| unix_timestamp('2007-11-30 10:30:19') |
+---------------------------------------+
|                            1196389819 |
+---------------------------------------+


-- Match format to display timestamp for given datetime
mysql> select unix_timestamp('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s');
+------------------------------------------------------------+
| unix_timestamp('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s') |
+------------------------------------------------------------+
|                                          1196389819.000000 |
+------------------------------------------------------------+

-- Input with non-zero scale
mysql> SELECT UNIX_TIMESTAMP('2015-11-13 10:20:19.123');
+-------------------------------------------+
| UNIX_TIMESTAMP('2015-11-13 10:20:19.123') |
+-------------------------------------------+
|                            1447381219.123 |
+-------------------------------------------+

-- For datetime before 1970-01-01, returns 0
select unix_timestamp('1007-11-30 10:30:19');
+---------------------------------------+
| unix_timestamp('1007-11-30 10:30:19') |
+---------------------------------------+
|                                     0 |
+---------------------------------------+

-- Returns NULL if any parameter is null
mysql> select unix_timestamp(NULL);
+----------------------+
| unix_timestamp(NULL) |
+----------------------+
|                 NULL |
+----------------------+

-- Returns an error if format is invalid
mysql> select unix_timestamp('2007-11-30 10:30-19', 's');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation unix_timestamp of 2007-11-30 10:30-19, s is invalid
```
