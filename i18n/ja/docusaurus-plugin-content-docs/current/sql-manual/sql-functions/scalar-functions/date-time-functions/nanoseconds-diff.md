---
{
    "title": "NANOSECONDS_DIFF",
    "language": "ja",
    "description": "二つの日時値の差をナノ秒単位で返します。"
}
---

## 説明

二つの日時値の差をナノ秒単位で返します。計算結果は `<end_time> - <start_time>` です。

## 構文

```sql
NANOSECONDS_DIFF(<end_time>, <start_time>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<end_time>` | 終了日時。少なくとも一方の引数は `TIMESTAMP_NS` である必要があり、もう一方には `TIMESTAMP_NS` または `DATETIME` を指定できます。 |
| `<start_time>` | 開始日時。少なくとも一方の引数は `TIMESTAMP_NS` である必要があり、もう一方には `TIMESTAMP_NS` または `DATETIME` を指定できます。 |

## 戻り値

`BIGINT` を返し、ナノ秒単位の `<end_time> - <start_time>` を表します。いずれかの引数が `NULL` の場合は `NULL` を返します。

結果が正の場合、終了日時は開始日時より後です。負の場合、終了日時は開始日時より前です。結果は `BIGINT` の範囲内に収まる必要があり、範囲を超えるとオーバーフローエラーが報告されます。

## 例

```sql
SELECT NANOSECONDS_DIFF(
    CAST('1970-01-01 00:00:00.000000001' AS TIMESTAMP_NS),
    CAST('1969-12-31 23:59:59.999999999' AS TIMESTAMP_NS)
) AS diff;
```

```text
+------+
| diff |
+------+
|    2 |
+------+
```

引数には `TIMESTAMP_NS` と `DATETIME` を組み合わせて使用できます。

```sql
SELECT NANOSECONDS_DIFF(
    CAST('1970-01-01 00:00:00.000000001' AS TIMESTAMP_NS),
    CAST('1970-01-01 00:00:00.000000' AS DATETIME(6))
) AS diff;
```

```text
+------+
| diff |
+------+
|    1 |
+------+
```

```sql
SELECT NANOSECONDS_DIFF(
    CAST(NULL AS TIMESTAMP_NS),
    CAST('1970-01-01 00:00:00.000000000' AS TIMESTAMP_NS)
) AS diff;
```

```text
+------+
| diff |
+------+
| NULL |
+------+
```
