---
{
  "title": "DATASKETCHES_HLL_UNION_AGG",
  "language": "zh-CN",
  "description": "datasketches_hll_union_agg 函数是一种聚合函数，用于对多个 Apache DataSketches HLL sketch 的序列化结果进行 union 合并，并返回合并后基数的估算值（DOUBLE）。"
}
---

## 描述

`datasketches_hll_union_agg` 函数是一种聚合函数，用于对多个 **Apache DataSketches HLL sketch（hll_sketch）** 的序列化结果进行 **union 合并**，并返回合并后基数的**估算值**（近似去重数 / NDV）。

该函数的输入不是普通字符串，而是 **DataSketches HLL sketch 的序列化字节串**（例如由 DataSketches 的 `hll_sketch.serialize_compact()` 生成）。

别名：

- `ds_hll_estimate`
- `datasketches_hll_estimate`

## 语法

```sql
datasketches_hll_union_agg(<sketch>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<sketch>` | DataSketches HLL sketch 的序列化字节串。支持类型：STRING / VARCHAR / VARBINARY。NULL 会被忽略；空字符串属于非法输入，将报错。 |

## 返回值

返回 DOUBLE（Float64）类型的基数估算值。  
如果没有合法数据（例如全为 NULL，或表为空）则返回 0。  
若输入字节串无法反序列化为合法的 DataSketches HLL sketch（包括空字符串），将报错（通常错误码为 `CORRUPTION`）。

## 举例

```sql
-- setup
CREATE TABLE test_datasketches_hll_union_agg_tbl (
    id INT,
    sk STRING
)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

-- 通过 from_base64() 将 Base64 文本解码为 sketch 字节串后写入
INSERT INTO test_datasketches_hll_union_agg_tbl VALUES
    (1, from_base64('AgEHCAMIBwjL18IEK/L7BoYv+Q11gWYHgbxdBntl5gj8LUIK')),
    (2, from_base64('AwEHCAUIAAkKAAAAIjvrBcS1nwfGGWoEyHokBO8t9wc1qTEENkcJB7hWqQxZf9QNnuSbGA==')),
    (3, NULL);
```

```sql
-- 该函数返回 DOUBLE，如需以整数形式展示可配合 ROUND/CAST
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
-- 别名用法
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
-- 组内无合法数据返回 0
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
-- 非法 sketch 字节串将报错
SELECT datasketches_hll_union_agg(from_base64('AA=='));
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CORRUPTION]HLL sketch data corrupted when add: Attempt to deserialize unknown object type
```

```sql
-- 空字符串属于非法输入，将报错
SELECT datasketches_hll_union_agg('');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CORRUPTION]HLL sketch data corrupted when add: empty input.
```