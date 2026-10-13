---
{
    "title": "PERCENTILE_APPROX_ARRAY",
    "language": "ja",
    "description": "PERCENTILE_APPROX_ARRAY は共有の T-Digest 状態を使い、一回の集約で複数の近似パーセンタイルを計算します。"
}
---

## 説明

`PERCENTILE_APPROX_ARRAY` は一回の集約で複数の近似パーセンタイルを計算します。入力値から一つの T-Digest を構築し、共有状態から指定された各パーセンタイルを評価するため、各パーセンタイルに `PERCENTILE_APPROX` を別々に呼び出すより効率的です。

:::note
この関数は 4.2.0 以降でサポートされます。
:::

## 構文

```sql
PERCENTILE_APPROX_ARRAY(<col>, <quantiles> [, <compression>])
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<col>` | パーセンタイルを計算する数値式。値は `DOUBLE` に変換され、`NULL` 値は無視されます。 |
| `<quantiles>` | 定数の `ARRAY<DOUBLE>`。各要素は有限かつ NULL 以外で、`[0.0, 1.0]` の範囲にある必要があります。結果は配列と同じ順序で返され、重複するレベルも保持されます。空配列も指定できます。 |
| `<compression>` | 省略可能な定数の `DOUBLE`。範囲は `[2048, 10000]` です。値が大きいほど一般に精度が上がりますが、メモリ使用量も増えます。デフォルトは `10000` で、有限でない値や有効範囲外の値を指定した場合も `10000` を使用します。 |

## 戻り値

`ARRAY<DOUBLE>` を返します。`<quantiles>` の各要素に対応する近似パーセンタイルを一つずつ含みます。`<quantiles>` が空の場合、またはグループ内に NULL 以外の入力値がない場合は空配列を返します。パーセンタイルのレベルが無効な場合や、`<quantiles>` に NULL 要素が含まれる場合はエラーになります。

## 使用例

```sql
CREATE TABLE percentile_approx_array_example (
    id INT,
    value DOUBLE NULL
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO percentile_approx_array_example VALUES
    (1, 1.0), (2, 2.0), (3, 3.0), (4, NULL),
    (5, 10.0), (6, 20.0), (7, 30.0), (8, 100.0);
```

デフォルトの圧縮レベルで複数の近似パーセンタイルを計算する場合:

```sql
SELECT percentile_approx_array(value, [0.0, 0.25, 0.5, 0.75, 1.0]) AS percentiles
FROM percentile_approx_array_example;
```

```text
+--------------------------+
| percentiles              |
+--------------------------+
| [1, 2.25, 10, 27.5, 100] |
+--------------------------+
```

圧縮レベルを明示的に指定する場合:

```sql
SELECT percentile_approx_array(value, [0.25, 0.5, 0.75], 2048) AS percentiles
FROM percentile_approx_array_example;
```

```text
+------------------+
| percentiles      |
+------------------+
| [2.25, 10, 27.5] |
+------------------+
```

入力がすべて NULL の場合は空配列を返します:

```sql
SELECT percentile_approx_array(CAST(NULL AS DOUBLE), [0.0, 0.5, 1.0]) AS percentiles
FROM percentile_approx_array_example;
```

```text
+-------------+
| percentiles |
+-------------+
| []          |
+-------------+
```

パーセンタイルの配列が空の場合も空配列を返します:

```sql
SELECT percentile_approx_array(value, []) AS percentiles
FROM percentile_approx_array_example;
```

```text
+-------------+
| percentiles |
+-------------+
| []          |
+-------------+
```
