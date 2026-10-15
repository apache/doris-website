---
{
    "title": "NANOSECOND",
    "language": "ja",
    "description": "DATE、DATETIME、TIMESTAMP_NS 型の値からナノ秒部分を抽出します。DATETIME の小数秒部分は末尾にゼロを補って九桁にします。"
}
---

## 説明

`DATE`、`DATETIME`、`TIMESTAMP_NS` 型の値からナノ秒部分を抽出します。`DATE` 型の場合、結果は常に 0 です。`DATETIME(p)` 型の場合、小数秒部分の末尾にゼロを補って九桁にします。`TIMESTAMP_NS` 型の場合、小数秒部分の九桁すべてを返します。

## 構文

```sql
NANOSECOND(<date>)
NANOSECOND(<datetime>)
NANOSECOND(<timestamp_ns>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<date>` | `DATE` 型の値。 |
| `<datetime>` | `DATETIME(p)` 型の値。`p` は 0 から 6 までです。 |
| `<timestamp_ns>` | `TIMESTAMP_NS` 型の値。 |

## 戻り値

`INT` 型の値を `[0, 999999999]` の範囲で返します。`DATE` 型の入力では 0 を返します。`DATETIME(p)` 型の入力では、小数秒部分をナノ秒単位で表し、末尾にゼロを補って九桁にした値を返します。`TIMESTAMP_NS` 型の入力では、小数秒部分の九桁すべてを返します。入力が `NULL` の場合は `NULL` を返します。

## 例

```sql
SELECT NANOSECOND(CAST('2024-02-29' AS DATE)) AS ns;
```

```text
+----+
| ns |
+----+
|  0 |
+----+
```

```sql
SELECT NANOSECOND(CAST('2024-02-29 12:34:56.123456' AS DATETIME(6))) AS ns;
```

```text
+-----------+
| ns        |
+-----------+
| 123456000 |
+-----------+
```

```sql
SELECT NANOSECOND(CAST('2024-02-29 12:34:56.123456789' AS TIMESTAMP_NS)) AS ns;
```

```text
+-----------+
| ns        |
+-----------+
| 123456789 |
+-----------+
```

```sql
SELECT NANOSECOND(CAST(NULL AS TIMESTAMP_NS)) AS ns;
```

```text
+------+
| ns   |
+------+
| NULL |
+------+
```
