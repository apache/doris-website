---
{
    "title": "MongoDB Catalog 原生查询与配置",
    "sidebar_label": "MongoDB Catalog",
    "language": "zh-CN",
    "description": "使用 Doris 5.0 原生查询 MongoDB 普通集合、视图和时序集合，配置 BSON 类型映射、Schema、认证、readPreference、readConcern、共同快照和有界并行扫描，并了解精度、权限及执行限制。",
    "keywords": ["MongoDB Catalog", "Doris 5.0", "原生 MongoDB", "BSON 类型映射", "readConcern", "readPreference", "MongoDB 快照", "并行扫描"]
}
---

MongoDB Catalog 可以让 Doris 直接查询 MongoDB 普通集合、标准视图和逻辑时序集合，与其他 Doris 数据关联，并将受支持的列导入内表。原生读取器保留 BSON 类型，不需要 Trino Connector、JDBC 驱动或 BE JVM。

:::note
从 **Doris 5.0.0** 开始支持。FE、BE 需使用包含 MongoDB Connector 和原生读取器的匹配版本。本功能只读，不支持向 MongoDB 写入、CDC 或管理外部表和数据库。
:::

## 支持的部署和对象

已验证的服务端系列为 MongoDB 7.0 和 8.0。分片集合应连接 **mongos**，不要自行组合各 shard 的读取结果。所有 FE 和参与查询的 BE 都必须能够访问 MongoDB 公布的地址，包括自动发现的副本集成员。

| 部署或对象 | 普通读取 | 共同快照 | 并行 range 读取 |
| --- | --- | --- | --- |
| 副本集中的普通集合 | 支持 | 支持 | 支持，需显式开启 |
| 通过 mongos 查询普通集合 | 支持 | 支持 | 支持，需显式开启 |
| 标准视图 | 支持，保留公开名称、管道和 collation | 不支持 | 不支持 |
| 时序集合 | 支持，返回逻辑 measurement | 支持经过验证的 simple collation 定义 | 不支持 |
| Standalone MongoDB | 支持普通读取 | 不支持 | 不支持 |

时序读取不会访问 `system.buckets`，不会伪造唯一 `_id`，也不会将时间戳相同的 measurement 去重。本文不声明 SRV、混合版本升级或降级，以及其他服务端和认证组合已通过验证。

## 快速开始

### 1. 准备 MongoDB 数据和读取账号

使用有权创建示例数据和用户的 MongoDB 账号执行以下命令，将 `<password>` 替换为自己的密码。

```javascript
const analytics = db.getSiblingDB("analytics");
analytics.orders.insertMany([
    {_id: ObjectId("000000000000000000000001"), order_id: NumberLong("1"),
     amount: NumberDecimal("12.34"), created: ISODate("2024-01-01T00:00:00.123Z")},
    {_id: ObjectId("000000000000000000000002"), order_id: NumberLong("2"),
     amount: NumberDecimal("5.60"), created: ISODate("2024-01-01T00:00:01.000Z")}
]);
db.getSiblingDB("admin").createUser({
    user: "doris_reader", pwd: "<password>",
    roles: [{role: "read", db: "analytics"}]
});
```

Doris 需要对逻辑集合或视图的 `find` 权限。根据 validator 获取 Schema 还需要完整集合元数据权限。使用自定义 MongoDB 角色时，应授予相应元数据权限；仅能读取视图的受限账号可以使用 explicit 或 document Schema。Doris 用户还需具有创建或使用 Catalog、查询对应外表的权限。

### 2. 创建 Catalog

根据下方拓扑选择 URI。此例使用显式映射，不依赖 MongoDB validator，也不根据数据样本推断 Schema。

```sql
CREATE CATALOG mongo_catalog PROPERTIES (
    'type' = 'mongodb',
    'mongodb.uri' = 'mongodb://mongo1.example.com:27017,mongo2.example.com:27017/?replicaSet=rs0',
    'mongodb.username' = 'doris_reader',
    'mongodb.password' = '<password>',
    'mongodb.auth_database' = 'admin',
    'mongodb.databases' = 'analytics',
    'mongodb.schema.mode' = 'explicit',
    'mongodb.schema' = '{"analytics.orders":{"columns":[
        {"name":"id","path":["_id"],"bson_types":["objectId"],"doris_type":"VARBINARY(12)"},
        {"name":"order_id","path":["order_id"],"bson_types":["long"],"doris_type":"BIGINT"},
        {"name":"amount","path":["amount"],"bson_types":["decimal"],"doris_type":"DECIMAL(18,2)"},
        {"name":"created","path":["created"],"bson_types":["date"],"doris_type":"DATETIME(3)"}
    ]}}'
);
```

