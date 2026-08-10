---
{
    "title": "ADBC Catalog",
    "language": "zh-CN",
    "description": "Doris ADBC Catalog 通过 ADBC 驱动以 Arrow 格式读取 Arrow Flight SQL 等外部数据源，支持多 BE 并行读取、谓词下推和联邦查询。",
    "keywords": [
        "ADBC Catalog",
        "Arrow Database Connectivity",
        "Arrow Flight SQL",
        "ADBC 驱动",
        "driver_url",
        "partitioned_read",
        "并行读取",
        "谓词下推",
        "跨集群联邦查询",
        "Doris 数据集成",
        "ADBC 与 JDBC 区别"
    ]
}
---

<!-- 知识类型: 能力定义 + 配置参考 -->
<!-- 适用场景: 跨集群联邦查询 / 外部数据源接入 / 数据集成 -->

## 概述

ADBC（[Arrow Database Connectivity](https://arrow.apache.org/adbc/)）是 Arrow 生态定义的一套数据库访问接口。**ADBC Catalog 通过 ADBC 驱动访问外部数据源，数据以 Arrow 格式传输，并由多个 BE 节点并行读取。**

与 JDBC Catalog 相比，有两点不同：

- **Arrow 原生传输**：数据以 Arrow 格式在网络上传输并被 Doris 直接读取，无需逐行逐值的格式转换。
- **多 BE 并行读取**：一次扫描会按驱动自身的结果分区（Partition）拆分，由多个 BE 节点同时读取，而不是由单个 BE 节点通过单条连接读取。

:::note
- 该功能为实验功能，自 5.0.0 版本开始支持。
- 当前仅支持读操作，不支持写入外部数据源。
- Doris 不附带任何 ADBC 驱动，驱动库文件需要由用户自行部署到 FE 和所有 BE 节点上。
:::

当前阶段以 Arrow Flight SQL 数据源为目标（包括另一个 Doris 集群），是 [Doris Catalog](./doris-catalog.mdx) 的替代方案。其他数据源只需提供对应的 ADBC 驱动动态库，以及在其 SQL 与 ANSI SQL 存在差异时提供方言实现。

### 与 JDBC Catalog 的区别

| 对比项 | JDBC Catalog | ADBC Catalog |
| --- | --- | --- |
| 数据传输 | 源端数据先转为 JDBC 对象，再逐行逐值转换为 Doris 数据格式 | 数据以 Arrow 格式传输并被直接读取，无需逐行逐值转换 |
| 读取并行度 | 由单个 BE 节点通过单条连接读取 | 按驱动的结果分区拆分，由多个 BE 节点并行读取 |
| 驱动形式 | JDBC 驱动 JAR，可从远程 URL 下载 | ADBC 驱动动态库（`.so`），只能引用本地文件 |
| 写入能力 | 支持写回 | 暂不支持 |

## 适用场景

| 场景 | 说明 |
| --- | --- |
| 数据集成 | 读取外部数据源的数据并写入 Doris 内表，或与内表、其他 Catalog 的表进行联邦查询。数据以 Arrow 格式传输，并由多个 BE 节点并行读取，相比 JDBC 方式可以获得更高性能的数据交互。 |
| 数据写回 | 暂不支持。 |

## 功能概览

<!-- 知识类型: 能力清单 -->

| 功能 | 支持情况 | 说明 |
| --- | --- | --- |
| 元数据访问 | 支持 | `SHOW DATABASES`、`SHOW TABLES`、`DESC`、`SHOW CREATE TABLE` 以及 `information_schema` |
| 数据查询 | 支持 | 对外部表的查询，以及与内表、其他 Catalog 表的 Join、聚合、`ORDER BY`、`UNION` 和子查询 |
| 列裁剪 | 支持 | 只向数据源请求查询实际需要的列 |
| 谓词下推 | 支持 | 将部分标量谓词下推为远端 `WHERE` 条件 |
| `LIMIT` 下推 | 支持 | 在 `WHERE` 条件被完整下推后生效 |
| `COUNT(*)` 优化 | 支持 | 不读取任何列数据 |
| 并行读取 | 支持 | 按驱动的结果分区拆分扫描，由多个 BE 并行读取 |
| 类型映射 | 支持 | 自动映射，包括 `ARRAY`、`MAP`、`STRUCT`、`DECIMAL`、日期和带/不带时区时间戳 |
| 元数据缓存 | 支持 | 默认缓存 10 分钟，可通过 `REFRESH` 语句清除 |
| `SELECT INTO OUTFILE` | 支持 | 可将查询结果导出到文件 |
| 物化视图（MTMV） | 支持 | 可基于 ADBC 表构建和刷新 |
| 写入数据源 | 暂不支持 | `INSERT`、`CREATE TABLE`、`DROP TABLE` 等写操作 |
| 统计信息 | 暂不支持 | 不支持统计信息收集 |
| 聚合下推 | 暂不支持 | 聚合运算由 Doris 完成 |

## 部署 ADBC 驱动

<!-- 知识类型: 部署步骤 -->

Doris 不附带任何 ADBC 驱动，使用前需要先将驱动动态库部署到集群节点上。

### 驱动放置要求

:::caution
FE 在 `CREATE CATALOG` 时会把 `driver_url` 解析为一个绝对路径，并将该路径原样下发给 BE，BE 直接按这个路径加载驱动库。因此：

- 驱动文件必须以**相同的绝对路径**存在于 FE 和**每一个** BE 节点上。
- FE 和所有 BE 必须加载**同一个构建产物**。ADBC 的分区信息使用驱动私有的格式描述，不同驱动实现之间没有互操作保证，混用不同版本的驱动可能不会报错，而是产生错误的读取结果。
:::

编译产物中会自动创建两个驱动放置目录：

- FE：`<FE_HOME>/plugins/adbc_drivers`
- BE：`<BE_HOME>/plugins/adbc_drivers`

由于 FE 和 BE 的部署目录通常不同，这两个目录的绝对路径也不同。因此在多节点部署中，建议在所有 FE 和 BE 节点上使用一个统一的绝对路径存放驱动（例如 `/opt/doris/adbc_drivers`），并通过 FE 的 `adbc.conf` 将 `drivers_dir` 指向该目录。

### adbc.conf

FE 侧的 ADBC 连接器插件配置文件位于 `<DORIS_HOME>/plugins/connector/adbc/adbc.conf`。该文件需要在**每个 FE 节点**上都存在，它不会通过 Doris 元数据同步，修改后需要重启 FE 生效。

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `drivers_dir` | `<DORIS_HOME>/plugins/adbc_drivers` | `driver_url` 中填写的纯文件名所解析的目录。 |
| `driver_secure_path` | `*` | 允许加载驱动的目录白名单，多个目录用分号（`;`）分隔。`*` 或留空表示不限制。设置为具体路径后，驱动路径会按路径分量逐级匹配，路径穿越和前缀混淆（如 `/opt/drv` 与 `/opt/drv-evil`）都无法绕过。 |

配置示例：

```properties
drivers_dir=/opt/doris/adbc_drivers
driver_secure_path=/opt/doris/adbc_drivers
```

## 配置 Catalog

<!-- 知识类型: 配置参数 -->

### 语法

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'adbc',
    'driver_url' = '<driver_url>',
    'uri' = '<connection_uri>',
    {DriverProperties},
    {ConnectionProperties},
    {ReadProperties},
    {DriverOptions},
    {CommonProperties}
);
```

* `<driver_url>`

    必填。ADBC 驱动动态库，**只支持本地引用**，可以填写以下三种形式：

    | 形式 | 说明 |
    | --- | --- |
    | 纯文件名 | 在 `adbc.conf` 的 `drivers_dir` 目录下解析。文件名必须匹配 `[A-Za-z0-9._-]+.so`（允许带版本号后缀，如 `.so.1`），不能包含路径分隔符。 |
    | `file://` URL | 不能带有 authority、query 或 fragment。 |
    | 绝对路径 | FE 和所有 BE 都按该路径加载驱动库。 |

    不支持 `http://` 等远程协议，因为逐节点下载无法保证各节点拿到同一个驱动构建。

