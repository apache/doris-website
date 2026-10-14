---
{
"title": "DATASKETCHES_HLL_UNION_AGG",
"language": "ja",
"description": "datasketches_hll_union_agg 関数は、複数の Apache DataSketches HLL スケッチを統合し、その和集合の推定カーディナリティを DOUBLE 値で返す集約関数です。"
}
---

## 説明

`datasketches_hll_union_agg` は、複数の Apache DataSketches **HLL** スケッチ (`hll_sketch`) のシリアライズ済み値を**統合**し、その和集合の**推定カーディナリティ**（概算の異なる値の数 / NDV）を返す集約関数です。

この関数には、DataSketches HLL スケッチをシリアライズしたバイト列を入力します（例: DataSketches ライブラリの `hll_sketch.serialize_compact()` で生成した値）。任意の文字列は受け付けません。

エイリアス:

- `ds_hll_estimate`
- `datasketches_hll_estimate`

## 構文

```sql
datasketches_hll_union_agg(<sketch>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<sketch>` | Apache DataSketches HLL スケッチをシリアライズしたバイト列。サポートされる型は STRING / VARCHAR / VARBINARY です。NULL 値は無視されます。空文字列は無効な入力として扱われ、エラーが発生します。 |

## 戻り値

カーディナリティの推定値を DOUBLE（Float64）型で返します。  
グループ内に有効なデータがない場合（入力行がない場合を含む）は 0 を返します。  
入力バイト列を有効な DataSketches HLL スケッチとしてデシリアライズできない場合（空文字列を含む）は、エラーが発生します（通常はエラーコード `CORRUPTION`）。

## 使用例

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
