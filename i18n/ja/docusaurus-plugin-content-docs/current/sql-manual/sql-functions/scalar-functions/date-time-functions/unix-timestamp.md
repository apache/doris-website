---
{
    "title": "UNIX_TIMESTAMP",
    "language": "ja",
    "description": "DATE、DATETIME、TIMESTAMP_NS 型の値を Unix タイムスタンプに変換します。TIMESTAMP_NS 型の入力では小数部の九桁を保持します。"
}
---

## 説明

`DATE`、`DATETIME`、`TIMESTAMP_NS` 型の値を Unix タイムスタンプに変換します。

引数を指定しない場合は、現在時刻をタイムスタンプに変換します。

日時引数を指定する場合、その型は `DATE`、`DATETIME`、`TIMESTAMP_NS` のいずれかである必要があります。

書式の指定方法については、date_format 関数の書式に関する説明を参照してください。

この関数はタイムゾーンの影響を受けます。詳細は[タイムゾーン管理](../../../../admin-manual/cluster-management/time-zone)を参照してください。

この関数は MySQL の [unix_timestamp 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_unix-timestamp)と同じ動作をします。

## 構文

```sql
UNIX_TIMESTAMP()
UNIX_TIMESTAMP(`<date_or_date_expr>`)
UNIX_TIMESTAMP(`<date_or_date_expr>`, `<fmt>`)
```

## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_date_expr>` | 入力する日時値。`DATE`、`DATETIME`、`TIMESTAMP_NS` 型に対応します。引数なしの形式では省略します。 |
| `<fmt>` | 日付パラメータのうち、タイムスタンプに変換する部分を指定する文字列です。省略可能です。指定した場合、書式に一致する部分だけをタイムスタンプに変換します。 |

## 戻り値

戻り値の型は入力によって異なります。

1. `TIMESTAMP_NS` 型の入力は、小数部が九桁の `DECIMAL` 型のタイムスタンプを返します。
2. 小数秒の桁数がゼロではない `DATETIME` 型の入力、または `<fmt>` を指定した呼び出しは、小数部が最大六桁の `DECIMAL` 型のタイムスタンプを返します。
3. `DATE` 型、または小数秒の桁数が 0 の `DATETIME` 型の入力で `<fmt>` を指定しない場合、`INT` 型のタイムスタンプを返します。

入力した時刻を対応するタイムスタンプに変換します。基準時刻は 1970-01-01 00:00:00 です。

- いずれかのパラメータが NULL の場合、NULL を返します。
- 書式が無効な場合、エラーを返します。

## 例

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
