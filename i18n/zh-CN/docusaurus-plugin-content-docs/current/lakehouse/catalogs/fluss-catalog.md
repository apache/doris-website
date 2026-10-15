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
        "has no readable lake snapshot yet",
        "enable_jni_heap_admission",
        "Java heap space"
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

    FE 和 BE 的 Fluss 客户端配置只有一处不同：网络线程数。BE 上的每个 Fluss 连接同一时间只服务一个扫描范围，所以 Catalog 没有设置 `fluss.netty.client.num-network-threads` 时，BE 的连接只开 1 个网络线程，以节省 BE 上的线程和文件句柄；FE 的连接仍用 Fluss 客户端的默认值。一般不需要设置这个参数，设置之后 FE 和 BE 都用设置的值。

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
- BE 会复用到 Fluss 集群的连接：一个扫描范围读完后，连接留给后面的扫描范围和查询接着用，空闲超过 60 秒才关闭。所以查询结束后，Fluss 一侧仍能看到来自 BE 的连接。连接按客户端配置区分，修改 Catalog 属性（比如 SASL 用户名和密码）之后，BE 会按新配置建立新连接。
- 主键表的 KV 快照和已归档的日志段放在 Fluss 配置的远端存储（`remote.data.dir`）里，BE 会直接读这些文件，因此也要能访问这个远端存储。
- 读湖仓分层表时，FE 和 BE 都要能访问 Paimon 湖所在的存储。
- 湖端数据由 Doris 内置的 Paimon Connector 插件读取，插件随 Doris 一起发布，不用单独安装。

## 依赖的 Fluss 版本

<!-- 知识类型: 版本兼容 -->

| Doris 版本 | Fluss 客户端版本 |
| --- | --- |
| 5.0 | 1.0 |

不支持 1.0 之前的 Fluss 集群：Doris 依赖的客户端接口从 Fluss 1.0 才开始提供。

## 元数据映射

<!-- 知识类型: 行为规则 -->

Fluss 的元数据层级是 Database -> Table，和 Doris 一一对应，没有额外的命名映射。

开启了湖仓分层的表，`SHOW TABLES` 只列出表本身。`tbl$lake` 和 `tbl$log` 是同一张表的两种读法，不会单独出现在列表里。

`SHOW CREATE TABLE` 会显示 Fluss 表的列和注释，但不包含表属性。要确认表有没有开湖仓分层（`table.datalake.enabled`）、用的是哪种湖格式（`table.datalake.format`），需要到 Fluss 一侧查看表定义，比如在 Flink SQL 里查看。在 Doris 里，只有开启了湖仓分层的表才有 `tbl$lake` 和 `tbl$log`。

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

- 由 Paimon Connector 直接读分层服务写出的 Paimon 表。由 Fluss 1.0 分层的表，`tbl$lake` 的列和 `tbl` 完全相同。早期 Fluss 版本给湖表附加的 `__bucket`、`__offset`、`__timestamp` 三个系统列已经没有了。
- 按 Fluss 记录的可读湖快照读湖；还没有可读湖快照时，读湖表的最新状态。Fluss 创建表时就会建好对应的 Paimon 表，所以分层服务提交数据之前，查 `tbl$lake` 返回空结果，不会报错。
- Doris 按当前的湖连接配置找不到湖表时，查询报错 `nothing has been tiered`。这通常说明 `fluss.lake.paimon.warehouse` 等配置没有指向 Fluss 集群实际写入的仓库。参见【湖表连接配置】。
- 不支持 Paimon Catalog 的时间旅行和增量查询。

**`tbl$log`**

- 从湖快照对应的日志位点开始读，只返回这个位点之后写入的数据。
- 只支持日志表。主键表在湖快照之后的日志是一段变更流，里面有对湖中已有主键的更新和删除，没法作为一组独立的行返回，查主键表的 `$log` 会报错。
- 表必须已经有可读的湖快照，否则报错。
- 未开启湖仓分层的表没有 `$lake` 和 `$log`。

### Union Read 模式

