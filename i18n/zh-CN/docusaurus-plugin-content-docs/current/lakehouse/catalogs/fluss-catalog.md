---
{
    "title": "Fluss Catalog",
    "language": "zh-CN",
    "description": "如何在 Apache Doris 中查询 Apache Fluss 表：通过 Fluss Catalog 读取日志表、主键表，并对已分层到 Paimon 的表做 Union Read（湖与日志联合读取），含参数配置与类型映射。",
    "keywords": [
        "Fluss Catalog",
        "Apache Fluss",
        "Doris 查询 Fluss",
        "Union Read",
        "湖与日志联合读取",
        "湖仓分层表",
        "Fluss Paimon",
        "Tiering Service",
        "tbl$lake",
        "tbl$log",
        "fluss.union_read.mode",
        "fluss.bootstrap.servers",
        "fluss.lake.paimon",
        "Fluss 日志表",
        "Fluss 主键表",
        "Fluss 类型映射",
        "流存储",
        "has no readable lake snapshot yet"
    ]
}
---

<!-- 知识类型: 能力定义 + 配置参数 + 性能调优 + 故障排查 -->
<!-- 适用场景: 实时查询 Fluss 表 / 湖与日志 Union Read / 数据集成与联邦查询 -->

Doris 可以通过 Fluss Catalog 读取 [Apache Fluss](https://fluss.apache.org/) 中的表。Fluss 是面向实时分析的流存储系统，表里的数据可以由分层服务（Tiering Service）持续写入 Paimon 数据湖。Doris 既能直接读 Fluss 里的实时数据，也能把 Paimon 里已分层的历史数据和 Fluss 日志里还没分层的增量数据合并成一张表来查，这种读法称为 Union Read。

:::note
- 该功能为实验功能，自 5.0.0 版本开始支持。
- 当前仅支持读取 Fluss 表，不支持写入以及库表管理操作。
- 湖仓分层表的湖端格式目前仅支持 Paimon。
:::

## 适用场景

| 场景 | 说明 |
| --- | --- |
| 实时查询 | 直接查询 Fluss 日志表和主键表中的最新数据。 |
| Union Read | 开启了湖仓分层的表，一次查询同时读 Paimon 湖里已分层的历史数据和 Fluss 日志里尚未分层的增量数据，也就是湖与日志的联合读取。 |
| 数据集成 | 读取 Fluss 数据写入 Doris 内表，或与内表及其他 Catalog 中的表做联邦查询。 |
| 数据写回 | 暂不支持。 |

## 工作原理

<!-- 知识类型: 架构原理 -->

Fluss 的表有三种形态，读法各不相同：

| 表类型 | 读取方式 |
| --- | --- |
| 日志表（Log Table） | 读取 Fluss 的日志，每个 Bucket 生成一个扫描范围。 |
| 主键表（Primary-Key Table） | 读取每个 Bucket 最新的 KV 快照，再叠加快照之后的变更日志，按主键合并出最新状态。 |
| 湖仓分层表（`table.datalake.enabled = true`） | 读取 Paimon 湖中已分层的数据，再叠加分层位点之后的 Fluss 日志，在一次扫描中合并，即 Union Read。 |

湖端部分由 Doris 内置的 Paimon Connector 读取，Fluss Catalog 自己不实现。Fluss 会为每张分层表记录一个可读的 Paimon 快照，Doris 按这个快照读 Paimon 数据，原生的 ORC/Parquet 读取器和文件缓存都能直接用上。

对分层的主键表做 Union Read 时，按主键合并两部分数据。FE 规划时给每个 Bucket 的湖端 Split 带上该 Bucket 日志尾部的位点范围；BE 读湖端数据时，丢掉已经被日志尾部更新或删除的行；日志尾部自己的最新状态再作为单独的扫描范围输出一次。每行数据只输出一次，结果和只从 Fluss 读整张表相同。

## 配置 Catalog

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 创建 Fluss Catalog / 配置 SASL 认证 / 配置 Paimon 湖连接 -->

### 语法

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '<bootstrap_servers>',
    {FlussProperties},
    {LakeProperties},
    {CommonProperties}
);
```

* `<bootstrap_servers>`

    必填。Fluss 集群的引导地址，逗号分隔的 `host:port` 列表，一般填 CoordinatorServer 的地址，如 `'fluss.bootstrap.servers' = '10.0.0.1:9123,10.0.0.2:9123'`。

* `{FlussProperties}`

    FlussProperties 部分用于填写 Fluss Catalog 特有的参数。

    | 参数名 | 必填 | 默认值 | 说明 |
    | --- | --- | --- | --- |
    | `fluss.union_read.mode` | 否 | `auto` | 湖仓分层表的 Union Read 模式，可选 `auto`、`required`、`disabled`。详见【Union Read 模式】。 |
    | `fluss.union_read.max_tail_rows` | 否 | `2000000` | 对主键表做 Union Read 时，单个 Bucket 的日志尾部允许包含的最大行数。详见【Union Read 模式】。 |
    | `fluss.union_read.max_total_tail_rows` | 否 | `20000000` | 对主键表做 Union Read 时，一次扫描涉及的所有 Bucket 的日志尾部允许包含的最大总行数。不能小于 `fluss.union_read.max_tail_rows`。 |
    | `enable.mapping.varbinary` | 否 | `false` | 是否将 Fluss 的 `BINARY`/`BYTES` 类型映射为 Doris 的 `varbinary`。默认映射为 `string`。 |
    | `enable.mapping.timestamp_tz` | 否 | `false` | 是否将 Fluss 的 `TIMESTAMP_LTZ` 类型映射为 Doris 的 `timestamptz`。默认映射为 `datetime`。 |

    除了上面这些 Doris 专用参数和 `fluss.lake.paimon.*`，其他 `fluss.` 前缀的属性都会去掉前缀后原样交给 Fluss 客户端，FE 和 BE 用同一套。Doris 不限制参数名，Fluss 客户端认识的配置项都能这样传。比如 Fluss 集群开了 SASL 认证，可以这样填：

    ```sql
    'fluss.client.security.protocol' = 'sasl',
    'fluss.client.security.sasl.mechanism' = 'PLAIN',
    'fluss.client.security.sasl.username' = '<username>',
    'fluss.client.security.sasl.password' = '<password>'
    ```

    参数列表见 [Fluss 配置文档](https://fluss.apache.org/docs/maintenance/configuration/) 和 [Fluss 认证文档](https://fluss.apache.org/docs/security/authentication/)。

* `{LakeProperties}`

    LakeProperties 部分填写湖仓分层表对应的 Paimon 湖的连接信息，前缀为 `fluss.lake.paimon.`。前缀后面的写法和 Fluss 集群 `server.yaml` 里 `datalake.paimon.*` 的写法一样，可以直接复制过来。详见【湖表连接配置】。

* `{CommonProperties}`

    CommonProperties 部分用于填写通用属性。请参阅[数据目录概述](../catalog-overview.md)中【通用属性】部分。

### 示例

最简配置。只读 Fluss 自身的数据，或者湖所在的存储不需要凭证时，这样就够了：

```sql
CREATE CATALOG fluss PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123'
);
```

Paimon 湖放在对象存储上（以 S3 兼容存储为例）：

```sql
CREATE CATALOG fluss_lake PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123',
    'fluss.lake.paimon.s3.endpoint' = 'http://minio:9000',
    'fluss.lake.paimon.s3.access-key' = '<ak>',
    'fluss.lake.paimon.s3.secret-key' = '<sk>'
);
```

Fluss 集群开启了 SASL 认证：

```sql
CREATE CATALOG fluss_sasl PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123',
    'fluss.client.security.protocol' = 'sasl',
    'fluss.client.security.sasl.mechanism' = 'PLAIN',
    'fluss.client.security.sasl.username' = '<username>',
    'fluss.client.security.sasl.password' = '<password>'
);
```

### 部署要求

- FE 用 Fluss 客户端读元数据、做查询规划，BE 用它读数据。两者都要能访问 Fluss 集群的 CoordinatorServer 和 TabletServer。
- 主键表的 KV 快照和已归档的日志段放在 Fluss 配置的远端存储（`remote.data.dir`）里，BE 会直接读这些文件，因此也要能访问这个远端存储。
- 读湖仓分层表时，FE 和 BE 都要能访问 Paimon 湖所在的存储。
- 湖端数据由 Doris 内置的 Paimon Connector 插件读取，插件随 Doris 一起发布，不用单独安装。

## 依赖的 Fluss 版本

<!-- 知识类型: 版本兼容 -->

| Doris 版本 | Fluss 客户端版本 |
| --- | --- |
| 5.0 | 1.0 |

## 元数据映射

<!-- 知识类型: 行为规则 -->

Fluss 的元数据层级是 Database -> Table，和 Doris 一一对应，没有额外的命名映射。

开启了湖仓分层的表，`SHOW TABLES` 只列出表本身。`tbl$lake` 和 `tbl$log` 是同一张表的两种读法，不会单独出现在列表里。

`SHOW CREATE TABLE` 会列出 Fluss 表的属性，从中能看到表有没有开湖仓分层（`table.datalake.enabled`）和湖格式（`table.datalake.format`）。

## 列类型映射

<!-- 知识类型: 类型参考 -->

| Fluss Type | Doris Type | Comment |
| --- | --- | --- |
| BOOLEAN | boolean | |
| TINYINT | tinyint | |
| SMALLINT | smallint | |
| INT | int | |
| BIGINT | bigint | |
| FLOAT | float | |
| DOUBLE | double | |
| DECIMAL(P, S) | decimal(P, S) | |
| CHAR(N) | char(N) | N 大于 255 时映射为 string |
| STRING | string | |
| BINARY(N) | string / varbinary(N) | 由 `enable.mapping.varbinary` 控制。默认为 `false`，映射为 `string`；为 `true` 时映射为 `varbinary` |
| BYTES | string / varbinary | 同上 |
| DATE | date | |
| TIME | UNSUPPORTED | Doris 没有语义相同的类型。表里其他列照常可以查，只有查到这一列时报错 |
| TIMESTAMP(P) | datetime(P) | 精度大于 6 时映射为 datetime(6)，可能丢失精度 |
| TIMESTAMP_LTZ(P) | datetime(P) / timestamptz(P) | 精度大于 6 时映射为精度 6。由 `enable.mapping.timestamp_tz` 控制。默认为 `false`，映射为 `datetime`；为 `true` 时映射为 `timestamptz` |
| ARRAY | array | |
| MAP | map | |
| ROW | struct | |

> 注：
>
> `TIMESTAMP_LTZ` 列在 `DESCRIBE` 语句的 Extra 列中会显示 `WITH_TIMEZONE`。映射为 `datetime` 时，Doris 会按当前会话时区（`SET time_zone = <tz>`）转换后返回。
>
> 开启了湖仓分层的表，`tbl` 和 `tbl$lake` 的列类型一致。上面的映射规则和 Fluss 写入 Paimon 时的类型转换、Paimon Catalog 的类型映射是对齐的。

## 分区表

<!-- 知识类型: 行为规则 + 使用限制 -->

分区列在 Doris 里就是普通列，`SHOW PARTITIONS` 以 `k1=v1/k2=v2` 的形式列出分区。查询时分区列上的谓词用于分区裁剪，少读一些 Bucket。

Fluss 只在分区名里保存分区值，分区名不允许出现的字符（比如 `.`、`:`）会被替换成 `_`。只有分区值能原样写进分区名的类型，Doris 才能读：

- 支持：`CHAR`、`STRING`、`BOOLEAN`、`TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`DATE`，以及未开启 `enable.mapping.varbinary` 时的 `BINARY`/`BYTES`（分区值为字节的十六进制文本）。
- 不支持：`FLOAT`、`DOUBLE`、`TIME`、`TIMESTAMP`、`TIMESTAMP_LTZ`。这类表可以 `DESCRIBE`，但查询和 `SHOW PARTITIONS` 会报错，错误信息里会指出是哪个分区列。

