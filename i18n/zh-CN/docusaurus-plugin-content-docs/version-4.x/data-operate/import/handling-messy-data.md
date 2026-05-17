---
{
    "title": "异常数据处理",
    "language": "zh-CN",
    "description": "导入数据时如何处理类型转换失败、字段超长、精度溢出等异常？通过 strict_mode 与 max_filter_ratio 灵活控制脏数据。",
    "keywords": [
        "Doris 异常数据处理",
        "strict_mode 严格模式",
        "max_filter_ratio 最大过滤比例",
        "导入数据类型转换失败",
        "脏数据过滤",
        "Stream Load 异常数据",
        "Broker Load 数据过滤",
        "Routine Load strict_mode",
        "Insert Into enable_insert_strict"
    ]
}
---

<!-- 知识类型: 配置参数 + 操作步骤 -->
<!-- 适用场景: 数据导入 / 脏数据治理 / 故障排查 -->

在导入过程中，源数据列与目标列的数据类型可能存在不一致的情况。Doris 在导入时会对类型不一致的数据进行转换，但转换过程可能出现以下问题，导致部分数据无法正确入库：

- 字段类型不匹配（如字符串 `"abc"` 写入 `TinyInt` 列）
- 字段超长（如 11 个字符写入 `char(10)` 列）
- 精度不匹配 / 数值溢出（如 `10` 写入 `Decimal(1,0)` 列）

为了应对此类异常情况，Doris 提供了两个核心的导入控制参数：

| 参数 | 作用 | 默认值 |
| --- | --- | --- |
| `strict_mode`（严格模式） | 控制是否过滤列类型转换失败的数据行 | `false` |
| `max_filter_ratio`（最大过滤比例） | 设置可容忍的异常数据占总数据的最大比例 | `0` |

> 通过组合使用上述两个参数，可以在「严格保证数据质量」与「容忍少量脏数据」之间灵活取舍。

## 严格模式（strict_mode） {#严格模式}
<!-- 知识类型: 配置参数说明 -->

严格模式（`strict_mode`）的主要功能是：对导入过程中发生**列类型转换失败**的数据行进行过滤。

### 列类型转换失败的过滤策略

根据严格模式的设置，系统会采取不同的处理策略：

- **关闭严格模式**：转换失败的字段将被设置为 `NULL` 值，包含这些 `NULL` 值的异常数据行会与正确的数据行一起导入。
- **开启严格模式**：系统会过滤掉转换失败的数据行，仅导入正确的数据行。这里的「转换失败」特指：原始数据非 `NULL`，但在列类型转换后结果为 `NULL` 的情况。需要注意的是，这里的列类型转换不包括使用函数计算得到的 `NULL` 值。
- **NULL 值处理**：无论是正确的数据行还是异常的数据行都可能包含 `NULL` 值。如果目标列被定义为不允许 `NULL` 值，则包含 `NULL` 值的数据行都会被过滤掉。

下面通过三个典型的列类型示例，说明严格模式开启与关闭时的行为差异。

#### 示例 1：列类型为 TinyInt

| 原始数据类型 | 原始数据举例     | 转换为 TinyInt 后的值 | 严格模式     | 结果             |
| ------------ | ---------------- | --------------------- | ------------ | ---------------- |
| 空值         | `\N`             | `NULL`                | 开启或关闭   | `NULL`           |
| 非空值       | `"abc"` 或 `2000` | `NULL`                | 开启         | 非法值（被过滤） |
| 非空值       | `"abc"` 或 `2000` | `NULL`                | 关闭         | `NULL`           |
| 非空值       | `1`              | `1`                   | 开启或关闭   | 正确导入         |

:::tip
1. 表中的列允许导入空值。
2. `abc` 及 `2000` 在转换为 `TinyInt` 后，会因类型或精度问题变为 `NULL`。在严格模式开启的情况下，这类数据将会被过滤；如果是关闭状态，则会导入 `NULL`。
:::

#### 示例 2：列类型为 Decimal(1,0)

| 原始数据类型 | 原始数据举例 | 转换为 Decimal 后的值 | 严格模式     | 结果             |
| ------------ | ------------ | --------------------- | ------------ | ---------------- |
| 空值         | `\N`         | `NULL`                | 开启或关闭   | `NULL`           |
| 非空值       | `aaa`        | `NULL`                | 开启         | 非法值（被过滤） |
| 非空值       | `aaa`        | `NULL`                | 关闭         | `NULL`           |
| 非空值       | `10`         | `NULL`（溢出）        | 开启         | 被过滤           |
| 非空值       | `10`         | `NULL`（溢出）        | 关闭         | `NULL`           |

:::tip
1. 表中的列允许导入空值。
2. `aaa` 在转换为 `Decimal` 后，会因类型问题变为 `NULL`。在严格模式开启的情况下，这类数据将会被过滤；如果是关闭状态，则会导入 `NULL`。
3. `10` 是一个超过 `Decimal(1, 0)` 范围的值，会被转换为 `NULL`。在严格模式开启的情况下将会被过滤；严格模式关闭状态下，则会导入 `NULL`。
:::

#### 示例 3：列类型为 char(10)

| 原始数据类型 | 原始数据举例   | 转换为 char(10) 后的值 | 严格模式 | 结果                |
| ------------ | -------------- | ---------------------- | -------- | ------------------- |
| 空值         | `\N`           | `NULL`                 | 开启或关闭 | `NULL`              |
| 非空值       | `a1234567890`  | `a1234567890`          | 开启     | 超长，被过滤        |
| 非空值       | `a1234567890`  | `a1234567890`          | 关闭     | `a123456789`（截断）|

