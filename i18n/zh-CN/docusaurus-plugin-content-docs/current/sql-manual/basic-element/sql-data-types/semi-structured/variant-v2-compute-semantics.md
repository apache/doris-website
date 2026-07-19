---
{
    "title": "VARIANT V2 行为与语义",
    "language": "zh-CN",
    "description": "面向用户介绍实验性 VARIANT V2 的功能、行为和语义，包括开启方式、Equality、CAST 与 JSON 解析、Decimal 和日期时间处理、SQL 示例及当前限制。"
}
---

## 概览

实验性 VARIANT V2 扩展了可以消费 `VARIANT` 值的运算，并为分组、去重和集合运算定义了一致的 logical-value 语义。

SQL 语法、索引、存储配置和通用类型规则请参见 [VARIANT 类型参考](./VARIANT)；在默认存储行为、Sparse、DOC mode 和 Schema Template 之间选型时，请参见 [VARIANT 使用与配置指南](./variant-workload-guide)。本文只说明开启 V2 后用户可以观察到的行为。

:::caution 实验特性
V2 默认关闭，只作用于当前 session。现有数据和 Variant 持久化格式不会改变。请在验证目标 workload 后再开启。
:::

## 开启 V2

执行目标 SQL 前设置 session variable：

```sql
SET enable_variant_v2 = true;
```

该设置只影响当前 session，已经持久化的 `VARIANT` 数据不会改变。

## 开启 V2 后的行为

| 场景 | V2 行为 |
| --- | --- |
| 分组与去重 | 支持的 Variant 值可以基于 logical-value equality 用于 `GROUP BY`、`DISTINCT` 和 `COUNT(DISTINCT ...)`。 |
| 集合运算 | 支持的 Variant 值可以参与 `INTERSECT`、`EXCEPT` 和 `UNION DISTINCT`。 |
| JSON 解析 | 使用 `parse_to_variant` 或 `parse_to_variant_error_to_null` 显式解析 JSON 文本。 |
| 字符串转换 | `CAST(string AS VARIANT)` 创建 Variant 字符串，不会把字符串按 JSON 解析。 |
| 嵌套表达式 | 支持的条件表达式、嵌套容器和支持 Variant 的 `explode` 可以消费 Variant 值。 |
| 非法值 | 格式错误或不受支持的 Variant 值会报错，而不是静默接受。 |