## 查询操作

<!-- 知识类型: 操作示例 + 行为规则 -->
<!-- 适用场景: 查询 Fluss 表 / 只读湖或只读日志 / 控制 Union Read 模式 -->

### 基础查询

```sql
-- 切换到 Catalog 后查询
SWITCH fluss;
USE db;
SELECT * FROM tbl LIMIT 10;

-- 使用全限定名
SELECT * FROM fluss.db.tbl WHERE dt = '20260101';
```

日志表读到查询规划那一刻为止的全部日志，同一分区里的各个 Bucket 用同一时刻的位点，一次查询看到的是一致的视图。主键表返回每个主键的最新状态，删掉的主键不会出现在结果里。

### 湖仓分层表与 Union Read

对于 `table.datalake.enabled = true` 的表，Doris 提供三种读法。默认读法把湖和日志合在一起读，称为 Union Read：

```sql
SELECT * FROM fluss.db.tbl;         -- Union Read：湖 + 日志合并后的完整数据（默认）
SELECT * FROM fluss.db.`tbl$lake`;  -- 只读 Paimon 湖中已分层的数据
SELECT * FROM fluss.db.`tbl$log`;   -- 只读 Fluss 日志中尚未分层的数据
```

`tbl$lake` 和 `tbl$log` 按数据所在位置划分，互不重叠，合起来就是 `tbl` 的全部数据。名字说的是数据在哪里，不是数据有多新：分层服务停了，`tbl$log` 仍然是还留在日志里的那部分。

