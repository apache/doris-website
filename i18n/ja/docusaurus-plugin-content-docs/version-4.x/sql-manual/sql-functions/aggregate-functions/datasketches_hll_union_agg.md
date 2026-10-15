---
{
    "title": "DATASKETCHES_HLL_UNION_AGG",
    "language": "ja",
    "description": "datasketches_hll_union_agg 関数は、複数の Apache DataSketches HLL スケッチを統合し、統合後の推定基数を DOUBLE 値として返す集約関数です。"
}
---

> バージョン 4.1.2 以降でサポートされています。

## 説明

`datasketches_hll_union_agg` は、シリアライズされた複数の Apache DataSketches **HLL**（`hll_sketch`）値を**統合**し、統合後の**推定基数**（重複しない値の概算件数 / NDV）を返す集約関数です。

この関数には、**DataSketches HLL スケッチをシリアライズしたバイト列**を入力する必要があります（DataSketches ライブラリの `hll_sketch.serialize_compact()` で生成したものなど）。任意の文字列は受け付けません。

## 別名

- `ds_hll_estimate`
- `datasketches_hll_estimate`

## 構文

```sql
datasketches_hll_union_agg(<sketch>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<sketch>` | Apache DataSketches HLL スケッチをシリアライズしたバイト列。サポートされる型: STRING / VARCHAR / VARBINARY。NULL 値は無視されます。空文字列は無効な入力として扱われ、エラーが発生します。 |

## 戻り値

基数の推定値を DOUBLE（Float64）型で返します。  
グループ内に有効なデータがない場合（または入力が空の場合）は 0 を返します。  
入力バイト列を有効な DataSketches HLL スケッチとしてデシリアライズできない場合（空文字列を含む）は、エラーが発生します（通常、エラーコードは `CORRUPTION`）。

## 例

```sql
-- setup
CREATE TABLE test_datasketches_hll_union_agg_tbl (
    id INT,
    sk STRING
)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

-- The sketch bytes are inserted via Base64 decoding.
INSERT INTO test_datasketches_hll_union_agg_tbl VALUES
    (1, from_base64('AgEHCAMIBwjL18IEK/L7BoYv+Q11gWYHgbxdBntl5gj8LUIK')),
    (2, from_base64('AwEHCAUIAAkKAAAAIjvrBcS1nwfGGWoEyHokBO8t9wc1qTEENkcJB7hWqQxZf9QNnuSbGA==')),
    (3, NULL);
```

```sql
-- The function returns DOUBLE, so use ROUND/CAST if you want an integer display.
SELECT CAST(ROUND(datasketches_hll_union_agg(sk)) AS BIGINT)
FROM test_datasketches_hll_union_agg_tbl;
```

```text
+-------------------------------------------------------+
| CAST(ROUND(datasketches_hll_union_agg(sk)) AS BIGINT) |
+-------------------------------------------------------+
|                                                    17 |
+-------------------------------------------------------+
```

```sql
-- aliases
SELECT
    CAST(ROUND(datasketches_hll_union_agg(sk)) AS BIGINT) AS v1,
    CAST(ROUND(ds_hll_estimate(sk)) AS BIGINT)            AS v2,
    CAST(ROUND(datasketches_hll_estimate(sk)) AS BIGINT)  AS v3
FROM test_datasketches_hll_union_agg_tbl;
```

```text
+------+------+------+
| v1   | v2   | v3   |
+------+------+------+
|   17 |   17 |   17 |
+------+------+------+
```

```sql
-- empty input returns 0
SELECT datasketches_hll_union_agg(sk)
FROM test_datasketches_hll_union_agg_tbl
WHERE sk IS NULL;
```

```text
+--------------------------------+
| datasketches_hll_union_agg(sk) |
+--------------------------------+
|                              0 |
+--------------------------------+
```

```sql
-- invalid sketch bytes will throw
SELECT datasketches_hll_union_agg(from_base64('AA=='));
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CORRUPTION]HLL sketch data corrupted when add: Attempt to deserialize unknown object type
```

```sql
-- empty string is invalid and will throw
SELECT datasketches_hll_union_agg('');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CORRUPTION]HLL sketch data corrupted when add: empty input.
```