* `<connection_uri>`

    必填。ADBC 连接串。

    **必须指向一个确定的远端 Catalog**（例如 `postgresql://host:5432/mydb`），因为 Doris 需要把 ADBC 的三级命名空间映射到自身的两级命名空间。详情可参阅[命名空间映射](#命名空间映射)部分。

* `{DriverProperties}`

    DriverProperties 部分用于填写驱动加载相关的可选属性。

    | 属性名 | 默认值 | 说明 |
    | --- | --- | --- |
    | `driver_checksum` | 不校验 | 驱动库文件的 MD5 值，在 `CREATE CATALOG` 时校验。 |
    | `driver_entrypoint` | 空 | 驱动的入口函数符号名。为空时由驱动自行推断。 |

    `driver_checksum` 用于避免放错驱动版本，或某个节点上是旧副本这类问题。这类问题通常可以正常加载驱动，但会在很久之后表现为一个看起来与驱动文件无关的查询失败。

    :::caution
    `driver_checksum` 只作用于 FE 上的驱动副本，不会校验 BE 上的副本。
    :::

* `{ConnectionProperties}`

    ConnectionProperties 部分用于填写数据源的认证信息，以及生成下推 SQL 时使用的方言。

    | 属性名 | 默认值 | 说明 |
    | --- | --- | --- |
    | `user` | 无 | 用户名。会原样传递给驱动，是否必填取决于数据源。 |
    | `password` | 无 | 密码。会原样传递给驱动，是否必填取决于数据源。 |
    | `sql_dialect` | 自动探测 | 生成下推 SQL 时使用的方言。默认由驱动上报数据源的 Vendor 名称来选择方言，无法识别时使用 `ansi`。 |

    当数据源上报的 Vendor 名称不可用，或其 SQL 与 Vendor 名称暗示的不一致时，可以显式指定 `sql_dialect`。当前内置两种方言：

    | 取值 | 说明 |
    | --- | --- |
    | `ansi` | 标准 SQL。默认值，也是无法识别的数据源所使用的方言。 |
    | `doris` | 与 `ansi` 的唯一区别是标识符使用反引号（`` ` ``）引用。Doris 会把双引号解析为字符串字面量，因此 ANSI 的引用方式在 Doris 数据源上无法解析。Vendor 名称以 `doris` 开头（不区分大小写）的数据源会自动选中该方言。 |

* `{ReadProperties}`

    ReadProperties 部分用于控制并行读取行为。

    | 属性名 | 默认值 | 说明 |
    | --- | --- | --- |
    | `partitioned_read` | `auto` | 并行读取模式。取值非法时直接报错，不会回退到默认值。 |
    | `max_partitions` | `1024` | 一次扫描最多可以规划的分区数。 |

    `partitioned_read` 支持以下三种取值：

    | 取值 | 说明 |
    | --- | --- |
    | `auto` | 默认值。驱动支持分区时拆分扫描，不支持时回退为单条语句读取。 |
    | `disabled` | 从不请求分区。请求分区并非零开销：在 Arrow Flight SQL 数据源上，返回分区的调用**就是**查询的执行，因此会多一次远程交互，并且数据源会在 Doris 决定执行该查询之前就开始工作。当数据源为此付出的代价过高，或其分区 Doris 无法读取时，可以用该值回到单条语句读取的方式。 |
    | `required` | 必须拆分扫描，否则查询报错并说明原因。适用于不允许静默丢失并行度的场景：在 `auto` 下，驱动一旦停止分区，查询仍然会成功，只是悄悄走了回退路径。 |

    `max_partitions` 是防止异常数据源的保护阈值，不是调优参数：每个分区都会占用一定的规划开销，分区过多会耗尽 FE 资源。超过该值时查询直接失败，而不是回退为单条语句读取，因为此时数据源已经执行过该查询，回退会导致它再执行一次。

* `{DriverOptions}`

    DriverOptions 部分用于填写直接传给驱动的选项，需要使用 `adbc.` 前缀。

    :::caution
    **前缀是选项名的一部分，不会被去掉。** ADBC 自身的选项名就以 `adbc.` 开头（例如 `adbc.snowflake.sql.db`），因此在 `CREATE CATALOG` 中需要写成 `adbc.adbc.snowflake.sql.db`。
    :::

    ```sql
    'adbc.adbc.snowflake.sql.db' = 'my_database'
    ```

* `{CommonProperties}`

    CommonProperties 部分用于填写通用属性。请参阅[数据目录概述](../catalog-overview.md)中【通用属性】部分。

    元数据缓存相关的属性请参阅[元数据缓存](#meta-cache)部分。

## 基础示例

<!-- 知识类型: 操作示例 -->

### 访问另一个 Doris 集群

通过 Arrow Flight SQL 驱动访问另一个 Doris 集群，`uri` 指向目标集群 FE 的 Arrow Flight 端口：

```sql
CREATE CATALOG remote_doris PROPERTIES (
    'type' = 'adbc',
    'driver_url' = 'libadbc_driver_flightsql.so',
    'uri' = 'grpc://remote-doris-fe:8070',
    'user' = 'root',
    'password' = '<password>'
);

SELECT id, name FROM remote_doris.some_db.some_table ORDER BY id LIMIT 10;
```

`driver_url` 填写的是纯文件名，会在 `adbc.conf` 的 `drivers_dir` 下解析。

### 使用绝对路径并校验驱动版本

`driver_url` 使用绝对路径引用驱动，并通过 `driver_checksum` 固定 FE 侧的驱动版本：

```sql
CREATE CATALOG remote_source PROPERTIES (
    'type' = 'adbc',
    'driver_url' = '/opt/doris/adbc_drivers/libadbc_driver_flightsql.so',
    'driver_checksum' = 'd41d8cd98f00b204e9800998ecf8427e',
    'uri' = 'grpc+tls://remote-host:8070',
    'user' = 'analyst',
    'password' = '<password>'
);
```

### 显式指定方言并强制并行读取

访问 Doris 数据源时指定 `doris` 方言，并要求扫描必须拆分为分区，避免静默丢失并行度：

```sql
CREATE CATALOG remote_doris_parallel PROPERTIES (
    'type' = 'adbc',
    'driver_url' = 'libadbc_driver_flightsql.so',
    'uri' = 'grpc://remote-doris-fe:8070',
    'user' = 'root',
    'password' = '<password>',
    'sql_dialect' = 'doris',
    'partitioned_read' = 'required',
    'max_partitions' = '256'
);
```

### 关闭并行读取

当数据源为查询开始前的分区请求付出的代价过高时，可以关闭并行读取：

```sql
CREATE CATALOG remote_source_single PROPERTIES (
    'type' = 'adbc',
    'driver_url' = 'libadbc_driver_flightsql.so',
    'uri' = 'grpc://remote-host:8070',
    'user' = 'root',
    'password' = '<password>',
    'partitioned_read' = 'disabled'
);
```

## 命名空间映射

<!-- 知识类型: 行为规则 -->

ADBC 使用三级命名（catalog / db_schema / table），而 Doris 外部表只有两级（database / table）——最外层的名字已经被用户创建的 Catalog 占用。因此：

- `uri` 必须指向一个确定的远端 Catalog。这样两个远端层级中最多只有一个是变化的，无需将两级名字拼接成一个数据库名。
- 远端的 `db_schema` 非空时，Doris 数据库名使用 `db_schema`；否则使用远端 catalog 名。

| 远端 (catalog, db_schema) | Doris 数据库名 |
| --- | --- |
| `mydb`, `public` | `public` |
| `mydb`, 空 | `mydb` |

如果数据源报告的对象既没有 catalog 名也没有 db_schema 名，Doris 无法为其确定数据库名，会直接报错。

如果 `uri` 没有指向确定的远端 Catalog，Doris 会在 `CREATE CATALOG` 时报错，提示在 `uri` 中指定远端 Catalog 名（如 `postgresql://host:5432/mydb`），或通过驱动选项指定。部分驱动不实现相关的查询接口，此时 Doris 会接受该 `uri`，问题会在第一次 `SHOW DATABASES` 时暴露。

## 列类型映射

<!-- 知识类型: 类型参考 -->

Doris 按数据源返回的 Arrow 类型进行映射。

| Arrow 类型 | Doris 类型 | 说明 |
| --- | --- | --- |
| `bool` | `BOOLEAN` | |
| `int8` | `TINYINT` | |
| `int16` | `SMALLINT` | |
| `int32` | `INT` | |
| `int64` | `BIGINT` | |
| `uint8` | `SMALLINT` | 无符号整数提升一级 |
| `uint16` | `INT` | 无符号整数提升一级 |
| `uint32` | `BIGINT` | 无符号整数提升一级 |
| `uint64` | `LARGEINT` | 无符号整数提升一级 |
| `float16`、`float32` | `FLOAT` | |
| `float64` | `DOUBLE` | |
| `decimal128(P,S)` | `DECIMAL(P,S)` | 精度上限为 38，超出则报错 |
| `decimal256(P,S)` | `DECIMAL(P,S)` | 精度上限为 76，超出则报错 |
| `date32(day)` | `DATE` | |
| `date64(ms)` | `DATETIME(3)` | `date64` 带有时间部分，映射为 `DATE` 会丢失时间部分 |
| 无时区 `timestamp(s)` | `DATETIME(0)` | |
| 无时区 `timestamp(ms)` | `DATETIME(3)` | |
| 无时区 `timestamp(us)`、`timestamp(ns)` | `DATETIME(6)` | 纳秒精度截断为微秒 |
| 带时区 `timestamp` | `TIMESTAMPTZ(0-6)` | 精度规则同上。带时区的 Arrow 时间戳表示一个时间点，`DATETIME` 会丢弃时区信息 |
| `utf8`、`large_utf8`、`utf8_view` | `STRING` | |
| `binary`、`large_binary`、`binary_view`、`fixed_size_binary` | `STRING` | 外表路径上 Doris 没有通用的二进制列类型 |
| `list`、`large_list`、`fixed_size_list`、`list_view`、`large_list_view` | `ARRAY` | 元素类型递归映射 |
| `struct` | `STRUCT` | 子字段类型递归映射，**子字段名统一转为小写** |
| `map` | `MAP` | Key 和 Value 类型递归映射 |
| `dictionary` | 按字典值类型映射 | |
| `run_end_encoded` | 按值类型映射 | |
| 其他 | 不支持 | |

:::note
- Doris 没有无符号整数类型，因此无符号类型会提升一级映射。例如 `uint32` 映射为 `BIGINT` 而不是 `INT`，否则超过 2^31 的值会静默回绕为负数。
- 遇到无法映射的类型时，Doris 会在描述表结构时直接报错，并指出具体的列名和 Arrow 类型，而不是映射为一个有损的类型。可以在源端将该列 CAST 为可映射的类型，或在查询中排除该列。
- 从 Doris 数据源读取时，`IPV4` 列会以 `INT` 返回（两端都按 int32 编码），源端的 `DATETIME` 列会以 `TIMESTAMPTZ` 返回。
:::

## 查询操作

<!-- 知识类型: 操作示例 + 行为规则 -->

### 基础查询

配置好 Catalog 后，可以通过以下方式查询 Catalog 中的表数据：

```sql
-- 1. switch to catalog, use database and query
SWITCH adbc_ctl;
USE adbc_db;
SELECT * FROM adbc_tbl LIMIT 10;

-- 2. use adbc database directly
USE adbc_ctl.adbc_db;
SELECT * FROM adbc_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM adbc_ctl.adbc_db.adbc_tbl LIMIT 10;
```

### 元数据操作

```sql
SHOW DATABASES FROM adbc_ctl;

SHOW TABLES FROM adbc_ctl.adbc_db;

DESC adbc_ctl.adbc_db.adbc_tbl;

SHOW CREATE TABLE adbc_ctl.adbc_db.adbc_tbl;
```

数据库列表和表列表始终实时读取，因此在数据源上新建的表无需执行任何 `REFRESH` 即可看到。表结构（Schema）会被缓存，详见[元数据缓存](#meta-cache)。

:::note
数据源上的视图不会作为表列出。
:::

### 数据集成

可以将外部数据源的数据写入 Doris 内表：

```sql
INSERT INTO internal.demo.local_tbl
SELECT * FROM adbc_ctl.adbc_db.adbc_tbl;
```

也支持与内表、其他 Catalog 的表进行联邦查询，以及 `SELECT ... INTO OUTFILE` 和基于 ADBC 表构建物化视图（MTMV）。

### 列裁剪

Doris 只向数据源请求查询实际需要的列，生成的远端 SQL 中不会包含未使用的列。

### 谓词下推

以下谓词会被转换为远端 SQL 的 `WHERE` 条件：

| 类别 | 支持的形式 |
| --- | --- |
| 比较 | `=`、`!=`、`<`、`<=`、`>`、`>=` |
| 空值判断 | `IS NULL`、`IS NOT NULL` |
| 集合 | `IN`、`NOT IN` |
| 逻辑运算 | 由上述谓词组成的 `AND`、`OR`、`NOT` |

函数调用、算术表达式、`LIKE`、`BETWEEN` 等形式不会下推，仍由 Doris 计算。

顶层的每个 `AND` 条件按「全部下推或全部不下推」处理。**Doris 无论如何都会重新计算所有谓词**，因此谓词下推只影响性能，不会改变查询结果。

### LIMIT 下推

只有在整个 `WHERE` 条件都被下推之后，`LIMIT` 才会下推，避免数据源在 Doris 仍需应用的过滤条件之前就截断结果。

### COUNT(*) 优化

`COUNT(*)` 不会从数据源读取任何列数据。

### 查看生成的远端 SQL

可以通过 `EXPLAIN` 查看实际发送给数据源的 SQL 语句：

```sql
EXPLAIN
SELECT id, name
FROM adbc_ctl.adbc_db.adbc_tbl
WHERE id > 100 AND name IS NOT NULL
LIMIT 10;
```

输出中的 `QUERY:` 行即为下推后的远端语句，其中的列与实际扫描请求的列一致。

:::tip
在 Arrow Flight SQL 数据源上，请求分区的调用本身就是查询的执行。因此对 ADBC 表执行 `EXPLAIN` 时，Doris 不会向数据源请求分区，也就不会触发数据源真正执行这条查询。
:::

### 并行读取

`partitioned_read` 为 `auto`（默认）或 `required` 时，Doris 会请求驱动将一次扫描拆分为多个结果分区，每个分区由一个 BE 节点读取，多个 BE 节点并行工作。

数据源无法分区时：

- `auto`：回退为单条语句读取，由一个 BE 完成。
- `required`：查询失败并说明原因。

分区数超过 `max_partitions` 时查询直接失败。

## 元数据缓存 {#meta-cache}

<!-- 知识类型: 配置参数 + 使用建议 -->

为了提升访问外部数据源的性能，Doris 会缓存 ADBC Catalog 的部分元数据，包括数据库名解析、表名解析和表结构（Schema）。

数据库列表和表列表**不做缓存**，始终实时读取，因此数据源上新建的表无需 `REFRESH` 即可访问。

### 缓存属性配置 {#meta-cache-unified-model}

ADBC Catalog 的元数据缓存使用统一键 `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity}` 配置。

| 属性 | 默认值 | 含义 |
| --- | --- | --- |
| `meta.cache.adbc.metadata.enable` | `true` | 是否启用元数据缓存。 |
| `meta.cache.adbc.metadata.ttl-second` | `600` | `0` 表示关闭缓存（即刻生效，可用于查看最新元数据）；`-1` 表示永不过期；其他正整数表示按访问时间计算的 TTL（秒）。 |
| `meta.cache.adbc.metadata.capacity` | `1000` | 最大缓存条目数。`0` 表示关闭。 |

**生效逻辑说明：** 只有当 `enable=true` 且 `ttl-second != 0` 且 `capacity > 0` 时，缓存才会生效。

:::tip
默认 TTL 为 10 分钟，明显低于其他 Catalog 的默认值。ADBC 数据源是另一个在线数据库，其表结构随时可能被其他人的 DDL 修改，且不会通知 Doris。该值决定了忘记执行 `REFRESH` 的用户最长会看到多久的旧表结构。
:::

### 缓存模块 {#meta-cache-unified-modules}

数据库解析、表名解析和表结构共用同一组配置：它们被一起读取、一起失效，描述的是同一件事——远端数据源的结构。

| 模块 (`<entry>`) | 属性键前缀 | 缓存内容与影响 |
| --- | --- | --- |
| `metadata` | `meta.cache.adbc.metadata.` | 缓存数据库名解析、表名解析和表结构。影响：源端列新增、删除、类型变更在 Doris 中的可见性。 |

### 手动刷新

以下语句都会清除对应范围的缓存：

```sql
REFRESH CATALOG adbc_ctl;
REFRESH DATABASE adbc_ctl.adbc_db;
REFRESH TABLE adbc_ctl.adbc_db.adbc_tbl;
```

### 最佳实践 {#meta-cache-best-practices}

* **实时查看最新元数据**：如果希望每次查询都读取数据源的最新表结构，可以将 `ttl-second` 设置为 `0`：

  ```sql
  ALTER CATALOG adbc_ctl SET PROPERTIES ("meta.cache.adbc.metadata.ttl-second" = "0");
  ```

* **表结构变更频繁的数据源**：适当调低 `ttl-second`，或在已知发生变更后执行 `REFRESH`。

### 可观测性 {#meta-cache-unified-observability}

可以通过 `information_schema.catalog_meta_cache_statistics` 系统表观测缓存指标：

```sql
SELECT catalog_name, engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'adbc_ctl' AND engine_name = 'adbc'
ORDER BY entry_name;
```

该系统表文档见：[catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md)。

:::caution
ADBC 连接使用 Catalog 中配置的固定身份访问数据源，与发起查询的 Doris 用户无关，因此缓存条目在所有用户之间共享。
:::

## 使用限制

<!-- 知识类型: 使用限制 -->

- **只读**：不支持 `INSERT`、`CREATE TABLE`、`DROP TABLE` 等针对数据源的写操作。
- 不支持统计信息收集和聚合下推。
- 数据源上的视图不会作为表列出。
- `driver_checksum` 只校验 FE 上的驱动副本，不会校验 BE 上的副本，FE 与 BE 的驱动文件之间也不会相互比对。
- `driver_url` 只接受本地引用，不支持从远程 URL 下载驱动。
- 从 Doris 数据源读取时，`IPV4` 列会以 `INT` 返回，源端的 `DATETIME` 列会以 `TIMESTAMPTZ` 返回。

## 附录

### FAQ

<!-- 知识类型: 故障排查 -->

| 现象 / 报错 | 原因 | 处理方法 |
| --- | --- | --- |
| `Driver file not found` | FE 无法在解析出的路径上找到驱动文件。 | 检查 `driver_url` 填写的纯文件名是否位于 `adbc.conf` 的 `drivers_dir` 目录下；使用绝对路径或 `file://` URL 时，检查该路径在 FE 节点上是否存在且可读。 |
| `Driver path does not match any path allowed by driver_secure_path` | 驱动路径不在 `adbc.conf` 的 `driver_secure_path` 白名单内。 | 将驱动移动到白名单目录下，或调整 `driver_secure_path` 配置后重启 FE。 |
| `scheme 'xxx' is not supported, only a local file is` | `driver_url` 使用了 `http://` 等远程协议。 | ADBC 驱动不支持逐节点下载。请将驱动文件放置到 FE 和所有 BE 上，并通过纯文件名、绝对路径或 `file://` URL 引用。 |
| `The ADBC source reports no current catalog, so 'uri' does not pin one` | `uri` 没有指向一个确定的远端 Catalog。 | 在 `uri` 中指定远端 Catalog 名（如 `postgresql://host:5432/mydb`），或通过 `adbc.` 前缀的驱动选项指定。 |
| 查询报错提示某列的 Arrow 类型没有对应的 Doris 类型 | 该列的类型当前不支持映射。 | 在数据源侧将该列 CAST 为可映射的类型，或在查询中排除该列（不要使用 `SELECT *`）。 |
| 查询结果异常，但没有报错 | FE 和 BE 上的驱动文件可能不是同一个构建产物。ADBC 的分区信息使用驱动私有的格式描述，不同实现之间可能会错误解析而不报错。 | 通过 `driver_checksum` 固定 FE 侧的驱动版本，并人工核对各 BE 上驱动文件的 MD5。 |
| 远端 SQL 报语法错误 | 数据源的 SQL 方言与当前使用的方言不匹配。 | 通过 `sql_dialect` 显式指定方言，例如访问 Doris 数据源时指定 `'sql_dialect' = 'doris'`。 |