**`tbl$lake`**

- 由 Paimon Connector 直接读分层服务写出的 Paimon 表。除了表本身的列，还多出 Fluss 写湖时附加的三个系统列：`__bucket`、`__offset`、`__timestamp`。
- 分层服务还没往湖里提交过数据时，查询报错 `nothing has been tiered`。
- 不支持 Paimon Catalog 的时间旅行和增量查询。

**`tbl$log`**

- 从湖快照对应的日志位点开始读，只返回这个位点之后写入的数据。
- 只支持日志表。主键表在湖快照之后的日志是一段变更流，里面有对湖中已有主键的更新和删除，没法作为一组独立的行返回，查主键表的 `$log` 会报错。
- 表必须已经有可读的湖快照，否则报错。
- 未开启湖仓分层的表没有 `$lake` 和 `$log`。

### Union Read 模式

<!-- 知识类型: 配置参数 + 行为规则 -->
<!-- 适用场景: 控制是否 Union Read / 排查 auto 模式退回只读 Fluss 的原因 -->

查询湖仓分层表本身（即 `SELECT * FROM tbl`）时是否做 Union Read，由 Catalog 属性 `fluss.union_read.mode` 决定：

| 取值 | 行为 |
| --- | --- |
| `auto`（默认） | 有可读的湖快照时做 Union Read；条件不满足时退回为只读 Fluss。 |
| `required` | 必须 Union Read，条件不满足时报错，不退回。 |
| `disabled` | 不做 Union Read，只读 Fluss，不看湖里的数据。 |

