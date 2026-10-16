---
{
    "title": "NANOSECONDS_ADD",
    "language": "ja",
    "description": "TIMESTAMP_NS 値に指定したナノ秒数を加算します。"
}
---

## 説明

ナノ秒の精度を維持しながら、`TIMESTAMP_NS` 値に指定したナノ秒数を加算します。

## 構文

```sql
NANOSECONDS_ADD(<timestamp_ns>, <delta>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<timestamp_ns>` | 基準となる値。型は `TIMESTAMP_NS` です。 |
| `<delta>` | 加算するナノ秒数。型は `BIGINT` です。負の値を指定するとナノ秒を減算します。 |

## 戻り値

`TIMESTAMP_NS` 型の値を返します。いずれかの引数が `NULL` の場合は `NULL` を返します。結果が `TIMESTAMP_NS` の範囲外になる場合はエラーが発生します。

## 例

```sql
SELECT NANOSECONDS_ADD(
    CAST('1969-12-31 23:59:59.999999999' AS TIMESTAMP_NS), 1
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 1970-01-01 00:00:00.000000000 |
+-------------------------------+
```

負の値を指定すると、ナノ秒を減算します。

```sql
SELECT NANOSECONDS_ADD(
    CAST('1970-01-01 00:00:00.000000001' AS TIMESTAMP_NS), -2
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 1969-12-31 23:59:59.999999999 |
+-------------------------------+
```

```sql
SELECT NANOSECONDS_ADD(CAST(NULL AS TIMESTAMP_NS), 1) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
