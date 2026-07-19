---
{
    "title": "VARIANT V2 计算语义与内存编码",
    "language": "zh-CN",
    "description": "介绍实验性 ColumnVariantV2 计算路径的架构与行为，包括内存状态、标量编码、canonical equality、CAST 与解析语义，以及当前限制。"
}
---

## 概览

`ColumnVariantV2` 是 `VARIANT` 的实验性、仅用于计算的执行路径。它为支持的表达式、分组和集合运算提供自描述的内存表示及 canonical value 语义。

SQL 语法、类型规则、索引、存储配置和通用限制请参见 [VARIANT 类型参考](./VARIANT)；在默认存储行为、Sparse、DOC mode 和 Schema Template 之间选型时，请参见 [VARIANT 使用与配置指南](./variant-workload-guide)。本文集中说明 V2 的执行架构和行为。

:::caution 实验特性
`ColumnVariantV2` 默认关闭，只改变当前 FE session 选择的计算路径。它不会引入 V2 表格式、导入路径、Segment 读写器、统计信息格式或 Compaction 路径，也不提供 V1/V2 混部滚动升级兼容能力。
:::

## 开启计算路径

通过 session variable `enable_variant_v2` 为当前 FE session 开启 V2：

```sql
SET enable_variant_v2 = true;
```

该 session variable 只改变 FE/BE 执行类型标记。已经持久化的 `VARIANT` 数据及其存储兼容性契约不会改变。

## 执行架构

### 整列状态模型

一个 `ColumnVariantV2` 列在任意时刻只有一种整列级物理状态：

- **Typed scalar（`T`）**：同质标量行借用具体的 Doris 标量列及其 data type；独立的 Variant-null map 表示 Variant/JSON `null`。
- **Encoded（`E`）**：嵌套值、异构值或已经物化的值，以自描述字节的形式存放在 arena 中。
- 同一列不会在行级混用 `T` 和 `E`。SQL `NULL` 仍保存在 SQL nullable bitmap 中，在两种状态下都与 Variant/JSON `null` 不同。

这种区分使简单标量表达式不必立即编码，同时让嵌套或异构算子在需要时可以消费统一的自描述表示。

### 核心组件

| 组件 | 职责 |
| --- | --- |
| `ColumnVariantV2` | 管理整列 `T`/`E` 状态、NULL 语义、read view 和物化入口。 |
| `VariantBlockBuilder` | 构建 encoded scalar、array 和 object 行，并把自描述字节追加到 arena。 |
| `VariantScalarEncodingPlan` | 选择 primitive ID、payload 宽度、scale 或 length 元数据，校验边界并写入标量编码。 |
| `with_typed_scalar()` | 集中维护 typed scalar 映射矩阵，同时为 Doris 值创建物理编码计划和 canonical scalar view。 |
| `VariantCanonicalScalarRef` | 表示 canonical 哈希和序列化使用的逻辑标量，不依赖物理宽度或源类型。 |
| Variant V2 CAST 与解析函数 | 定义 typed SQL 值、Variant 字符串和已解析 JSON 值之间的边界。 |

### Typed-to-encoded 物化流程

1. 支持的同质标量可以使用精确的 Doris 标量类型，以 `T` 状态进入计算路径。
2. 只需要 typed read view 的算子可以直接借用该状态，不必编码整列。
3. 当算子需要自描述值时，`ensure_encoded()` 按 Doris primitive type 做一次分派，然后访问各行。
4. `with_typed_scalar()` 为每个非空行同时生成物理 encoding factory 和 canonical-value factory。
5. `VariantScalarEncodingPlan` 把物理值写入 arena；完成物化后，后续 encoded 运算看到的是 `E` 状态。

集中式映射让物理序列化和 canonical equality 保持一致，同时避免每一行都进行虚调用或类型分派。

## 内存编码与组织方式

Encoded 表示会把 primitive type 以及必要的 scale、length 元数据与 payload 一起保存。Array 和 object 还会携带足以定位子值的结构信息。该表示面向计算期遍历，而不是新的表持久化格式。