会话变量 `fluss_union_read_mode` 可以在单条语句范围内覆盖 Catalog 的设置：

```sql
SET fluss_union_read_mode = 'required';  -- 不允许退回为只读 Fluss，退回时直接报错
SET fluss_union_read_mode = 'disabled';  -- 只从 Fluss 读取
SET fluss_union_read_mode = '';          -- 默认值，跟随 Catalog 的设置
```

Union Read 模式只决定数据从哪条路径读出来，不改变结果：只要 Fluss 里的日志还完整，三种模式返回的行一样。`required` 适合回归测试和排查问题，读取路径不符合预期时直接报错，而不是换条路径把结果读出来。

**`auto` 模式下退回为只读 Fluss 的情形**

| 情形 | 说明 |
| --- | --- |
| 没有可读的湖快照 | 分层服务还没提交过数据，此时全部数据都在日志里。 |
| `key-type` | 主键表的主键列类型在湖端和日志端无法精确比较：`FLOAT`、`DOUBLE`、精度大于 6 的 `TIMESTAMP`/`TIMESTAMP_LTZ`，以及 `TIME`。 |
| `partition-type` | 主键表的分区列不是 `STRING`。湖端 Split 要靠分区值的文本形式匹配到 Fluss 分区，只有 `STRING` 能保证两边写法一致。 |
| `tail-truncated` | 主键表湖快照之后的日志已经被 Fluss 按 TTL 删掉了一部分，日志尾部读不全。 |
| `tail-too-large` | 主键表的日志尾部行数超过了 `fluss.union_read.max_tail_rows` 或 `fluss.union_read.max_total_tail_rows`。 |

主键表退回为只读 Fluss 不丢数据：Fluss 保存着主键表的完整状态，只是用不上湖里的列存文件，读起来慢一些。日志表不同，只读 Fluss 拿到的是 Fluss 日志里还留着的数据，早期日志按 TTL 过期后，结果会比 Union Read 少。已经分层的日志表不建议用 `disabled`。

**日志尾部行数上限**