:::tip
表中的列允许导入空值。
:::

### 开启严格模式

`strict_mode` 默认为 `false`。各种导入方式开启严格模式的示例如下：

**Stream Load**

```shell
curl --location-trusted -u user:passwd \
    -H "strict_mode: true" \
    -T data.txt \
    http://host:port/api/example_db/test_table/_stream_load
```

**Broker Load**

```sql
LOAD LABEL example_db.label_1
(
    DATA INFILE("s3://bucket/data.txt")
    INTO TABLE test_table
)
WITH S3 (...)
PROPERTIES
(
    "strict_mode" = "true"
);
```

**Routine Load**

```sql
CREATE ROUTINE LOAD example_db.job1 ON test_table
PROPERTIES
(
    "strict_mode" = "true"
)
FROM KAFKA (...);
```

**MySQL Load**

```sql
LOAD DATA LOCAL INFILE 'data.txt'
INTO TABLE test_table
PROPERTIES
(
    "strict_mode" = "true"
);
```

**Insert Into**

```sql
SET enable_insert_strict = true;
INSERT INTO test_table ...;
```

## 最大过滤比例（max_filter_ratio）

<!-- 知识类型: 配置参数说明 -->

最大过滤比例（`max_filter_ratio`）是一个重要的导入控制参数，它定义了导入过程中可以容忍的异常数据所占总数据的最大比例：

- 如果实际过滤比例**低于**设定的最大过滤比例，导入任务将继续执行，异常数据会被忽略。
- 如果实际过滤比例**超过**设定的最大过滤比例，导入任务将失败。

### 过滤比例计算方法

导入过程中，数据行被划分为以下三类：

| 类别 | 说明 |
| --- | --- |
| **Filtered Rows** | 因数据质量不合格而被过滤掉的行。数据质量不合格包括类型错误、精度错误、字符串长度超长、文件列数不匹配等数据格式问题，以及因没有对应的分区而被过滤掉的数据行。 |
| **Unselected Rows** | 因 [前置过滤](./load-data-convert.md#前置过滤) 或 [后置过滤](./load-data-convert.md#后置过滤) 条件而被过滤掉的数据行。 |
| **Loaded Rows** | 被正确导入的数据行。 |

过滤比例的计算公式为：

```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```

也就是说，`Unselected Rows` 不会参与过滤比例的计算。

### 设置最大过滤比例

`max_filter_ratio` 默认为 `0`，表示不允许任何异常数据。各种导入方式的设置示例如下：

**Stream Load**

```shell
curl --location-trusted -u user:passwd \
    -H "max_filter_ratio: 0.1" \
    -T data.txt \
    http://host:port/api/example_db/my_table/_stream_load
```

**Broker Load**

```sql
LOAD LABEL example_db.label_1
(
    DATA INFILE("s3://bucket/data.txt")
    INTO TABLE test_table
)
WITH S3 (...)
PROPERTIES
(
    "max_filter_ratio" = "0.1"
);
```

**Routine Load**

```sql
CREATE ROUTINE LOAD example_db.job1 ON test_table
PROPERTIES
(
    "max_filter_ratio" = "0.1"
)
FROM KAFKA (...);
```

**MySQL Load**

```sql
LOAD DATA LOCAL INFILE 'data.txt'
INTO TABLE test_table
PROPERTIES
(
    "max_filter_ratio" = "0.1"
);
```

**Insert Into**

```sql
SET insert_max_filter_ratio = 0.1;
INSERT INTO test_table FROM S3/HDFS/LOCAL();
```

:::tip
对于 Insert Into 语句，`insert_max_filter_ratio` 仅在 `enable_insert_strict = false` 时生效。默认值为 `1.0`，表示允许所有异常数据被过滤。
:::

## 常见问题

<!-- 知识类型: FAQ -->

**Q1：`strict_mode` 与 `max_filter_ratio` 应该如何配合使用？**

- 若要求**严格的数据质量**：开启 `strict_mode = true`，并将 `max_filter_ratio` 设为较小值（如 `0`），任何转换失败都会导致导入失败。
- 若希望**容忍少量脏数据**：关闭 `strict_mode`（或保留默认值），并将 `max_filter_ratio` 设为可接受的比例（如 `0.1`），异常数据会被过滤但不影响整体导入。

**Q2：函数计算得到的 `NULL` 值会被严格模式过滤吗？**

不会。严格模式只针对「原始数据非 NULL，但列类型转换后结果为 NULL」的情况，函数计算得到的 `NULL` 值不属于此范畴。

**Q3：被前置/后置过滤条件过滤的数据是否计入 `max_filter_ratio`？**

不会。`Unselected Rows` 不参与过滤比例计算，过滤比例仅基于 `Filtered Rows` 与 `Loaded Rows`。

**Q4：Insert Into 中 `enable_insert_strict` 与 `insert_max_filter_ratio` 的关系是什么？**

`insert_max_filter_ratio` 仅在 `enable_insert_strict = false` 时生效。其默认值为 `1.0`，表示允许所有异常数据被过滤。

**Q5：`char(10)` 列遇到超长数据时，严格模式与非严格模式的行为差异？**

- 严格模式开启：超长数据被过滤。
- 严格模式关闭：超长数据会被截断后导入（如 `a1234567890` 截断为 `a123456789`）。
