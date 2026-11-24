---
{
    "title": "Avro | 文件格式",
    "language": "zh-CN",
    "description": "介绍 Apache Doris 开发版读取 Avro 对象容器文件的方法，提供查询和导入示例，说明支持的压缩算法、类型映射、Hive Schema 与时间戳兼容规则，以及原生读取路径的使用限制。",
    "sidebar_label": "Avro",
    "keywords": ["Avro", "Avro OCF", "Avro TVF", "Hive Avro", "Iceberg Avro", "Avro Schema 演进"],
    "doc_type": "feature"
}
---

# Avro

## 概述

Doris 可通过文件表函数（TVF）、文件导入、Hive Catalog 和 Iceberg Catalog 读取 Avro **对象容器文件（OCF）**。OCF 内嵌写入 Schema 和压缩算法信息。原始 Avro 消息以及 Confluent Schema Registry 消息格式不属于 OCF 文件。

:::info 开发版说明

本文介绍 [apache/doris#70808](https://github.com/apache/doris/pull/70808) 增加的原生 Avro 读取能力。**所有 FE 和 BE 节点**均须使用包含该变更的构建版本，并保持 `enable_file_scanner_v2 = true`。请勿假定旧版本或尚未完成的滚动升级已具备本文所述能力。

:::

| 使用入口 | Avro 支持范围 |
| --- | --- |
| S3、HDFS 和 Local TVF | 通过 `"format" = "avro"` 读取可随机访问的 OCF 文件。 |
| 文件导入 | Broker Load、上传完整文件的普通 Stream Load、从 TVF 执行 `INSERT INTO ... SELECT`，以及部署环境已提供的 COPY INTO。参阅 [Avro 导入](../../data-operate/import/file-format/avro.md)。 |
| Hive Catalog | 根据表元数据识别 Avro，支持普通表和分区表，但须满足下文的 Schema 和时间戳限制。 |
| Iceberg Catalog | 读取 Avro 数据文件、Equality Delete 和 Position Delete 文件，包括同一快照中混合多种文件格式的场景。 |
| Paimon Catalog | 通过 Paimon SDK 读取 Avro，保留合并和删除语义。下文原生读取路径的类型映射不适用于 Paimon SDK 路径。 |
| 写入 Avro | OUTFILE、EXPORT 和 Catalog 写入均不支持输出 Avro。 |

## 快速开始

### 准备文件

以下示例需要 Python 3 和 `pip`。在 Python 环境中安装 `fastavro`，然后生成包含两条记录的 OCF 文件：

```shell
python3 -m pip install fastavro
python3 - <<'PY'
from fastavro import writer

schema = {
    "type": "record",
    "name": "Example",
    "namespace": "example",
    "fields": [
        {"name": "id", "type": "long"},
        {"name": "label", "type": ["null", "string"], "default": None},
    ],
}
records = [{"id": 1, "label": "alpha"}, {"id": 2, "label": None}]
with open("example.avro", "wb") as output:
    writer(output, schema, records, codec="deflate")
PY
```

将 `example.avro` 上传到 FE 和 BE 节点均可访问的 S3 兼容存储桶。示例使用 `s3://example-bucket/avro/example.avro`；请按实际存储配置替换路径、Endpoint、Region 和凭据。Doris 账号须具备 [S3 TVF](../../sql-manual/sql-functions/table-valued-functions/s3.md) 所要求的权限。

### 查询文件

```sql
SET enable_file_scanner_v2 = true;

SELECT id, label
FROM S3(
    "uri" = "s3://example-bucket/avro/example.avro",
    "s3.endpoint" = "https://s3.example.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<access-key>",
    "s3.secret_key" = "<secret-key>",
    "format" = "avro"
)
ORDER BY id;
```

预期结果：

```text
+----+-------+
| id | label |
+----+-------+
|  1 | alpha |
|  2 | NULL  |
+----+-------+
```

TVF 从内嵌的写入 Schema 推导列名和类型，无需提供 `csv_schema`、独立 Schema 文件或 Schema Registry。

## 参数

| 配置 | 类型 | 默认值 | 是否必需 | 作用 |
| --- | --- | --- | --- | --- |
| TVF `format` | 字符串 | 不会默认选择 Avro | 是 | 设置为 `avro`。存储及认证参数沿用对应 TVF 的配置。 |
| `enable_file_scanner_v2` | 布尔型会话变量 | `true` | 必须启用 | 选择本文要求的读取路径。 |
| OCF `avro.codec` | 文件元数据 | 缺省为 `null` | 无需客户端配置 | 自动选择块压缩算法；不要再用 gzip 或 zstd 包装整个文件。 |

### 支持的压缩算法

| OCF Codec | 含义 |
| --- | --- |
| `null` | 不压缩 |
| `deflate` | Deflate 块压缩 |
| `snappy` | 带 Avro 校验和的 Snappy 块压缩 |
| `zstandard` | Zstandard 块压缩 |

不支持其他 Codec。压缩算法从 OCF 文件头读取，不依赖文件名。

### 类型映射

下表描述原生 TVF 的 Schema 推导结果。Hive 和 Iceberg 除文件解码外，还须遵循各自的 Catalog Schema 和类型映射规则。

| Avro 类型或逻辑类型 | Doris 类型 |
| --- | --- |
| `boolean` | `BOOLEAN` |
| `int`、`long` | `INT`、`BIGINT` |
| `float`、`double` | `FLOAT`、`DOUBLE` |
| `string`、`enum` | `STRING`；枚举返回符号文本 |
| 无已识别逻辑类型注解的 `bytes`、`fixed` | `VARBINARY` |
| `decimal` | `DECIMAL(p,s)`，精度最大为 76；同时受目标类型限制 |
| `uuid` | `UUID` |
| `date` | `DATE` |
| `time-millis`、`time-micros` | `TIME(3)`、`TIME(6)` |
| `timestamp-millis`、`timestamp-micros` | `TIMESTAMPTZ(3)`、`TIMESTAMPTZ(6)`；显示遵循会话时区规则 |
| `local-timestamp-millis`、`local-timestamp-micros` | `DATETIME(3)`、`DATETIME(6)`；保留本地时间字段 |
| `local-timestamp-nanos` | `TIMESTAMP_NS` |
| `record`、`array`、`map` | `STRUCT`、`ARRAY`、`MAP`；普通 Avro Map 的键为字符串 |
| 只有一个非 NULL 分支的可空 Union | 对应的 Doris 可空类型 |
| `null` | 仅包含 NULL 的可空 `STRING` 列 |

不支持表示绝对时间点的 `timestamp-nanos`。它与已支持的本地时间类型 `local-timestamp-nanos` 不同。

## 示例

### 从 HDFS 读取

将同一示例文件复制到 HDFS，按 [HDFS TVF](../../sql-manual/sql-functions/table-valued-functions/hdfs.md) 配置访问权限，并替换 URI 和用户：

```sql
SELECT id, label
FROM HDFS(
    "uri" = "hdfs://namenode.example.com:8020/avro/example.avro",
    "fs.defaultFS" = "hdfs://namenode.example.com:8020",
    "hadoop.username" = "<hdfs-user>",
    "format" = "avro"
)
ORDER BY id;
```

该查询返回与 S3 示例相同的两行结果。[Local TVF](../../sql-manual/sql-functions/table-valued-functions/local.md) 也可通过 `"format" = "avro"` 读取 BE 节点上的文件。

### 读取湖表

配置 [Hive Catalog](../catalogs/hive-catalog.mdx) 或 [Iceberg Catalog](../catalogs/iceberg-catalog.mdx) 后，可通过普通 SQL 查询已有的 Avro 表。Catalog 扫描无需设置 TVF 的 `format` 参数。

例如 Catalog 名为 `hive`，数据库为 `example_db`，且 `example_table` 已包含前述两条示例记录：

```sql
SELECT id, label FROM hive.example_db.example_table ORDER BY id;
```

结果与上文的两行相同。对于 Iceberg，须通过 Iceberg Catalog 保留字段 ID、Schema 演进以及 Equality/Position Delete 语义。通过 TVF 读取单个数据文件不会应用表级删除。已有的 v3 DELETE/MERGE 操作可将 Avro Position Delete 延续到常规 Deletion Vector 输出，但这不意味着支持写入 Avro 文件。

对于 [Paimon Catalog](../catalogs/paimon-catalog.mdx)，Avro 仍通过 SDK 读取。不要通过强制原始文件或原生读取路径绕过 Paimon 的合并语义。

## 限制

### 文件与 Schema 限制

* 输入须为可随机访问、根类型为 Record 的 OCF 文件。本读取路径不支持实时 `http_stream` 或原始 Kafka/Confluent Avro 消息。
* 不支持递归 Record、含多个非 NULL 分支的 Union，以及嵌套过深的 Schema。
* 同级字段名仅大小写不同会被拒绝，此规则也适用于嵌套 Record。
* 零字段的根 Record 可保留行数，但嵌套空 Record 无法表示为 Doris `STRUCT`，因此会被拒绝。
* 不支持通用 Avro 读取 Schema 解析。下述 Hive 规则是受限的兼容约定，不代表支持 Avro 的所有 Schema 演进能力。

### Hive Schema 兼容性

* 支持普通 Hive 列 DDL，以及显式使用 NULL 默认值的生成式可空读取 Schema。按字段名匹配，支持列重排和新增可空列；`hive_orc_use_column_names` 和 `hive_parquet_use_column_names` 不会将 Avro 切换为按位置匹配。
* 显式 `avro.schema.literal` 须符合受支持的生成式 Schema。不支持自定义默认值、别名、命名引用及显式 Record 名称变更。仅通过有效 `avro.schema.url` 提供 Schema 的方式不受支持，Doris 不会获取该 URL。
* 写入类型、读取类型和 Hive 输出类型须兼容。不支持物理类型收窄、仅大小写不同的字段匹配、修改 Decimal 精度/小数位数、中间读取类型与输出类型不一致，以及 Bytes 到 String 的解析转换。不支持 Hive `CHAR`/`VARCHAR` 强制转换；适用时请使用 `STRING`。
* 逻辑类型注解须匹配。Hive 时间戳读取支持 `timestamp-millis`，不能将上文 TVF 的完整时间戳映射范围直接套用于 Hive 表。
* 遵循 Hive 写入端时区和日历元数据。不支持旧式写入端时区转换，也不支持缺少写入端时区元数据且早于 1900 年的时间戳。请先使用兼容的写入工具转换这些文件，再通过本路径读取。

### 错误处理

| 现象 | 处理方法 |
| --- | --- |
| Avro Magic 无效或容器截断 | 确认输入是完整 OCF，而非原始消息或额外压缩后的整个文件。 |
| Codec 或 Schema 不受支持 | 按上文检查压缩算法、类型映射和 Hive 限制，先转换不支持的输入再重试。 |
| 升级后仍提示 Avro 不受支持 | 确认所有 FE 和 BE 均包含该变更，且已启用 FileScannerV2。 |

## 最佳实践

* 需要表级语义时，通过对应 Catalog 查询 Hive、Iceberg 和 Paimon；查询独立文件或准备导入数据时使用 TVF。
* 导入已有 Doris 表之前，先检查推导的 Schema 和样例行，尤其关注 Decimal、二进制、嵌套类型和时间戳。
* Avro 是行式格式，重复分析扫描可考虑 Parquet 或 ORC。过小的 Avro Split 可能增加开销，因为每个 Split 都须通过前序块头定位边界；不要假定 Split 越小性能越好。