对主键表做 Union Read 时，BE 要把每个 Bucket 的日志尾部放在内存里：一份是用来过滤湖端数据的主键集合，一份是尾部自己要输出的行。为了限制内存占用，`fluss.union_read.max_tail_rows` 限制单个 Bucket 的尾部行数（默认 200 万行），`fluss.union_read.max_total_tail_rows` 限制一次扫描所有 Bucket 尾部的总行数（默认 2000 万行）。两个上限都在规划阶段按 Fluss 上报的位点检查。正常情况下，日志尾部只是一个 `table.datalake.freshness` 周期内写入的数据，离默认上限很远；碰到上限，多半是分层服务停了或者严重滞后。

**通过 EXPLAIN 确认读取路径**

`EXPLAIN` 输出中的 `flussScan` 行会显示本次查询实际的读取方式：

```text
flussScan: readMode=default, unionRead=yes, lakeSplits=3, suppressedLakeSplits=1, logRanges=0, pkRanges=0, pkTailRanges=1, mode=auto
```

| 字段 | 含义 |
| --- | --- |
| `readMode` | `default` 表示读取整张表，`log` 表示读取的是 `tbl$log`。 |
| `unionRead` | 是否做了 Union Read。 |
| `lakeSplits` | 湖端 Split 数量。 |
| `suppressedLakeSplits` | 其中需要按日志尾部过滤的湖端 Split 数量，仅主键表有。 |
| `logRanges` | 日志表的日志扫描范围数量。 |
| `pkRanges` | 主键表从 Fluss 整体读取（KV 快照 + 变更日志）的 Bucket 数量。 |
| `pkTailRanges` | 主键表 Union Read 时，日志尾部的扫描范围数量。 |
| `mode` | 生效的 Union Read 模式。来自会话变量时带 `(session)` 后缀。 |
| `degraded` | 只在 `auto` 模式退回为只读 Fluss 时出现，值是上表里的退回原因。 |

### 湖表连接配置

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: Paimon 湖在需要凭证的对象存储上 / 覆盖 Fluss 集群上报的湖配置 -->

Fluss 集群会把 `server.yaml` 里的 `datalake.paimon.*` 配置写进每张分层表的属性，Doris 据此构造 Paimon 湖的连接信息。多数情况下 Catalog 里不用再配湖的连接方式。

不过 Fluss 在把表属性返回给客户端之前，会删掉所有名字里含 `key`、`secret` 或 `password` 的配置项。Paimon 湖放在需要凭证的对象存储上时，Doris 拿不到凭证，必须在 Catalog 里用 `fluss.lake.paimon.` 前缀补上：

```sql
CREATE CATALOG fluss PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123',
    'fluss.lake.paimon.s3.endpoint' = 'http://minio:9000',
    'fluss.lake.paimon.s3.access-key' = '<ak>',
    'fluss.lake.paimon.s3.secret-key' = '<sk>'
);
```

前缀后面用 Paimon 自己的参数写法，和 Fluss `server.yaml` 里 `datalake.paimon.` 后面的部分一样，直接复制即可：

| Fluss server.yaml | Doris Catalog 属性 |
| --- | --- |
| `datalake.paimon.warehouse: s3://bucket/lake` | `'fluss.lake.paimon.warehouse' = 's3://bucket/lake'` |
| `datalake.paimon.metastore: filesystem` | `'fluss.lake.paimon.metastore' = 'filesystem'` |
| `datalake.paimon.s3.endpoint: http://minio:9000` | `'fluss.lake.paimon.s3.endpoint' = 'http://minio:9000'` |

覆盖是按 Key 进行的，不是整体替换。Catalog 里指定的 Key 覆盖 Fluss 集群上报的同名配置，没指定的仍然用集群的。只填凭证时，`warehouse`、`metastore` 等仍然来自集群。

其中存储类参数（凭证、Endpoint、Region、寻址方式）不会交给 Paimon Catalog，而是转成 Doris 自己的存储参数名，由 Doris 的存储层统一生效。原因是这些配置要同时给 FE（读 Manifest）和 BE（读数据文件）用，只有走存储层两边才是同一套。对应关系如下：