<!-- 知识类型: 配置参数 + 行为规则 -->
<!-- 适用场景: 控制是否 Union Read / 排查 auto 模式退回的原因 -->

查询湖仓分层表本身（即 `SELECT * FROM tbl`）时是否做 Union Read，由 Catalog 属性 `fluss.union_read.mode` 决定：

| 取值 | 行为 |
| --- | --- |
| `auto`（默认） | 有可读的湖快照时做 Union Read；条件不满足时退回为从 Fluss 读取，不报错。具体情形见下文。 |
| `required` | 必须 Union Read，条件不满足时报错，不退回。 |
| `disabled` | 不做 Union Read，只读 Fluss 里当前的数据，不看湖里的数据，只存在于湖里的分区也读不到。 |

会话变量 `fluss_union_read_mode` 可以在当前会话内覆盖 Catalog 的设置：

```sql
SET fluss_union_read_mode = 'required';  -- 不允许退回为只读 Fluss，退回时直接报错
SET fluss_union_read_mode = 'disabled';  -- 只从 Fluss 读取
SET fluss_union_read_mode = '';          -- 默认值，跟随 Catalog 的设置
```

只想对单条语句生效时，用 `SET_VAR` Hint：

```sql
SELECT /*+ SET_VAR(fluss_union_read_mode='required') */ * FROM fluss.db.tbl;
```

Union Read 模式决定数据从哪条路径读出来。只要 Fluss 里还保留着表的全部数据，也就是没有日志按 TTL 过期，也没有分区已经从 Fluss 删掉而湖里还留着，三种模式返回的行就是一样的。`required` 适合回归测试和排查问题，读取路径不符合预期时直接报错，而不是换条路径把结果读出来。

**`auto` 模式下的退回情形**

| 情形 | 说明 |
| --- | --- |
| 没有可读的湖快照 | 分层服务还没提交过数据，此时全部数据都在 Fluss 里，整张表只从 Fluss 读取。 |
| `key-type` | 主键表的某个主键列（分区列除外）是湖端和日志端无法精确比较的类型：`FLOAT`、`DOUBLE`、`TIME`、精度大于 6 的 `TIMESTAMP`，以及 `TIMESTAMP_LTZ`。`enable.mapping.timestamp_tz` 为 `false`（默认）时，任意精度的 `TIMESTAMP_LTZ` 列都属于这种情况，因为在夏令时回拨的重叠时段里，两个不同的时刻会对应同一个本地时间；为 `true` 时，只有精度大于 6 的才属于这种情况。 |
| `partition-type` | 主键表的分区列不是 `STRING`。湖端 Split 要靠分区值的文本形式匹配到 Fluss 分区，只有 `STRING` 能保证两边写法一致。 |
| `tail-truncated` | 主键表湖快照之后的日志已经被 Fluss 按 TTL 删掉了一部分，日志尾部读不全。 |
| `tail-too-large` | 主键表的日志尾部行数超过了 `fluss.union_read.max_tail_rows` 或 `fluss.union_read.max_total_tail_rows`。 |

后四种情形只针对主键表，`EXPLAIN` 会在 `degraded` 字段里给出原因。主键表退回时，Fluss 里还在的分区从 Fluss 完整读取，不丢数据，因为 Fluss 保存着这些分区的完整状态，只是这部分用不上湖里的列存文件，读起来慢一些；已经从 Fluss 删掉、但湖里还留着的分区（比如因分区过期被删），仍然从湖里读。未分区的表整张从 Fluss 读取。

`partition-type` 情形下，Doris 没法可靠地判断湖端 Split 属于哪个 Fluss 分区。如果湖里有 Fluss 已经没有的分区，或者某个分区值在两边的写法不同，查询会报错 `cannot be matched safely to a live fluss partition`，不会退回。这时可以把 Union Read 模式设为 `disabled`，只读 Fluss 里的数据。