| 拓扑 | URI 示例 |
| --- | --- |
| 副本集 | `mongodb://mongo1.example.com:27017,mongo2.example.com:27017/?replicaSet=rs0` |
| 分片集群 | `mongodb://router1.example.com:27017,router2.example.com:27017/` |
| Standalone，仅普通读取 | `mongodb://mongo.example.com:27017/` |

`replicaSet` 是源副本集名称；mongos 地址是路由节点，不是 shard 成员。`directConnection=true` 表示直接连接一个服务端，不应与多主机种子列表组合。副本集建议使用成员发现，分片集群建议配置多个 router。URI 内凭据和独立用户名、密码属性是两种可选方式，不能同时配置。URI 凭据中的保留字符需进行百分号编码。参见 [MongoDB 连接字符串](https://www.mongodb.com/docs/manual/reference/connection-string/)。

### 3. 查询和导入内表

```sql
SHOW DATABASES FROM mongo_catalog;
SHOW TABLES FROM mongo_catalog.analytics;
DESC mongo_catalog.analytics.orders;
SET time_zone = 'UTC';
SELECT order_id, amount, created
FROM mongo_catalog.analytics.orders ORDER BY order_id;
```

```text
1  12.34  2024-01-01 00:00:00.123
2   5.60  2024-01-01 00:00:01.000
```

通过十六进制字符串展示或比较 ObjectId：

```sql
SELECT FROM_BINARY(id) FROM mongo_catalog.analytics.orders ORDER BY order_id;
```

```text
000000000000000000000001
000000000000000000000002
```

将类型化数据导入 Doris 内表：

```sql
CREATE DATABASE IF NOT EXISTS internal.reporting;
CREATE TABLE internal.reporting.order_copy
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES ('replication_num' = '1')
AS SELECT order_id, amount, created FROM mongo_catalog.analytics.orders;
SELECT count(*) FROM internal.reporting.order_copy;
```

示例计数结果为 `2`。请按集群情况选择副本策略；示例使用一个副本，也可在单 BE 环境运行。

## Catalog 参数

未知的 `mongodb.*` 属性会被拒绝。三个超时参数单位均为毫秒，范围均为 `1`–`300000`。

| 参数 | 类型 | 必填或默认值 | 含义 |
| --- | --- | --- | --- |
| `type` | STRING | 必填，`mongodb` | 选择原生 Connector。 |
| `mongodb.uri` | STRING | 必填 | MongoDB 地址、拓扑和 URI 选项，属于敏感属性。 |
| `mongodb.username` | STRING | 可选，空 | 独立认证用户名；URI 已带凭据时省略。 |
| `mongodb.password` | STRING | 可选，空 | 独立密码，需同时指定 `mongodb.username`，属于敏感属性。 |
| `mongodb.auth_database` | STRING | `admin` | 独立凭据的认证数据库，可与数据数据库不同；URI 凭据使用 URI 中的认证来源。 |
| `mongodb.databases` | STRING | 空 | 逗号分隔的数据库白名单，可避免要求枚举全部数据库的权限，但不授予数据访问权限。 |
| `mongodb.schema.mode` | STRING | `auto` | `auto`、`validator`、`explicit` 或 `document`，见下文。 |
| `mongodb.schema` | JSON 字符串 | `{}` | 按 `database.collection` 配置显式映射，最多 1 MiB、1024 个命名空间条目。 |
| `mongodb.type_mismatch` | STRING | `error` | `error` 遇到不兼容值时报错；`null` 将转换失败的顶层字段置为 SQL NULL。 |
| `mongodb.datetime_timezone` | STRING | `UTC` | BSON Date 的解释时区，仅接受 `UTC`。 |
| `mongodb.read_preference` | STRING | `primary` | 默认的数据读取节点偏好。 |
| `mongodb.read_concern` | STRING | `majority` | 默认可选 `local`、`majority`、`available`、`snapshot`。 |
| `mongodb.connect_timeout_ms` | INT | `10000` | 建立连接的超时上限。 |
| `mongodb.server_selection_timeout_ms` | INT | `10000` | 选择符合条件的服务端的超时上限。 |
| `mongodb.socket_timeout_ms` | INT | `1000` | 网络 I/O 超时上限，可能被扫描剩余时间进一步缩短。 |
| `mongodb.pool_max_clients` | INT | `16`，范围 `1`–`1024` | 每个 BE 上同一 Catalog 配置可同时租用的兼容客户端数量，不是全 Doris 集群的源端总连接限制。 |

读取偏好和 readConcern 的优先级为：**显式语句或会话值 > URI 选项 > Catalog 属性 > 默认值**。会话值为 `inherit` 时，采用 URI 和 Catalog 共同确定的有效策略。连接、选服、socket 和池大小则由 **Catalog 参数覆盖 URI 中的对应传输选项**。超时和客户端上限不决定 split 数量。

TLS 和认证 URI 选项会传给驱动，引用的文件需在 FE、BE 上可用。关闭 TLS 主机名校验会被拒绝。Catalog 不提供证书或凭据轮换服务，也不提供通用的跨查询、跨源准入服务。请使用已在自身部署中验证的认证和 TLS 组合。

## Schema 和 BSON 类型

Schema 选择**不会通过采样数据推断类型**。后文的 range 边界采样用途不同。

| 模式 | 选择规则 |
| --- | --- |
| `auto` | 优先使用命名空间的显式映射，否则使用可完整表达的普通集合 `$jsonSchema` validator，仍不满足则整表回退为 document 模式。 |
| `validator` | 要求普通集合具有可完整表达的 validator，否则报错。 |
| `explicit` | 要求 `mongodb.schema` 中存在对应命名空间的映射。 |
| `document` | `_mongo_ejson` 返回 canonical Extended JSON，`_mongo_bson` 返回原始 BSON 字节。 |

不会为了使用不完整的 validator 映射而静默丢弃声明字段。不支持的 validator 结构使 `auto` 整表回退，`validator` 则报错。Validator 也不能证明历史文档满足约束。映射字段保持可空，字段缺失和 BSON null 都映射为 SQL NULL；需要区分二者时使用原始 BSON 或 Extended JSON。

显式绑定字段说明：

| 字段 | 含义 |
| --- | --- |
| `name` | 必填。Doris 列名，会折叠为小写。 |
| `path` | 必填。大小写敏感的精确路径段；`["a.b"]` 表示包含点号的键，`["a","b"]` 表示嵌套路径。 |
| `doris_type` | 必填。目标类型，包括 Decimal 精度和标度、DATETIME 小数秒精度。 |
| `bson_types` | 接受的 BSON 标签，例如 `long`、`decimal`、`date`、`objectId`；省略不表示允许隐式转换。 |
| `subtype` | 将 `binData` 映射到 VARBINARY 时必须指定 Binary subtype，例如 `0`。 |
| `children` | 可选的递归 STRUCT 字段或 ARRAY 元素绑定；STRUCT 按名称匹配，ARRAY 有一个元素绑定。 |

| BSON 值 | Doris 映射或限制 |
| --- | --- |
| Boolean | BOOLEAN。 |
| int32 / int64 | 目标整数范围内的值，BIGINT 可精确保存 int64；超出目标范围或需要有损转换时报错。 |
| Double | 按精确转换规则映射为浮点类型，不会隐式转换为整数或字符串。 |
| String | STRING/VARCHAR，不隐式解析为数字。 |
| Decimal128 | 显式 `DECIMAL(p,s)`，`p <= 38`，不进行舍入；validator 中的 Decimal 没有公共固定标度，因此使用 Extended JSON。 |
| Date | 默认 UTC `DATETIME(3)`；也可显式映射为精度 `0`–`6` 的 DATETIME 或 BIGINT 毫秒时间戳，不允许丢失精度。 |
| ObjectId | 原始 VARBINARY(12)，使用 `FROM_BINARY` 展示十六进制或进行字符串比较、关联、分组；直接使用 VARBINARY 操作仍受 Doris 的限制。 |
| Binary | 显式指定 subtype 后映射为 VARBINARY，其他表示可使用 Extended JSON；声明的 VARBINARY 长度不会截断字节。 |
| Timestamp | `STRUCT<seconds:BIGINT,increment:BIGINT>`，保留两个无符号 32 位分量，与 BSON Date 不同。 |
| 正则表达式 | 显式 `STRUCT<pattern:STRING,options:STRING>` 保留 pattern 和 options，validator 派生值使用 Extended JSON。 |
| Object / Array | 可表达的 STRUCT/ARRAY 绑定，或通过 canonical Extended JSON 保留自由结构和异构值。 |
| 其他 BSON 标签 | 使用 canonical Extended JSON 或原始 BSON 保留，不假定存在对应的类型化转换。 |

仅支持列出的目标类型系列，不支持 MAP、VARIANT 或任意隐式转换。`mongodb.type_mismatch=null` 会回滚转换失败的整个顶层字段及其嵌套数据，不会保留部分解码的数组，也不会吞掉源端、网络或分配错误。

### 日期时间和 Decimal 精度

BSON Date 只有毫秒精度，不保存原始时区标签。`mongodb.datetime_timezone` 固定为 UTC，Doris 会话的 `time_zone` 控制返回的本地日期时间。提高 DATETIME 精度会补齐毫秒值，不能恢复 MongoDB 未保存的微秒。非零毫秒值不能静默截断为 `DATETIME(0)`：`type_mismatch=null` 时返回 NULL，`error` 时查询失败。

Decimal 同样要求目标精度和标度可以精确表达源值。例如，`12.34` 可放入 `DECIMAL(18,2)`，但放入 `DECIMAL(18,1)` 需要舍入，因此报错或返回 NULL。非有限 Decimal128 值没有对应的 Doris DECIMAL 表示，需要时保留为 Extended JSON。

## 读取节点和一致性

`readPreference` 决定读哪个成员，`readConcern` 决定 MongoDB 提供的数据可见性。Doris 传递最终生效的策略。选择 secondary 不等于建立快照，也不保证读到最新数据。

| `mongodb_read_preference` | 含义 |
| --- | --- |
| `inherit` | 使用 URI 和 Catalog 确定的有效偏好。 |
| `primary` | 读取 primary。 |
| `primaryPreferred` | 优先 primary，不可用时允许符合条件的 secondary。 |
| `secondary` | 必须有符合条件的 secondary。 |
| `secondaryPreferred` | 优先符合条件的 secondary，没有时允许 primary。 |
| `nearest` | 在延迟窗口内选择符合条件的成员，不区分 primary 或 secondary。 |

会话修改模式时，URI 的 tag-set 顺序和最大滞后约束仍保留。`primary` 覆盖与 URI 的 tags、staleness、hedge 条件冲突时直接报错，不会丢弃这些条件。参见 [MongoDB readPreference](https://www.mongodb.com/docs/manual/core/read-preference/)。

| `mongodb_read_concern` | 含义 |
| --- | --- |
| `inherit` | 使用 URI 和 Catalog 确定的有效 readConcern。 |
| `local` | 可能读到尚未 majority 提交、之后可被回滚的值。 |
| `majority` | 读取 majority 已提交视图，不会自动把多个独立扫描固定在同一时间。 |
| `available` | 放宽一致性和 shard 所有权检查，可能返回 orphaned documents。 |
| `snapshot` | Doris 额外为同一 SQL 中符合条件的 MongoDB 扫描固定共同的服务端时间点。 |

不支持 `linearizable`：通用集合扫描没有校验 MongoDB 要求的仅 primary、唯一标识单文档等条件。参见 [MongoDB readConcern](https://www.mongodb.com/docs/manual/reference/read-concern/)。

```sql
SET mongodb_read_preference = 'secondaryPreferred';
SELECT /*+ SET_VAR(mongodb_read_preference='primary', mongodb_read_concern='majority') */
    count(*) FROM mongo_catalog.analytics.orders;
SET mongodb_read_preference = 'inherit';
```

该语句使用 primary/majority，示例数据返回 `2`，不会修改 Catalog 默认值或其他会话。

### 多个扫描使用同一个快照

Snapshot 账号除数据和完整命名空间元数据权限外，还需要识别源部署的权限：副本集需要 `replSetGetConfig`，mongos 需要对 `config.version` 的 `find` 权限。自定义角色应包含这些权限；range 规划还需要集合上的 `listIndexes` 和 `collStats`。

```javascript
db.getSiblingDB("admin").createRole({
    role: "doris_snapshot_identity",
    privileges: [{resource: {cluster: true}, actions: ["replSetGetConfig"]}],
    roles: []
});
db.getSiblingDB("admin").grantRolesToUser("doris_reader", ["doris_snapshot_identity"]);
```

以上角色适用于副本集。Mongos 应改用 `{resource: {db: "config", collection: "version"}, actions: ["find"]}` 作为角色权限。

```sql
SELECT /*+ SET_VAR(mongodb_read_concern='snapshot') */ l.n, r.n
FROM (SELECT count(*) n FROM mongo_catalog.analytics.orders) l
CROSS JOIN (SELECT count(*) n FROM mongo_catalog.analytics.orders) r;
```

示例返回 `2, 2`。FE 获得服务端选择的时间点 `T`，本 SQL 中参与的 MongoDB 扫描都读取该 `T`，包括指向同一部署的不同 Catalog。它不是本地墙上时钟，也不支持用户指定 time-travel 时间点。

一条语句不能混用 snapshot 与普通 MongoDB 读取，也不能为相互独立的 MongoDB 部署固定共同快照。源端历史保留窗口必须覆盖整个查询。命名空间替换、副本集配置变化、不兼容的时序集合定义、权限错误或 `SnapshotTooOld` 都会使语句失败。Doris 不会重选更新的时间点或降低 readConcern，将失败快照转换成成功读取。

## 并行 range 读取

默认 `mongodb_split_strategy=single` 为**每个表扫描生成一个 split**。即使提高 scanner 上限或增加 BE，一个 split 仍只由一个 scanner 读取。一条 SQL 中多个扫描节点仍可并发，mongos 也可能在内部并行访问多个 shard。

| 参数 | 类型和默认值 | 作用 |
| --- | --- | --- |
| `mongodb_split_strategy` | STRING，`single` | `single`、保守的 `auto` 或显式 `range`。 |
| `mongodb_split_field` | STRING，空 | 空值选择 `_id`，否则是最多 256 个字符的安全顶层字段；显式字段要求语句中只有一个 MongoDB 扫描。 |
| `file_split_size` | BIGINT，`0` | 正数直接作为逻辑字节目标，否则使用通用大小估算规则。 |
| `max_initial_file_split_size` | BIGINT，32 MiB | 较小集合的初始目标大小。 |
| `max_file_split_size` | BIGINT，64 MiB | 大小未知，或大小达到此值乘 `max_initial_file_split_num` 时的目标。 |
| `max_initial_file_split_num` | INT，`200` | 通用大小估算规则的阈值。 |
| `max_file_split_num` | INT，`100000` | 数量上限，非正数取消用户上限但保留内部限制；流式模式也会限制 MongoDB 冻结计划的大小。 |

Range 需要符合条件的共同快照、普通集合，以及以切分字段为首键的可见索引。Partial、sparse、hidden、hashed 和非 simple collation 索引不适用。边界类型支持标量 ObjectId、有符号 int32/int64、Date，不会将 Decimal、字符串或 double 强制转换为边界。

FE 按集合逻辑大小和目标大小估算总数，再沿索引在 `T` 下读取最多 4096 个固定宽度候选值。这是有界的索引前缀采样，**不是均匀随机采样，也不用于推断 Schema**。FE 排序候选值、选择分位点，并保留互斥的补集；完整计划在发布首个 split 前冻结。采样影响负载均衡，不决定数据覆盖范围。

例如，准入 4 个 split，整数样本为 `1`–`9`，可能选择边界 `4` 和 `7`：

| split | 覆盖范围 |
| --- | --- |
| 1 | 小于 `4` 的整数。 |
| 2 | 大于等于 `4`、小于 `7` 的整数。 |
| 3 | 大于等于 `7` 的整数，包括未采到的 `1000000`。 |
| 4 | 其他全部值，包括其他类型、缺失、null 和数组。 |

左闭右开区间使重复的边界值只属于一个分区。重复样本和预算可能减少实际数量；数量包含补集，上限不保证一定生成相同数量的任务。

```sql
SELECT /*+ SET_VAR(mongodb_read_concern='snapshot', mongodb_split_strategy='range',
                  file_split_size=1, max_file_split_num=4) */
    count(*) FROM mongo_catalog.analytics.orders;
```

快速开始的数据返回 `2`。一个字节的目标仅用于在小集合上展示规划，生产环境应选择合理的字节目标。小集合、大小未知、缺少索引、不支持的类型或可选探测预算耗尽时，`auto` 可以保持 single；`range` 则报告不支持的条件。两者都不会把权限、源端、历史错误或取消转成成功的全表重扫。已经发布的计划失败后不能追加替代的 single 扫描。

内部规划限制包括受查询剩余时间约束的 2 秒探测、每个固定源最多 256 个分区、每条语句最多 4096 个分区，以及描述符字节准入。显式开启后成功回退的 single 也计入预算。采样使用一个有界响应，不留下远端采样游标。这些保护不会新增可调 split 参数。

更多 split 不一定更快：有偏的前缀可能造成倾斜，补集也会增加工作量，因此默认保持 single。

## 会话控制和执行

| 会话变量 | 类型和默认值 | 作用 |
| --- | --- | --- |
| `mongodb_read_preference` | STRING，`inherit` | 上文列出的数据读取偏好。 |
| `mongodb_read_concern` | STRING，`inherit` | 上文列出的可见性策略。 |
| `enable_mongodb_predicate_pushdown` | BOOLEAN，`true` | 开启安全的源端候选条件，包括 LIKE。 |
| `enable_mongodb_like_pushdown` | BOOLEAN，`true` | 谓词下推开启时，允许安全的 LIKE 候选条件。 |
| `enable_mongodb_projection_pushdown` | BOOLEAN，`true` | 开启安全的源字段根投影。 |
| `mongodb_split_strategy` | STRING，`single` | 上文列出的切分策略。 |
| `mongodb_split_field` | STRING，空 | 上文列出的切分字段。 |

这些变量支持 `SET` 和语句级 `SET_VAR`。Doris 原有的 `batch_size` 控制源端文档批大小，范围为 `1`–`65535`；`query_timeout` 控制查询超时。`max_file_scanners_concurrency`、`min_file_scanners_concurrency`、`parallel_pipeline_task_num`、远端扫描线程池和 workload group 控制执行并发。Scanner 和客户端限制作用于各自的 BE 执行范围，不是集群总并发上限；提高这些限制也不会产生更多可读取的 split。客户端暂不可用时，读取器保留 split 和截止时间并让出工作线程，让持有连接的读取器能够继续执行。

谓词下推是保守的候选过滤，完整条件仍在 Doris 中执行。它需要 `type_mismatch=null`；`error` 和严格 CAST 执行将谓词保留在本地，以免隐藏转换错误。安全的标量比较、正向 IN/BETWEEN/IS NOT NULL、AND/OR、UTC Date 范围和 LIKE 必要字面子串可以成为候选。非安全 CAST 或函数、嵌套或数组谓词、NOT/!=/NOT IN、REGEXP 等保留在本地。标准视图的谓词也保留在本地，以维持视图语义和 collation。

投影保留输出列和残余谓词所需的完整源字段根。整文档绑定或包含点、美元符号的字面根可能需要保留全文档。SQL JOIN、聚合、排序、OFFSET、LIMIT 均在 Doris 执行，LIMIT 不下推给 MongoDB。

## 刷新、诊断和常见问题

修改 validator、显式映射、视图或集合定义后刷新元数据：

```sql
REFRESH CATALOG mongo_catalog;
EXPLAIN SELECT /*+ SET_VAR(mongodb_read_concern='snapshot', mongodb_split_strategy='range') */
    count(*) FROM mongo_catalog.analytics.orders;
```

EXPLAIN 和完成的 Profile 显示有效读取策略、快照，以及 split 的策略、字段、类型族、请求数、准入数、实际数和原因。Profile 还包含源端读取行数、字节数和 `MongoSnapshotTimestamp`，不展示源端切分边界或连接凭据。排查时可通过 `SET enable_profile=true` 开启查询 Profile。

| 现象 | 处理方式 |
| --- | --- |
| 认证或元数据权限失败 | 检查凭据来源、认证数据库、集合元数据和 snapshot 身份权限，不要混用 URI 和独立凭据。 |
| 没有符合条件的 secondary 或选服超时 | 检查源端状态、公布地址、tags/staleness 和拓扑；standalone 不能验证副本集读取路由。 |
| 意外显示文档列 | 检查 Schema 选择优先级和完整 validator 是否可表达，必要时提供显式映射。 |
| 转换报错或意外 NULL | 检查 BSON 标签、Binary subtype、整数范围、Decimal 精度或标度、DATETIME 精度和 mismatch 策略。 |
| Snapshot 或 range 不可用 | 检查部署、对象、readConcern、索引和元数据权限是否满足条件。 |
| `SnapshotTooOld` 或源端定义、配置变化 | 查询失败后刷新变更的元数据并启动新语句，保留足够长的源端历史。 |
| 实际 split 太少或加速不佳 | 检查大小、数量、重复边界、回退原因和预算，评估倾斜和补集成本后再提高 scanner 上限。 |
| 取消较慢 | 检查连接、选服和 socket 上限；同步驱动调用可能持续到配置的上限，并非所有在途调用都能立即中断。 |

跨独立源关联或读取标准视图时使用普通读取；同一语句需要共同的 MongoDB 时间点时使用 snapshot。评估源端成本后再启用 range，不要把提高 scanner 配置当成可用切分计划的替代。
