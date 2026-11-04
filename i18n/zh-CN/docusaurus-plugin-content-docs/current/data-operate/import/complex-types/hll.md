---
{
    "title": "HLL",
    "language": "zh-CN",
    "description": "介绍如何使用 Stream Load 配合 hll_hash 或 hll_from_binary 函数将数据导入 Doris HLL 类型字段，实现大数据量下高性能的模糊去重与 UV 统计。",
    "keywords": [
        "HLL",
        "HyperLogLog",
        "模糊去重",
        "近似去重",
        "hll_hash",
        "hll_cardinality",
        "Stream Load",
        "Count Distinct",
        "UV 统计",
        "Doris 复杂类型导入"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 大数据量下的模糊去重 / UV 统计 / HLL 字段数据导入 -->

HLL（HyperLogLog）是 Doris 提供的一种用于**模糊去重**的数据类型。在数据量较大的场景下，HLL 的去重性能显著优于 `Count Distinct`，常用于 UV 统计、独立用户数计算等场景。

由于 HLL 字段不能直接写入原始值，导入时需要结合 `hll_hash` 等函数进行哈希转换；如果源列已经是 Doris HLL 的序列化字节，则改用 `hll_from_binary` 映射。更多关于 HLL 类型的说明，请参考 [HLL](../../../sql-manual/basic-element/sql-data-types/aggregate/HLL)。

## 适用场景

| 场景 | 说明 |
| --- | --- |
| 海量数据 UV 统计 | 例如日活、月活独立用户数估算 |
| 大数据量去重计数 | 数据量在百万级以上、对精度可接受少量误差的场景 |
| 替代 Count Distinct | 在保证可接受误差的前提下显著降低计算开销 |

## 使用流程概览

完整的 HLL 数据导入流程包含以下 4 个步骤：

1. 准备待导入的源数据文件
2. 在 Doris 中创建包含 HLL 列的目标表
3. 通过 Stream Load 配合 `hll_hash` 函数导入数据
4. 使用 `hll_cardinality` 验证导入结果

## 使用示例

### 第 1 步：准备数据

创建源数据文件 `test_hll.csv`，内容如下：

```sql
1001|koga
1002|nijg
1003|lojn
1004|lofn
1005|jfin
1006|kon
1007|nhga
1008|nfubg
1009|huang
1010|buag
```

### 第 2 步：在库中创建表

在目标库中创建包含 HLL 列的聚合模型表：

```sql
CREATE TABLE testdb.test_hll(
    typ_id           BIGINT          NULL   COMMENT "ID",
    typ_name         VARCHAR(10)     NULL   COMMENT "NAME",
    pv               hll hll_union   NOT NULL   COMMENT "hll"
)
AGGREGATE KEY(typ_id,typ_name)
DISTRIBUTED BY HASH(typ_id) BUCKETS 10;
```

说明：

- HLL 列必须搭配聚合函数 `hll_union` 使用。
- 表模型必须为 `AGGREGATE KEY` 模型。

### 第 3 步：导入数据

通过 Stream Load 导入数据，使用 `columns` 参数将原始列 `typ_id` 经 `hll_hash` 转换后写入 `pv` 列：

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,typ_name,pv=hll_hash(typ_id)" \
    -T test_hll.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_hll/_stream_load
```

关键参数说明：

| 参数 | 说明 |
| --- | --- |
| `column_separator` | 源文件列分隔符，本例使用 `|` |
| `columns` | 字段映射表达式，HLL 列必须通过 `hll_hash()`、`hll_from_base64()`、`hll_from_binary()` 或 `hll_empty()` 之一进行转换，详见[导入已序列化的 HLL 数据](#导入已序列化的-hll-数据) |
| `<doris_user>` / `<doris_password>` | Doris 的用户名与密码 |
| `<fe_ip>` / `<fe_http_port>` | FE 节点的 IP 地址与 HTTP 端口 |

### 第 4 步：检查导入数据

使用 `hll_cardinality` 函数查询 HLL 列的去重计数结果：

```sql
mysql> select typ_id,typ_name,hll_cardinality(pv) from testdb.test_hll;
+--------+----------+---------------------+
| typ_id | typ_name | hll_cardinality(pv) |
+--------+----------+---------------------+
|   1010 | buag     |                   1 |
|   1002 | nijg     |                   1 |
|   1001 | koga     |                   1 |
|   1008 | nfubg    |                   1 |
|   1005 | jfin     |                   1 |
|   1009 | huang    |                   1 |
|   1004 | lofn     |                   1 |
|   1007 | nhga     |                   1 |
|   1003 | lojn     |                   1 |
|   1006 | kon      |                   1 |
+--------+----------+---------------------+
10 rows in set (0.06 sec)
```

返回结果显示每条记录的 HLL 列基数均为 1，说明数据已正确导入并被 `hll_hash` 哈希。

## 导入已序列化的 HLL 数据

当源数据已经是 Doris HLL 的序列化字节而不是原始值时，不要再哈希一次，而是通过 `hll_from_binary` 映射，由该函数将字节反序列化为 HLL 列：

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,typ_name,pv=hll_from_binary(typ_id_binary)" \
    -T test_hll_binary.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_hll/_stream_load
```

`hll_from_binary` 接受 [`hll_to_binary`](../../../sql-manual/sql-functions/scalar-functions/hll-functions/hll-to-binary) 的输出、Doris Hive UDF（`to_hll` / `hll_union`）的输出，以及任何使用相同 Doris HLL 序列化格式的写入方产生的字节。如果源列存的是 Base64 文本而不是原始字节，先用 `from_base64` 解码，例如 `pv=hll_from_binary(from_base64(typ_id_base64))`。

`columns` 映射中的 HLL 列只能使用以下函数之一，其他表达式会在分析阶段报错 `HLL column must use hll_hash function`：

| 函数 | 适用情况 |
| --- | --- |
| `hll_hash(<value>)` | 源列是原始值，需要哈希 |
| `hll_from_base64(<string>)` | 源列是 Doris HLL 字节的 Base64 字符串 |
| `hll_from_binary(<varbinary>)` | 源列是 Doris HLL 的原始字节 |
| `hll_empty()` | 该列需要初始化为空 HLL |

:::caution

`hll_from_binary` 对不合法或被截断的字节返回 `NULL`。HLL 列必须声明为 `NOT NULL`，因此这些行会被过滤掉，并计入导入的 `max_filter_ratio`。如果过滤行比例过高会导致作业失败，请在导入前先校验源字节。

:::

## 常见问题

### HLL 列为什么必须使用 hll_hash？

HLL 是一种特殊的二进制聚合类型，不能直接存储原始值，需要先通过 `hll_hash` 将原始值转换为 HLL 内部表示，再写入 HLL 列。当源数据已经是 Doris HLL 序列化格式时，应改用 `hll_from_binary`（原始字节）或 `hll_from_base64`（Base64 文本），而不是再哈希一次。

### HLL 与 Count Distinct 有什么区别？

| 维度 | HLL | Count Distinct |
| --- | --- | --- |
| 精度 | 近似（存在少量误差） | 精确 |
| 性能 | 数据量大时显著更优 | 数据量大时性能下降明显 |
| 存储 | 固定占用较小空间 | 不需额外存储 |
| 适用场景 | UV 估算等可容忍误差的场景 | 要求精确去重的场景 |

### 创建 HLL 列时表模型有什么要求？

HLL 列依赖聚合函数 `hll_union`，因此必须在 `AGGREGATE KEY` 聚合模型表中使用。
