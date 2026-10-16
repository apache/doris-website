---
{
    "title": "NANOSECONDS_SUB",
    "language": "ja",
    "description": "TIMESTAMP_NS 値から指定したナノ秒数を減算します。"
}
---

## 説明

`TIMESTAMP_NS` 値から指定したナノ秒数を減算し、ナノ秒精度を維持します。

## 構文

```sql
NANOSECONDS_SUB(<timestamp_ns>, <delta>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<timestamp_ns>` | 基準となる `TIMESTAMP_NS` 型の値。 |
| `<delta>` | 減算するナノ秒数。型は `BIGINT` です。負の値を指定すると、ナノ秒数が加算されます。 |

## 戻り値

`TIMESTAMP_NS` 型の値を返します。いずれかの引数が `NULL` の場合は `NULL` を返します。計算結果が `TIMESTAMP_NS` 型の範囲外となる場合はエラーを報告します。

## 例

```sql
SELECT NANOSECONDS_SUB(
    CAST('1970-01-01 00:00:00.000000000' AS TIMESTAMP_NS), 1
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 1969-12-31 23:59:59.999999999 |
+-------------------------------+
```

負の値を指定すると、ナノ秒数が加算されます。

```sql
SELECT NANOSECONDS_SUB(
    CAST('1969-12-31 23:59:59.999999999' AS TIMESTAMP_NS), -1
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 1970-01-01 00:00:00.000000000 |
+-------------------------------+
```

```sql
SELECT NANOSECONDS_SUB(CAST(NULL AS TIMESTAMP_NS), 1) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