日志表不同，只读 Fluss 拿到的是 Fluss 日志里还留着的数据，早期日志按 TTL 过期后，结果会比 Union Read 少。已经分层的日志表不建议用 `disabled`。日志尾部不完整时，日志表也不会退回：湖快照之后的日志如果已经过期了一部分，`auto` 和 `required` 模式下的 Union Read 都会报错 `Part of the log tail has expired`，查询 `tbl$log` 在任何模式下也会报这个错。可以等 Fluss 发布更新的可读湖快照。

**日志尾部行数上限**

对主键表做 Union Read 时，BE 要把每个 Bucket 的日志尾部放在内存里：一份是用来过滤湖端数据的主键集合，一份是尾部自己要输出的行。为了限制内存占用，`fluss.union_read.max_tail_rows` 限制单个 Bucket 的尾部行数（默认 200 万行），`fluss.union_read.max_total_tail_rows` 限制一次扫描所有 Bucket 尾部的总行数（默认 2000 万行）。两个上限都在规划阶段按 Fluss 上报的位点检查。正常情况下，日志尾部只是一个 `table.datalake.freshness` 周期内写入的数据，离默认上限很远；碰到上限，多半是分层服务停了或者严重滞后。尾部要输出的行放在 BE 的 JVM 堆里，调大这两个上限之前，先确认 JVM 堆够用，参见【BE JVM 堆内存】。

**通过 EXPLAIN 确认读取路径**

`EXPLAIN` 输出中的 `flussScan` 行会显示本次查询实际的读取方式：

```text
flussScan: readMode=default, unionRead=yes, lakeSplits=3, suppressedLakeSplits=1, logRanges=0, pkRanges=0, pkTailRanges=1, mode=auto
```

| 字段 | 含义 |
| --- | --- |
| `readMode` | `default` 表示读取整张表，`log` 表示读取的是 `tbl$log`。 |
| `unionRead` | 是否做了 Union Read。查 `tbl$log` 时也是 `yes`，因为它的起始位点来自湖快照，此时 `lakeSplits` 为 0。 |
| `lakeSplits` | 湖端 Split 数量。 |
| `suppressedLakeSplits` | 其中需要按日志尾部过滤的湖端 Split 数量，仅主键表有。 |
| `logRanges` | 日志表的日志扫描范围数量。 |
| `pkRanges` | 主键表从 Fluss 整体读取（KV 快照 + 变更日志）的 Bucket 数量。 |
| `pkTailRanges` | 主键表 Union Read 时，日志尾部的扫描范围数量。 |
| `mode` | 生效的 Union Read 模式。来自会话变量时带 `(session)` 后缀。 |
| `degraded` | 只在 `auto` 模式下主键表退回时出现，值是上表中的 `key-type`、`partition-type`、`tail-truncated`、`tail-too-large` 之一。没有可读湖快照的情形不在这里体现，只表现为 `unionRead=no`。只存在于湖里的分区仍从湖里读时，`unionRead=yes` 和 `degraded` 会同时出现。 |

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

其中存储类参数（凭证、会话令牌、Endpoint、Region、寻址方式，以及 Hadoop 相关配置）不会交给 Paimon Catalog，而是转成 Doris 自己的存储参数名，由 Doris 的存储层统一生效。原因是这些配置要同时给 FE（读 Manifest）和 BE（读数据文件）用，只有走存储层两边才是同一套。对应关系如下：

| Paimon 参数写法 | 对应的 Doris 存储参数 |
| --- | --- |
| `s3.access-key` / `s3.access.key` / `fs.s3a.access.key` | `s3.access_key` |
| `s3.secret-key` / `s3.secret.key` / `fs.s3a.secret.key` | `s3.secret_key` |
| `s3.session-token` / `s3.session.token` / `fs.s3a.session.token` | `s3.session_token` |
| `s3.endpoint` / `fs.s3a.endpoint` | `s3.endpoint` |
| `s3.region` / `fs.s3a.endpoint.region` | `s3.region` |
| `s3.path-style-access` / `s3.path.style.access` / `fs.s3a.path.style.access` | `use_path_style` |
| `fs.oss.accessKeyId` | `oss.access_key` |
| `fs.oss.accessKeySecret` | `oss.secret_key` |
| `fs.oss.endpoint` | `oss.endpoint` |
| `fs.obs.access.key` / `fs.obs.access-key` | `obs.access_key` |
| `fs.obs.secret.key` / `fs.obs.secret-key` | `obs.secret_key` |
| `fs.obs.endpoint` | `obs.endpoint` |