V2 不会开放整个（根）Variant 值的全部运算。直接比较谓词、Join Key、排序和 `MIN`/`MAX` 等能力仍受限制，详见[当前限制](#当前限制)。

例如，在默认路径上不能对根 Variant 值直接分组或去重；开启 V2 后，相同的值可以按 logical equality 分组：

```sql
SET enable_variant_v2 = true;

SELECT COUNT(DISTINCT value) AS distinct_count
FROM (
    SELECT PARSE_TO_VARIANT('1') AS value
    UNION ALL
    SELECT PARSE_TO_VARIANT('1.0') AS value
) AS numeric_values;
-- distinct_count: 1
```

## Equality 语义

分组、去重和集合运算比较的是 logical value，而不是来源 SQL 类型或表示形式：

- 等价的整数数值表示相等。
- Decimal 尾随零不改变值，因此 `1.20` 与 `1.2` 相等。
- `+0`、`-0` 和整数零相等。
- Object key 顺序不影响相等性。
- Array 元素顺序影响相等性。
- Variant/JSON `null` 与 SQL `NULL` 不同。

```sql
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

这些 Equality 规则只用于支持的哈希和集合运算，不会开放直接 `VARIANT = VARIANT`、null-safe equality 或排序比较。

## CAST 与 JSON 解析

V2 明确区分 Variant 字符串和已经解析的 JSON 值：

| 操作 | 结果 | 非法 JSON 行为 |
| --- | --- | --- |
| `CAST(string AS VARIANT)` | 保留原始文本的 Variant 字符串 | 不执行 JSON 校验 |
| `parse_to_variant(string)` | 从 JSON 文本解析出的 Variant 值 | 返回错误 |
| `parse_to_variant_error_to_null(string)` | 从 JSON 文本解析出的 Variant 值 | 返回 SQL `NULL` |
| `CAST(variant_value AS T)` | 类型为 `T` 的具体 SQL 值 | 遵循目标类型的 CAST 规则 |

完整函数语法请参见 [PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant) 和 [PARSE_TO_VARIANT_ERROR_TO_NULL](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant-error-to-null)。

```sql
SET enable_variant_v2 = true;

SELECT PARSE_TO_VARIANT('{\"id\": 1}') AS parsed_object,
       CAST('{\"id\": 1}' AS VARIANT) AS variant_string;

SELECT ELEMENT_AT(CAST('{\"id\": 1}' AS VARIANT), 'id') AS from_string,
       ELEMENT_AT(PARSE_TO_VARIANT('{\"id\": 1}'), 'id') AS from_json;
-- from_string: NULL; from_json: 1

SELECT PARSE_TO_VARIANT_ERROR_TO_NULL('{\"id\":') AS invalid_value;
-- invalid_value: NULL

SELECT CAST(PARSE_TO_VARIANT('42') AS BIGINT) AS id;
-- id: 42
```

不要使用 `CAST(string AS VARIANT)` 校验 JSON。提取出的 Variant 值在进行确定类型的比较、过滤、排序或算术运算前，应先 CAST 到具体 SQL 类型。

## Decimal 语义与限制

V2 会精确保留受支持的 Decimal 值及其 scale；Equality 语义会忽略不影响数值的尾随零。

| Doris 输入类型 | 支持范围 | V2 行为 |
| --- | --- | --- |
| 旧版 `DECIMALV2` | Precision 最大 27；scale 最大 9 | 精确保留为 Variant Decimal |
| `DECIMAL(p, s)` | `1 <= p <= 38`，`0 <= s <= p` | 精确保留为 Variant Decimal |
| `DECIMAL(p, s)` | `39 <= p <= 76` | V2 不支持；请先 CAST 到 precision 38 或更低 |

当前 Decimal 限制：

- Variant Decimal 支持的 precision 和 scale 上限均为 38。
- 源值必须同时满足 Doris Decimal 类型和 Variant precision 上限。
- `1.20` 与 `1.2` 等值会保留 Decimal 数值，并在支持的分组和集合运算中视为同一个 logical value。

## 日期和时间语义与限制

| Doris 输入类型 | Variant 语义 | 精度与时区行为 |
| --- | --- | --- |
| `DATE` | 日历日期 | 天级精度；不包含时间和时区 |
| 旧版 `DATETIME` | 无时区 timestamp | 秒级精度；不进行 session time zone 调整 |
| `DATETIME(p)` | 无时区 timestamp | `0 <= p <= 6`；不进行 session time zone 调整 |
| `TIMESTAMPTZ(p)` | 带时区调整语义的 timestamp | `0 <= p <= 6` |
| `TIME` | — | V2 不支持 |

当前日期和时间限制：

- 所有源值都必须是合法的 Doris 日期或 timestamp。非法值返回 `INVALID_ARGUMENT`，不会被修复或转换为 `NULL`。
- `DATETIME` 和 `DATETIMEV2` 保持 wall-clock、无时区语义；转换过程不会应用 session time zone。
- `TIMESTAMPTZ` 是当前支持并保留时区调整 timestamp 语义的输入类型。
- V2 日期和时间转换支持微秒精度，不支持纳秒精度。

## NULL 语义

SQL `NULL` 与 Variant/JSON `null` 是不同的值：

- SQL `NULL` 表示 SQL 值缺失，并遵循普通 SQL NULL 传播规则。
- Variant/JSON `null` 是一个 Variant 值，例如由 `parse_to_variant('null')` 产生。
- `parse_to_variant_error_to_null` 遇到非法输入时返回 SQL `NULL`；这与成功解析 JSON literal `null` 不同。

## 当前限制

- 不支持根 Variant 比较谓词（`=`、`!=`、`<=>`、`<`、`<=`、`>` 和 `>=`）；应在两侧提取可比较的路径并 CAST。
- 不支持把 Variant 表达式作为 Join Key。
- 根 Variant 不能作为 Sort/TopN Key、窗口分区键或窗口排序键。
- 根 Variant 不能作为 `MIN` 或 `MAX` 的参数。
- Precision 大于 38 的 Decimal 值和 `TIME` 值不支持作为 V2 输入。
- 功能选择只作用于 session，不会改变已经持久化的 Variant 数据。
- 仅在验证目标 workload 后开启 V2；该功能仍是实验特性。

```sql
-- 比较具体子路径，而不是根 Variant 值。
SELECT *
FROM tbl
WHERE CAST(v['id'] AS BIGINT) = CAST(other_v['id'] AS BIGINT);
```