| Paimon 参数写法 | 对应的 Doris 存储参数 |
| --- | --- |
| `s3.access-key` / `s3.access.key` | `s3.access_key` |
| `s3.secret-key` / `s3.secret.key` | `s3.secret_key` |
| `s3.endpoint` | `s3.endpoint` |
| `s3.region` | `s3.region` |
| `s3.path-style-access` / `s3.path.style.access` | `use_path_style` |
| `fs.oss.accessKeyId` | `oss.access_key` |
| `fs.oss.accessKeySecret` | `oss.secret_key` |
| `fs.oss.endpoint` | `oss.endpoint` |
| `fs.obs.access.key` / `fs.obs.access-key` | `obs.access_key` |
| `fs.obs.secret.key` / `fs.obs.secret-key` | `obs.secret_key` |
| `fs.obs.endpoint` | `obs.endpoint` |

`fluss.lake.paimon.metastore` 支持 `filesystem`（默认）、`hive` 和 `rest`。其余参数，比如 Hive Metastore 地址、REST 认证信息，按 [Paimon Catalog](./paimon-catalog.mdx) 的方式填写。

`ALTER CATALOG` 只能设置属性，不能删除属性。要撤销某个 `fluss.lake.paimon.*` 覆盖，把它设成空字符串，Doris 会重新使用 Fluss 集群上报的配置：

```sql
ALTER CATALOG fluss SET PROPERTIES ('fluss.lake.paimon.warehouse' = '');
```

一个 Fluss Catalog 只按一套湖配置读湖表。Fluss 集群改了 `datalake.paimon.*` 之后，需要执行 `REFRESH CATALOG` 让 Doris 重新加载。

### 查询 Profile

<!-- 知识类型: 性能诊断 -->

一次 Fluss 扫描可能同时在读 Fluss 日志、Paimon 湖、覆盖湖端数据的日志尾部，还要做过滤，所以 Profile 按读取路径和范围类型分别统计耗时和行数，能看出时间花在哪一侧：

```text
TableReader
├── FlussLogReadTime            8s25ms      Fluss 侧（JNI）总耗时
│   ├── FlussPkTailRangeNum          2      只注册本次扫描实际读取的范围类型
│   ├── FlussPkTailRangeReadTime  6s2ms
│   └── FlussLogRowsReturned         2
├── FlussLakeReadTime           8s25ms      Paimon 侧总耗时，包含尾部读取与过滤
│   ├── FlussLakeRangeNum            1
│   ├── FlussLakeSuppressRangeNum    2
│   └── FlussLakeRowsReturned        7      过滤后的行数；加上 SuppressedRows 即为过滤前的行数
├── FlussUnionTailReadTime      5s20ms      每个 Bucket 到 Fluss 的一次往返
└── FlussUnionSuppressTime      16.1us      按 Block 过滤，随湖端行数增长
```

某一侧的总耗时减去它下面各范围类型的耗时，就是初始化这个读取器的开销（JNI 类加载，或 Paimon 读取栈的初始化）。只读日志表的查询，Profile 里不会出现湖和主键相关的计数器。

## 查询性能

<!-- 知识类型: 架构原理 + 性能调优 -->
<!-- 适用场景: 性能调优 / 确认查询走 native reader 还是 JNI -->

BE 读 Fluss 表有两条路径，开销差别很大：

- C++ native reader。BE 直接读 Paimon 湖里的 ORC/Parquet 文件，和 Paimon Catalog 用的是同一套读取器，不经过 JVM，也能用上 Doris 的[文件缓存](../data-cache.md)。
- JNI reader。BE 通过 JNI 调用 Fluss Java SDK 读 Fluss 自身的数据。日志、KV 快照、变更日志都只能这样读，每一批数据都要从 Java 对象转成 Doris 的列式 Block，比 native reader 慢得多。

走哪条路径由扫描范围的类型决定，对应 `EXPLAIN` 中 `flussScan` 行的各个计数：

| 读取内容 | EXPLAIN 计数 | 读取路径 |
| --- | --- | --- |
| 日志表的日志 | `logRanges` | JNI |
| 主键表整体读取（KV 快照 + 变更日志） | `pkRanges` | JNI |
| Union Read 中主键表的日志尾部 | `pkTailRanges` | JNI |
| Union Read 或 `tbl$lake` 中，日志表的湖端 Split | `lakeSplits` | C++ native reader |
| Union Read 或 `tbl$lake` 中，主键表的湖端 Split | `lakeSplits`、`suppressedLakeSplits` | 按 Paimon Catalog 的规则决定，见下文。按日志尾部主键过滤湖端行的动作在 BE 的 C++ 里完成 |