其他以 `fs.`、`dfs.`、`hadoop.` 开头的参数，比如 HDFS HA、Kerberos 相关配置，也交给 Doris 的存储层，参数名保持原样。

`fluss.lake.paimon.metastore` 支持 `filesystem`（默认）、`hive` 和 `rest`。其余参数，比如 Hive Metastore 地址、REST 认证信息，按 [Paimon Catalog](./paimon-catalog.mdx) 的方式填写。

`ALTER CATALOG` 只能设置属性，不能删除属性。要撤销某个 `fluss.lake.paimon.*` 覆盖，把它设成空字符串，Doris 会重新使用 Fluss 集群上报的配置：

```sql
ALTER CATALOG fluss SET PROPERTIES ('fluss.lake.paimon.warehouse' = '');
```

一个 Fluss Catalog 只按一套湖配置读湖表。Fluss 集群改了 `datalake.paimon.*` 之后，需要删除并重新创建 Catalog，Doris 才会用上新的配置。`REFRESH CATALOG` 只清理元数据缓存，不会重新加载湖配置。

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
│   └── FlussLakeRowsReturned        7      过滤后的行数；加上 FlussUnionSuppressedRows 即为过滤前的行数
├── FlussUnionTailReadTime      5s20ms      每个 Bucket 到 Fluss 的一次往返
└── FlussUnionSuppressTime      16.1us      按 Block 过滤，随湖端行数增长
```

某一侧的总耗时减去它下面各范围类型的耗时，就是初始化这个读取器的开销（JNI 类加载，或 Paimon 读取栈的初始化）。只读日志表的查询，Profile 里不会出现湖和主键相关的计数器。

读了湖端 Split 的扫描，`TableReader` 下还有下面几个计数器，对主键表做 Union Read 时才有实际数值：

| 计数器 | 含义 |
| --- | --- |
| `FlussUnionSuppressedRows` | 因为被日志尾部更新或删除而丢掉的湖端行数。 |
| `FlussUnionTailKeysRead` | 从日志尾部读到的变更日志记录数。 |
| `FlussUnionTailKeysRetained` | 为过滤湖端行而留在内存里的不重复主键数。 |
| `FlussUnionTailCacheHitCount` | 直接复用已读过的日志尾部的湖端 Split 数。同一 BE 上，同一 Bucket 的湖端 Split 共用读过的日志尾部。 |

从 Fluss 读取的部分由 JNI 读取器完成，它的计数器在 `TableReader` 下的 `fluss` 节点里，只出现在 Profile 的 DetailProfile 部分。其中下面几个和连接、JVM 堆有关：

| 计数器 | 含义 |
| --- | --- |
| `FlussJniConnectionsOpened` | 读取时新建的 Fluss 连接数。BE 会复用空闲的连接，紧接着重复执行的查询通常为 0。 |
| `JvmHeapDeclaredBytes` | 开启 JNI 堆准入后，读取器声明会占用的 JVM 堆内存。只有主键表整体读取和主键表 Union Read 的日志尾部会声明，其他读取为 0。参见【BE JVM 堆内存】。 |
| `JvmHeapWaitTime` | 开启 JNI 堆准入后，读取器排队等待 JVM 堆额度的时间。参见【BE JVM 堆内存】。 |

湖端 Split 走 Paimon JNI 读取时，同名的 JVM 堆计数器在 `paimon` 节点里。

## 查询性能

<!-- 知识类型: 架构原理 + 性能调优 -->
<!-- 适用场景: 性能调优 / 确认查询走 native reader 还是 JNI -->

BE 读 Fluss 表有两条路径，开销差别很大：

- C++ native reader。BE 直接读 Paimon 湖里的 ORC/Parquet 文件，和 Paimon Catalog 用的是同一套读取器，不经过 JVM，也能用上 Doris 的[文件缓存](../data-cache.md)。
- JNI reader。BE 通过 JNI 调用 Fluss Java SDK 读 Fluss 自身的数据。日志、KV 快照、变更日志都只能这样读，每一批数据都要从 Java 对象转成 Doris 的列式 Block，比 native reader 慢得多。有些读取还要占用较多的 JVM 堆内存，参见【BE JVM 堆内存】。

走哪条路径由扫描范围的类型决定，对应 `EXPLAIN` 中 `flussScan` 行的各个计数：

| 读取内容 | EXPLAIN 计数 | 读取路径 |
| --- | --- | --- |
| 日志表的日志 | `logRanges` | JNI |
| 主键表整体读取（KV 快照 + 变更日志） | `pkRanges` | JNI |
| Union Read 中主键表的日志尾部 | `pkTailRanges` | JNI |
| Union Read 中日志表的湖端 Split | `lakeSplits` | C++ native reader |
| Union Read 中主键表的湖端 Split | `lakeSplits`、`suppressedLakeSplits` | 按 Paimon Catalog 的规则决定，见下文。按日志尾部主键过滤湖端行的动作在 BE 的 C++ 里完成 |

`tbl$lake` 直接由 Paimon Connector 规划，`EXPLAIN` 里没有 `flussScan` 行，显示的是 `paimonNativeReadSplits=N/M`，表示 M 个 Split 中有 N 个走 native reader；它的 Profile 里也没有 Fluss 的计数器。

湖端 Split 由 Paimon Connector 规划，走不走 native reader 和查普通 Paimon 表时一样：

- 日志表分层出来的是 Paimon Append 表，Split 都能直接读文件，全部走 native reader。
- 主键表分层出来的是 Paimon 主键表。已经过 compaction、不需要和其他文件合并的 Split 走 native reader；刚写入还没 compaction 的文件，以及多个文件键范围重叠、需要 merge-on-read 的 Split，走 Paimon 的 JNI reader。
- 会话变量 `force_jni_scanner = true` 会让湖端 Split 全部改走 JNI，只在排查问题时使用。

对已分层的表，Union Read 让湖里的那部分（通常是绝大部分数据）走 native reader，只有分层位点之后的少量日志走 JNI。分层越及时（`table.datalake.freshness` 越小），走 JNI 的部分越少，这也是分层表默认采用 Union Read 的原因。几点建议：

- 分析历史数据、对新鲜度要求不高时，直接查 `tbl$lake`，完全不读 Fluss 日志：日志表全程走 native reader，主键表按上面的 Paimon 规则决定。
- `fluss.union_read.mode = disabled` 会让整张表改走 JNI，除了排查问题不建议使用。
- `auto` 模式退回时（`EXPLAIN` 里出现 `degraded=`），从 Fluss 读取的部分同样走 JNI，只有只存在于湖里的分区仍从湖里读。要留意 `key-type` 和 `partition-type` 两种情况，它们由表结构决定，得调整建表才能解决。
- 主键表的 Union Read 要在每个 BE 上为每个 Bucket 额外读一次日志尾部的主键（Profile 里的 `FlussUnionTailReadTime`），同一 BE 上这个 Bucket 的其他湖端 Split 直接复用。尾部越长，开销越大。

要确认一条查询实际走了哪条路径，看 `EXPLAIN` 里 `lakeSplits` 与 `logRanges`、`pkRanges`、`pkTailRanges` 的比例，以及 Profile 里 `FlussLakeReadTime` 与 `FlussLogReadTime` 的耗时。

## BE JVM 堆内存

<!-- 知识类型: 资源规划 + 配置参数 + 故障排查 -->
<!-- 适用场景: 查询主键表报 OutOfMemoryError / 规划 BE 的 JVM 堆大小 / 开启 JNI 堆准入 -->

BE 通过 JNI 读 Fluss 自身的数据，湖端需要合并的 Paimon Split 也走 JNI（见【查询性能】）。这些读取器都运行在 BE 内嵌的 JVM 里，和其他 Catalog 的 JNI 读取、Java UDF 共用一个堆。堆的上限由 `be.conf` 中 `JAVA_OPTS_FOR_JDK_17` 的 `-Xmx` 决定，默认 2 GB（`-Xmx2048m`）。

大部分读取边读边输出，只占几 MB 堆内存，比如日志表的日志。下面三种读取不一样，返回第一批数据之前就要把一部分数据放进堆里，一直占到读取结束：

| 读取内容 | 堆内存占用 |
| --- | --- |
| 主键表从 Fluss 整体读取（`EXPLAIN` 中的 `pkRanges`） | 把 Bucket 最新 KV 快照之后的变更日志放进内存，按主键合并。快照之后的变更越多，占用越大。 |
| 主键表 Union Read 的日志尾部（`pkTailRanges`） | 保留尾部里每个主键的最新一行。尾部越长，占用越大。 |
| 湖端需要合并的 Paimon Split（还没 compaction 的 Paimon 主键表） | 每个参与合并的文件保留一个 Row Group，一个 Split 可能占上百 MB。 |

查询会并行读取多个扫描范围：每个扫描实例最多同时运行 `max_file_scanners_concurrency`（默认 16）个读取器，一个 BE 上还可能有多个实例、多个查询在同时读。几个占用大的读取器同时打开，就可能把堆用满，查询报错。错误信息里会给出堆的上限和处理办法：

```text
errCode = 2, detailMessage = (10.0.0.3)[JNI_ERROR]OutOfMemoryError: Java heap space. BE's JVM is out of heap. Its maximum is 2048 MB, the -Xmx in JAVA_OPTS_FOR_JDK_17 of be.conf: raise it and restart the BE, or have the statement hold less of the heap at once - read with fewer scanners by setting max_file_scanners_concurrency below its default of 16, or set enable_jni_heap_admission = true to have JNI readers wait for room by the heap they declare. A statement that ran out of heap frees it only once its scanners have exited
```

### 堆内存不足时的处理

可以从下面几个方向入手：

1. 调大 JVM 堆。修改 `be.conf` 中 `JAVA_OPTS_FOR_JDK_17` 的 `-Xmx`，重启 BE 后生效。经常查询主键表的集群，优先考虑这种做法。JVM 堆用的也是 BE 所在机器的内存，调大之前先确认内存够用。
2. 少开几个读取器。调小 `max_file_scanners_concurrency`，同时打开的读取器少了，占用的堆也跟着减少，代价是读得慢一些：

    ```sql
    SET max_file_scanners_concurrency = 4;
    -- 只对单条语句生效
    SELECT /*+ SET_VAR(max_file_scanners_concurrency=4) */ * FROM fluss.db.tbl;
    ```

3. 开启 JNI 堆准入，让这几种读取器按要占用的堆排队打开，见下文。
4. 减少要放进堆里的数据。Fluss 做 KV 快照越频繁（Fluss 集群的 `kv.snapshot.interval`），快照之后的变更日志越短；分层越及时（`table.datalake.freshness`），日志尾部越短；湖端的 Paimon 主键表经过 compaction 后，Split 不用合并，改走 native reader，不占 JVM 堆。

### JNI 堆准入

会话变量 `enable_jni_heap_admission`（默认 `false`）打开后，FE 规划查询时会估算上面三种读取器各要占用多少堆，随扫描范围一起交给 BE。BE 记着已经打开的读取器一共声明了多少：加上新读取器的声明，仍不超过 JVM 最大堆（即 `-Xmx`）的 `jni_scanner_heap_budget_ratio` 时才打开它，否则让它排队，等前面的读取器读完关闭、归还额度后再打开。

```sql
SET enable_jni_heap_admission = true;
-- 只对单条语句生效
SELECT /*+ SET_VAR(enable_jni_heap_admission=true) */ * FROM fluss.db.tbl;
```

打开后：

- 只有上面三种读取器会声明并排队。日志表的日志、走 native reader 的湖端 Split 不声明，开不开这个变量都一样快。
- 只会让读取器等待，不会改变查询结果。
- 按先来后到排队，声明大的读取器不会一直被后来的小读取器插队。当前没有读取器占着额度时总会放行，所以声明比整个额度还大的读取器也能打开，只是独自运行。
- 一个读取器最多等 `jni_scanner_heap_max_wait_ms`（默认 60 秒），超时后不再等，直接打开。
- 额度按 BE 计算，这个 BE 上所有打开了该变量的查询共用。没打开的查询不声明、不排队，也不占额度。多个查询同时读主键表时，可以用 `SET GLOBAL enable_jni_heap_admission = true` 让所有会话都打开。
- 该变量同样作用于 [Paimon Catalog](./paimon-catalog.mdx) 中走 JNI 读取的 Split。

相关的 BE 配置项都支持动态修改，修改方法见 [BE 配置项](../../admin-manual/config/be-config.md)：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `jni_scanner_heap_budget_ratio` | `0.5` | 已打开的读取器一共可以声明 JVM 最大堆的多少比例。其余的堆留给不声明的读取器、Java UDF 等 BE 中其他用到 JVM 的功能，以及读取时的瞬时峰值，不建议调得太高。 |
| `jni_scanner_heap_max_wait_ms` | `60000` | 一个读取器最多排队多久，单位为毫秒。超时后直接打开。 |

Profile 中的 `JvmHeapDeclaredBytes` 和 `JvmHeapWaitTime`（见【查询 Profile】）记录了读取器声明了多少堆、排队等了多久。`JvmHeapWaitTime` 经常很高，说明额度不够用，可以考虑调大 `-Xmx`。

声明值是估算出来的，这也是该变量默认关闭的原因：

- 字符串、二进制和嵌套类型的值一律按 64 字节估算。值比较长的表，比如字符串列里存的是 JSON，或者主键是长字符串，实际占用会超过声明，准入拦不住，仍可能报 `OutOfMemoryError`。
- Paimon 合并读取时会有短暂的峰值，可能达到声明值的几倍，这部分要靠额度之外的堆来承担。
- 日志里同一个主键被反复更新时，声明值会大于实际占用，读取器可能多排一会儿队，查询变慢。

### 堆耗尽之后

- 报 `OutOfMemoryError` 的查询失败，BE 进程继续运行。
- 这个查询的读取器全部退出后，它占用的堆才会释放。在此之前执行的查询可能报 `Failed to attach the current thread to the JVM, code=-1`，后面同样附带上述处理建议，稍等一会儿再重试即可。
- 堆耗尽时，Fluss 客户端的个别后台线程可能随之终止且不会恢复，少数 Fluss 读取会因此一直卡住，占用的线程和内存要等 BE 重启才能释放。所以发生过 JVM 堆耗尽之后，建议找合适的时间重启 BE。
- 如果希望 JVM 堆耗尽时 BE 立即退出，由外部的进程守护工具拉起，可以在 `JAVA_OPTS_FOR_JDK_17` 中加上 `-XX:+ExitOnOutOfMemoryError`。代价是这个 BE 上正在执行的查询和导入都会失败。

## 使用限制

<!-- 知识类型: 使用限制 -->

- 只读。不支持 `INSERT`、`UPDATE`、`DELETE`，也不支持 `CREATE TABLE`、`DROP TABLE` 这类库表管理操作。
- 湖格式只支持 Paimon。`table.datalake.format` 是其他格式的表，查 `tbl$lake` 会报错；这类表有了可读的湖快照之后，在 `auto` 和 `required` 模式下查表本身也会报错，需要把 Union Read 模式设为 `disabled`，只读 Fluss 里的数据。
- Fluss 的 `TIME` 类型映射为 `UNSUPPORTED`，这一列查不了。
- 谓词不下推到 Fluss：除分区裁剪外，从 Fluss 读出的数据由 Doris 读到之后再过滤。湖端规划 Split 时会把过滤条件交给 Paimon，由 Paimon 据此跳过不需要的分区和数据文件。列裁剪和嵌套类型的子列裁剪都支持。
- 不支持时间旅行和增量查询，`tbl$lake` 也不支持。
- Fluss 只提供表级行数，没有列级统计信息。

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: Paimon 插件缺失 / 对象存储凭证 / 湖快照未就绪 / 找不到湖表 / 湖配置变更 / 日志尾部过期 / 分区列类型不支持 / 分区匹配失败 / JVM 堆内存不足 -->

1. 查询湖仓分层表时报错 `the paimon connector plugin is not available`

    湖端数据靠 Paimon Connector 插件读取。检查 FE 部署目录下的 `plugins/connector/paimon` 目录是否完整。

2. 查询 `tbl$lake` 或 Union Read 时报错，提示无法访问对象存储

    Fluss 不会下发存储凭证，需要在 Catalog 里用 `fluss.lake.paimon.*` 配上。参见【湖表连接配置】。

3. 报错 `has no readable lake snapshot yet`

    分层服务还没往湖里提交过数据。查表本身时，只有 `required` 模式会报这个错，可以等分层服务提交，或者改用 `auto`。查 `tbl$log` 时任何模式都会报这个错，因为 `tbl$log` 要从湖快照开始读，这时改查表本身即可。

4. 查询 `tbl$lake` 报错 `nothing has been tiered`

    Doris 按当前的湖连接配置找不到湖表。Fluss 1.0 创建表时就会建好湖表，所以这通常说明 `fluss.lake.paimon.warehouse` 等配置没有指向 Fluss 集群实际写入的仓库。参见【湖表连接配置】。

5. 报错 `is already serving lake tables with a different paimon configuration`

    Catalog 开始读湖表之后，Fluss 集群的 `datalake.paimon.*` 配置变了。删除并重新创建 Catalog 即可，`REFRESH CATALOG` 不会重新加载湖配置。

6. 报错 `Part of the log tail has expired`

    对日志表做 Union Read 或查询 `tbl$log` 时，需要读湖快照之后的日志，而其中一部分已经被 Fluss 按 TTL 删掉了。可以等 Fluss 发布更新的可读湖快照。参见【Union Read 模式】。

7. 报错 `cannot be read: its partition column 'xx' has fluss type TIMESTAMP(3)`

    分区列的类型 Doris 读不了。参见【分区表】。

8. 报错 `cannot be matched safely to a live fluss partition`

    主键表的分区列不是 `STRING`，而湖里有 Doris 无法对应到 Fluss 分区的分区，比如 Fluss 里已经删掉的分区。参见【Union Read 模式】中的 `partition-type`。要读 Fluss 里现有的数据，可以把 Union Read 模式设为 `disabled`。

9. 报错 `OutOfMemoryError: Java heap space`，错误信息里带有 `BE's JVM is out of heap`

    BE 的 JVM 堆用满了，多发生在读主键表、对主键表做 Union Read，或者湖端有大量需要合并的 Paimon Split 时。可以调大 `-Xmx`、调小 `max_file_scanners_concurrency`，或者打开 `enable_jni_heap_admission`，参见【BE JVM 堆内存】。发生过堆耗尽之后，建议找合适的时间重启 BE。

10. 报错 `Failed to attach the current thread to the JVM, code=-1`

    通常紧跟在一次 JVM 堆耗尽之后出现：上一个报 `OutOfMemoryError` 的查询，读取器还没有全部退出，堆还没释放。稍等一会儿再重试即可。参见【BE JVM 堆内存】。

## 功能调试

<!-- 知识类型: 调试环境 -->

Doris 代码库的 `docker/thirdparties/docker-compose/fluss` 目录有一套回归测试用的 Fluss 环境，包含 Fluss、Flink、Paimon 分层服务和 MinIO，可以照着里面的 README 搭一套来验证功能。

## 参考资料

- [Apache Fluss 官方文档](https://fluss.apache.org/docs/)
- [Fluss Lakehouse Storage](https://fluss.apache.org/docs/maintenance/tiered-storage/lakehouse-storage/)
- [Paimon Catalog](./paimon-catalog.mdx)
