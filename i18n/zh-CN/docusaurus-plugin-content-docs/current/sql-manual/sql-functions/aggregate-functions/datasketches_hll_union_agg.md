---
{
  "title": "DATASKETCHES_HLL_UNION_AGG",
  "language": "zh-CN",
  "description": "datasketches_hll_union_agg 函数是一种聚合函数，用于对多个 Apache DataSketches HLL sketch 的序列化结果进行 union 合并，并返回合并后基数的估算值（近似去重数）。"
}
---

## 描述

`datasketches_hll_union_agg` 函数是一种聚合函数，用于对多个 **Apache DataSketches HLL sketch（hll_sketch）** 的序列化结果进行 **union 合并**，并返回合并后基数的**估算值**（近似去重数 / NDV）。

该函数的输入不是普通字符串，而是 **DataSketches HLL sketch 的序列化字节串**（例如由 DataSketches 的 `hll_sketch.serialize_compact()` 生成）。

别名：

- `ds_hll_union_count`
- `ds_cardinality`

## 语法

```sql
datasketches_hll_union_agg(<sketch>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<sketch>` | DataSketches HLL sketch 的序列化字节串。支持类型：STRING / VARCHAR / BINARY / VARBINARY。NULL 会被忽略；空字符串属于非法输入，将报错。 |

## 返回值

返回 BIGINT 类型的基数估算值。  
如果组内没有合法数据则返回 0 。  
若输入字节串无法反序列化为合法的 DataSketches HLL sketch（包括空字符串），将报错。

## 举例

```sql
-- setup
CREATE TABLE test_datasketches_hll_union_agg_tbl (
    id INT,
    sk STRING
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

-- 通过 from_base64() 将 Base64 文本解码为 sketch 字节串后写入
INSERT INTO test_datasketches_hll_union_agg_tbl VALUES
    (1, from_base64('AgEHCAMIBwjL18IEK/L7BoYv+Q11gWYHgbxdBntl5gj8LUIK')),
    (2, from_base64('AwEHCAUIAAkKAAAAIjvrBcS1nwfGGWoEyHokBO8t9wc1qTEENkcJB7hWqQxZf9QNnuSbGA==')),
    (3, NULL);
```

```sql
SELECT datasketches_hll_union_agg(sk) FROM test_datasketches_hll_union_agg_tbl;
```

```text
+-------------------------------+
| datasketches_hll_union_agg(sk) |
+-------------------------------+
|                            17 |
+-------------------------------+
```

```sql
-- 别名用法
SELECT
    datasketches_hll_union_agg(sk),
    ds_hll_union_count(sk),
    ds_cardinality(sk)
FROM test_datasketches_hll_union_agg_tbl;
```

```sql
-- 组内无合法数据返回 0
SELECT datasketches_hll_union_agg(sk)
FROM test_datasketches_hll_union_agg_tbl
WHERE sk IS NULL;
```

```text
+-------------------------------+
| datasketches_hll_union_agg(sk) |
+-------------------------------+
|                             0 |
+-------------------------------+
```

```sql
-- 空字符串属于非法输入，将报错
SELECT datasketches_hll_union_agg('');
```