湖端 Split 由 Paimon Connector 规划，走不走 native reader 和查普通 Paimon 表时一样：

- 日志表分层出来的是 Paimon Append 表，Split 都能直接读文件，全部走 native reader。
- 主键表分层出来的是 Paimon 主键表。已经过 compaction、不需要和其他文件合并的 Split 走 native reader；刚写入还没 compaction 的文件，以及多个文件键范围重叠、需要 merge-on-read 的 Split，走 Paimon 的 JNI reader。
- 会话变量 `force_jni_scanner = true` 会让湖端 Split 全部改走 JNI，只在排查问题时使用。

对已分层的表，Union Read 让湖里的那部分（通常是绝大部分数据）走 native reader，只有分层位点之后的少量日志走 JNI。分层越及时（`table.datalake.freshness` 越小），走 JNI 的部分越少，这也是分层表默认采用 Union Read 的原因。几点建议：

- 分析历史数据、对新鲜度要求不高时，直接查 `tbl$lake`，整条路径都是 native reader。
- `fluss.union_read.mode = disabled` 会让整张表改走 JNI，除了排查问题不建议使用。
- `auto` 模式退回为只读 Fluss 时（`EXPLAIN` 里出现 `degraded=`），整张表同样改走了 JNI。主键表要留意 `key-type` 和 `partition-type` 两种情况，它们由表结构决定，得调整建表才能解决。
- 主键表的 Union Read 要为每个 Bucket 额外读一次日志尾部的主键（Profile 里的 `FlussUnionTailReadTime`），尾部越长开销越大。

要确认一条查询实际走了哪条路径，看 `EXPLAIN` 里 `lakeSplits` 与 `logRanges`、`pkRanges`、`pkTailRanges` 的比例，以及 Profile 里 `FlussLakeReadTime` 与 `FlussLogReadTime` 的耗时。

## 使用限制

<!-- 知识类型: 使用限制 -->

- 只读。不支持 `INSERT`、`UPDATE`、`DELETE`，也不支持 `CREATE TABLE`、`DROP TABLE` 这类库表管理操作。
- 湖格式只支持 Paimon。`table.datalake.format` 是其他格式的表，读不了湖端数据。
- Fluss 的 `TIME` 类型映射为 `UNSUPPORTED`，这一列查不了。
- 谓词不下推到 Fluss 和 Paimon 湖端，除分区裁剪外，过滤都由 Doris 读到数据后再做。列裁剪和嵌套类型的子列裁剪都支持。
- 不支持时间旅行和增量查询，`tbl$lake` 也不支持。
- Fluss 只提供表级行数，没有列级统计信息。

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: Paimon 插件缺失 / 对象存储凭证 / 湖快照未就绪 / 湖配置变更 / 分区列类型不支持 -->

1. 查询湖仓分层表时报错 `the paimon connector plugin is not available`

    湖端数据靠 Paimon Connector 插件读取。检查 FE 部署目录下的 `plugins/connector/paimon` 目录是否完整。

2. 查询 `tbl$lake` 或 Union Read 时报错，提示无法访问对象存储

    Fluss 不会下发存储凭证，需要在 Catalog 里用 `fluss.lake.paimon.*` 配上。参见【湖表连接配置】。

3. 报错 `has no readable lake snapshot yet`

    分层服务还没往湖里提交过数据。`required` 模式下这是错误，可以等分层服务提交，或者改用 `auto`。

4. 报错 `is already serving lake tables with a different paimon configuration`

    Catalog 创建之后，Fluss 集群的 `datalake.paimon.*` 配置变了。执行 `REFRESH CATALOG` 重新加载。

5. 报错 `cannot be read: its partition column 'xx' has fluss type TIMESTAMP(3)`

    分区列的类型 Doris 读不了。参见【分区表】。

## 功能调试

<!-- 知识类型: 调试环境 -->

Doris 代码库的 `docker/thirdparties/docker-compose/fluss` 目录有一套回归测试用的 Fluss 环境，包含 Fluss、Flink、Paimon 分层服务和 MinIO，可以照着里面的 README 搭一套来验证功能。

## 参考资料

- [Apache Fluss 官方文档](https://fluss.apache.org/docs/)
- [Fluss Lakehouse Storage](https://fluss.apache.org/docs/maintenance/tiered-storage/lakehouse-storage/)
- [Paimon Catalog](./paimon-catalog.mdx)