这种组织方式在概念上类似于把 Variant encoded value 与可选的 typed projection 分开。外部格式可参考官方 [Apache Parquet File Format](https://parquet.apache.org/docs/file-format/)、[Parquet Variant Shredding](https://parquet.apache.org/docs/file-format/types/variantshredding/) 和 [Parquet Nested Encoding](https://parquet.apache.org/docs/file-format/nestedencoding/)。Parquet 以 `metadata` 和 `value` 组织 Variant，并可为同质路径增加 `typed_value`。这里仅用于说明组织思路；`ColumnVariantV2` 的内存格式和 Doris 磁盘格式都不是 Parquet。

## Typed scalar 物化映射

### Decimal 类型

Typed Decimal 从 `T` 物化为 `E` 时，`with_typed_scalar()` 保留 unscaled integer 和 scale，并根据 Doris 源类型选择 payload 宽度：

| Doris 类型 | 从列中读取的 unscaled 值 | 编码调用 | Variant primitive |
| --- | --- | --- | --- |
| `DECIMALV2` | `DecimalV2Value::value()` 返回的 `__int128` | `decimal(value, scale, 16)` | `DECIMAL16` |
| `DECIMAL32` | `Decimal32::value` 中的 `int32_t` | `decimal(value, scale, 4)` | `DECIMAL4` |
| `DECIMAL64` | `Decimal64::value` 中的 `int64_t` | `decimal(value, scale, 8)` | `DECIMAL8` |
| `DECIMAL128I` | `Decimal128V3::value` 中的 `__int128` | `decimal(value, scale, 16)` | `DECIMAL16` |

Decimal 的 encoded 布局是 `[primitive header][scale][小端有符号 unscaled value]`，所以 `DECIMAL4`、`DECIMAL8`、`DECIMAL16` 的总长度分别是 6、10、18 字节。

Decimal 限制与不变量：

- Variant Decimal 的 scale 必须在 `[0, 38]` 内。`DECIMAL4`、`DECIMAL8`、`DECIMAL16` 的 unscaled 绝对值上限分别是 `10^9 - 1`、`10^18 - 1`、`10^38 - 1`。
- Doris 源类型自身的限制仍然生效：`DECIMALV2` 最大 precision 为 27、最大 scale 为 9；`DECIMAL32`、`DECIMAL64`、`DECIMAL128I` 的最大 precision 分别为 9、18、38。
- typed column 的物理 scale 必须与 data type 元数据中的 scale 完全一致；不一致属于不变量破坏，物化时不会自动 rescale。
- encoded 宽度由源类型决定。数值较小的 `DECIMALV2` 或 `DECIMAL128I` 不会在该路径上缩窄为 `DECIMAL4` 或 `DECIMAL8`。
- `DECIMAL256` 不是 `ColumnVariantV2` 支持的 typed identity。它的 precision 最高可达 76，超过 Variant Decimal 的 38 位上限。
- 物理宽度和 scale 不决定 canonical equality。例如 `1.20` 与 `1.2` 可以拥有不同物理编码，但会归一为同一个 canonical 数值。

### 日期和时间类型

日期和 timestamp 映射会先计算：

```text
days = daynr(value) - daynr(1970-01-01)
micros = (days * 86400 + hour * 3600 + minute * 60 + second) * 1000000
         + microsecond
```

| Doris 类型 | 归一化 payload | 编码调用 | Variant primitive |
| --- | --- | --- | --- |
| `DATE` | `int32_t days` | `date(days)` | `DATE` |
| `DATEV2` | `int32_t days` | `date(days)` | `DATE` |
| `DATETIME` | `int64_t micros` | `timestamp_micros(micros, false)` | `TIMESTAMP_NTZ_MICROS` |
| `DATETIMEV2` | `int64_t micros` | `timestamp_micros(micros, false)` | `TIMESTAMP_NTZ_MICROS` |
| `TIMESTAMPTZ` | `int64_t micros` | `timestamp_micros(micros, true)` | `TIMESTAMP_MICROS` |

`DATE` 使用 4 字节 payload 加 1 字节 header；每个 timestamp 使用 8 字节 payload 加 1 字节 header。`utc_adjusted` 参数由 primitive ID 表达：`false` 选择无时区（NTZ）primitive，`true` 选择 UTC-adjusted primitive。

日期和时间限制与不变量：

- 所有源值都必须通过 Doris 的日期合法性检查。非法的 `DATE`、`DATEV2`、`DATETIME`、`DATETIMEV2` 或 `TIMESTAMPTZ` 会抛出 `INVALID_ARGUMENT`；该路径不会修复，也不会转为 `NULL`。
- `DATE` 和 `DATEV2` 只保留相对 `1970-01-01` 的有符号天数，不携带日内时间或时区调整信息。
- `DATETIME` 和 `DATETIMEV2` 编码为 wall-clock、无时区的 timestamp；该路径不会应用 session time zone。只有 `TIMESTAMPTZ` 会选择 UTC-adjusted timestamp primitive。
- Typed materialization 只生成微秒 primitive。`DATETIMEV2` 和 `TIMESTAMPTZ` 最多保留其支持的 6 位小数。Variant 编码虽然定义了 `TIMESTAMP_NANOS` 和 `TIMESTAMP_NTZ_NANOS`，但该映射不会生成它们。
- `TIMEV2` 不是支持的 typed identity。Variant 编码虽然定义了 `TIME_NTZ_MICROS`，但这条 typed-to-encoded 路径不会生成它。

## Canonical value 语义

物理 encoded 字节不会被直接当作 equality identity。Canonicalization 会为哈希和 arena 序列化生成逻辑表示：

- 等价的整数数值表示会归一为同一个值。
- Decimal 尾随零不改变数值。
- `+0`、`-0` 和整数零会归一为同一个值。
- Object key 顺序不影响相等性，array 元素顺序会影响相等性。
- Variant/JSON `null` 与 SQL `NULL` 仍然不同。
- 非法编码或违反内部不变量时会报错，而不是静默接受。

这些规则为支持的值提供 `GROUP BY`、`DISTINCT`、`COUNT(DISTINCT ...)`、`INTERSECT`、`EXCEPT` 和 `UNION DISTINCT` 等哈希运算能力。

```sql
SET enable_variant_v2 = true;

-- 1 和 1.0 只有一个 canonical distinct 值。
SELECT COUNT(DISTINCT value) AS distinct_count
FROM (
    SELECT PARSE_TO_VARIANT('1') AS value
    UNION ALL
    SELECT PARSE_TO_VARIANT('1.0') AS value
) AS numeric_values;
-- distinct_count: 1

-- Object key 顺序不影响 equality。
SELECT COUNT(DISTINCT value) AS distinct_count
FROM (
    SELECT PARSE_TO_VARIANT('{\"a\": 1, \"b\": 2}') AS value
    UNION ALL
    SELECT PARSE_TO_VARIANT('{\"b\": 2, \"a\": 1}') AS value
) AS object_values;
-- distinct_count: 1

-- Array 顺序会保留。
SELECT COUNT(DISTINCT value) AS distinct_count
FROM (
    SELECT PARSE_TO_VARIANT('[1, 2]') AS value
    UNION ALL
    SELECT PARSE_TO_VARIANT('[2, 1]') AS value
) AS array_values;
-- distinct_count: 2
```

Canonical equality 不会开放根 Variant 比较谓词。直接执行 `VARIANT = VARIANT`、null-safe equality 或排序比较仍然不受支持。

## CAST 与解析行为

V2 明确区分“创建 typed Variant 字符串”和“解析 JSON 文本”：

- `CAST(string AS VARIANT)` 创建 typed Variant 字符串，不会按 JSON 解析或校验该字符串。
- `parse_to_variant(json_string)` 将 JSON 文本严格解析为 Variant 值。
- `parse_to_variant_error_to_null(json_string)` 在解析或校验失败时返回 SQL `NULL`。
- 提取出的 Variant 值在进行确定类型的比较、过滤、排序或算术运算前，应先 CAST 到具体 SQL 类型。

完整函数语法请参见 [PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant) 和 [PARSE_TO_VARIANT_ERROR_TO_NULL](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant-error-to-null)。

```sql
SET enable_variant_v2 = true;

SELECT PARSE_TO_VARIANT('{\"id\": 1}') AS parsed_object,
       CAST('{\"id\": 1}' AS VARIANT) AS typed_string;

SELECT ELEMENT_AT(CAST('{\"id\": 1}' AS VARIANT), 'id') AS from_string,
       ELEMENT_AT(PARSE_TO_VARIANT('{\"id\": 1}'), 'id') AS from_json;
-- from_string: NULL; from_json: 1

SELECT PARSE_TO_VARIANT_ERROR_TO_NULL('{\"id\":') AS invalid_value;
-- invalid_value: NULL
```

当函数签名支持 Variant 值时，条件表达式、嵌套容器以及支持 Variant 的 `explode` 可以直接消费 V2 表示。

## 使用边界与限制

- 不支持根 Variant 比较谓词（`=`、`!=`、`<=>` 和排序比较）；应在两侧提取可比较的路径并 CAST。
- 不支持把 Variant 表达式作为 Join Key。
- 根 Variant 不能作为 Sort/TopN 键、窗口分区键或排序键，也不能作为 `MIN` 和 `MAX` 的参数。
- 功能选择只作用于 session，不会改变原生 Variant 存储、导入、统计信息或 Compaction。
- V2 回归测试仍标记为 `nonConcurrent`。
- 仅在验证目标 workload 后开启 V2；该执行路径仍是实验特性。

```sql
SELECT *
FROM tbl
WHERE CAST(v['id'] AS BIGINT) = CAST(other_v['id'] AS BIGINT);
```
