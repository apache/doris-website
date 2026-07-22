---
{
    "title": "数据血缘原理与使用（4.x）",
    "sidebar_label": "数据血缘",
    "language": "zh-CN",
    "description": "介绍 Apache Doris 数据血缘的采集原理、事件内容、支持范围、插件部署、FE 配置、队列行为、运维排障和完整 SQL 示例，帮助用户理解并验证表级、列级以及直接和间接血缘关系。",
    "keywords": ["Apache Doris", "数据血缘", "数据治理", "LineagePlugin", "列级血缘"]
}
---

<!-- 知识类型: 功能概述 + 技术设计 + 用户手册 -->
<!-- 适用场景: 数据治理系统集成 / 影响分析 / 合规追溯 -->

数据血缘功能可以从 Doris 支持的 DML 语句中提取表级和列级依赖，并通过 `LineagePlugin` 发送到外部治理系统。Doris 是血缘生产者，不保存事件、不提供血缘查询 API，也不提供血缘可视化。

> 该功能从 Apache Doris 4.0.6 起在 4.x 版本中可用。

## 能力和限制

框架只会在以下语句成功后生成事件：

| 支持的语句 | 事件行为 |
| --- | --- |
| `INSERT INTO ... SELECT` | Insert 成功后生成一个事件。 |
| `INSERT OVERWRITE TABLE ... SELECT` | Overwrite 成功后生成一个事件。 |
| `CREATE TABLE AS SELECT` | 内部 Insert 成功后生成一个事件。 |

当前实现不会为 `SELECT`、`UPDATE`、`DELETE`、导入任务、仅包含 `VALUES` 的 Insert，以及目标表为 `__internal_schema` 的写入生成事件。部分 `UPDATE` 和 `DELETE` 执行路径会在内部复用 Insert 命令，但原始命令类型校验会阻止这些命令提交血缘事件。

:::caution 投递保证

血缘投递是异步且尽力而为的。DML 成功后，即使事件采集或插件投递失败，DML 也不会回滚。队列满时可能丢弃事件，Doris 不会重试或持久化这些事件。

:::

## 工作原理

### 采集流程

对于受支持的语句，Doris 会在 `afterAnalyze` 规划 Hook 中记录 Nereids 已分析的逻辑计划。DML 成功后，系统从该逻辑计划提取血缘并将事件提交到 FE 本地队列。单个 daemon 工作线程会检查每个已加载插件，并将事件分发给 `eventFilter()` 返回 `true` 的插件。

![数据血缘采集架构：受支持的 DML 成功后，由 Nereids 分析并提取为 LineageInfo，经 FE 队列和插件投递到外部治理系统。](/images/data-lineage/lineage-architecture-zh-CN.svg)

在提取前，Doris 会对已加载插件调用 `eventFilter()`。如果没有插件愿意接收事件，则跳过提取。工作线程在分发前也会再次判断 `eventFilter()`。

### 血缘内容

每个 `LineageInfo` 事件包含表级血缘、列级直接血缘、两类间接血缘和查询上下文。先通过一个完整的 SQL 示例明确源表、目标表和输出结果，后续各小节都基于该示例解释事件内容。

#### 示例 SQL 和执行结果

以下示例需要当前用户具有创建数据库、创建表、写入和查询权限，并且 FE 已加载血缘插件。示例使用两个源表，通过 CTE、Join、过滤、聚合、窗口函数、条件表达式和排序生成客户汇总表。

```sql
CREATE DATABASE IF NOT EXISTS lineage_demo;
USE lineage_demo;

CREATE TABLE lineage_orders (
    order_id BIGINT,
    customer_id BIGINT,
    region VARCHAR(16),
    amount DECIMAL(18, 2),
    status VARCHAR(16)
)
DUPLICATE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

CREATE TABLE lineage_customers (
    customer_id BIGINT,
    customer_name VARCHAR(64),
    customer_level VARCHAR(16)
)
DUPLICATE KEY(customer_id)
DISTRIBUTED BY HASH(customer_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

CREATE TABLE lineage_customer_summary (
    customer_id BIGINT,
    region_label VARCHAR(16),
    total_amount DECIMAL(18, 2),
    customer_seq BIGINT,
    region_group VARCHAR(16)
)
DUPLICATE KEY(customer_id)
DISTRIBUTED BY HASH(customer_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO lineage_customers VALUES
    (1, 'Alice', 'VIP'),
    (2, 'Bob', 'VIP'),
    (3, 'Carol', 'REGULAR');

INSERT INTO lineage_orders VALUES
    (101, 1, 'east', 100.00, 'PAID'),
    (102, 1, 'east',  50.00, 'PAID'),
    (103, 2, 'west',  80.00, 'PAID'),
    (104, 2, 'west',  30.00, 'CANCELLED'),
    (105, 3, 'north', 200.00, 'PAID');

INSERT INTO lineage_customer_summary
WITH customer_totals AS (
    SELECT
        o.customer_id,
        UPPER(o.region) AS region_label,
        SUM(o.amount) AS total_amount
    FROM lineage_orders o
    JOIN lineage_customers c
        ON o.customer_id = c.customer_id
    WHERE o.status = 'PAID'
      AND c.customer_level = 'VIP'
    GROUP BY o.customer_id, UPPER(o.region)
    HAVING SUM(o.amount) >= 50
)
SELECT
    customer_id,
    region_label,
    total_amount,
    ROW_NUMBER() OVER (ORDER BY customer_id) AS customer_seq,
    CASE
        WHEN region_label = 'EAST' THEN 'CORE'
        ELSE 'OTHER'
    END AS region_group
FROM customer_totals
ORDER BY total_amount DESC;

SELECT customer_id, region_label, total_amount, customer_seq, region_group
FROM lineage_customer_summary
ORDER BY customer_id;
```

查询结果如下：

```text
+-------------+--------------+--------------+--------------+--------------+
| customer_id | region_label | total_amount | customer_seq | region_group |
+-------------+--------------+--------------+--------------+--------------+
|           1 | EAST         |       150.00 |            1 | CORE         |
|           2 | WEST         |        80.00 |            2 | OTHER        |
+-------------+--------------+--------------+--------------+--------------+
```

两个仅包含 `VALUES` 的 Insert 不会生成血缘事件。`INSERT INTO lineage_customer_summary ... SELECT` 会生成一个 `LineageInfo` 事件，以下各小节说明该事件的具体内容。

#### 表级血缘

表级血缘记录一个目标表和已分析逻辑计划中扫描的所有源表。例如，写入 `lineage_customer_summary` 的查询同时扫描 `lineage_orders` 和 `lineage_customers`，因此这两个源表都与目标表建立表级关系。CTE 会继续解析到其底层表，`UNION` 的各个分支也都会计入源表集合。

该示例产生以下表级血缘：

| 源表 | 目标表 |
| --- | --- |
| `lineage_orders` | `lineage_customer_summary` |
| `lineage_customers` | `lineage_customer_summary` |

#### 列级直接血缘

列级直接血缘说明每个目标列的值由哪个源表达式产生。Doris 在解析别名和 CTE 后，按以下顺序判断类型：表达式只要包含聚合函数就是 `AGGREGATION`；纯源列引用是 `IDENTITY`；其他表达式是 `TRANSFORMATION`。

| 类型 | 含义 | 示例 |
| --- | --- | --- |
| `IDENTITY` | 目标值直接取自一个源列，没有函数或运算。 | `lineage_customer_summary.customer_id` 直接来自 `lineage_orders.customer_id`。 |
| `TRANSFORMATION` | 目标值经过非聚合表达式转换，例如算术、字符串函数、窗口函数或条件表达式。 | `region_label` 来自 `UPPER(lineage_orders.region)`；`customer_seq` 来自 `ROW_NUMBER()`。 |
| `AGGREGATION` | 目标值由包含聚合函数的表达式产生。即使聚合函数外还有其他表达式，仍归为该类型。 | `total_amount` 来自 `SUM(lineage_orders.amount)`。 |

该示例产生以下列级直接血缘：

| 目标列 | 源表达式 | 类型 |
| --- | --- | --- |
| `lineage_customer_summary.customer_id` | `lineage_orders.customer_id` | `IDENTITY` |
| `lineage_customer_summary.region_label` | `UPPER(lineage_orders.region)` | `TRANSFORMATION` |
| `lineage_customer_summary.total_amount` | `SUM(lineage_orders.amount)` | `AGGREGATION` |
| `lineage_customer_summary.customer_seq` | `ROW_NUMBER() OVER (ORDER BY lineage_orders.customer_id)` | `TRANSFORMATION` |
| `lineage_customer_summary.region_group` | `CASE WHEN UPPER(lineage_orders.region) = 'EAST' ... END` | `TRANSFORMATION` |

#### 数据集级间接血缘

数据集级间接血缘记录影响整个结果集、但不直接产生某个目标列值的表达式。这些依赖保存在事件级 map 中，需要时可以应用到每个目标输出列。

| 类型 | 含义 | 示例 |
| --- | --- | --- |
| `JOIN` | Join 条件决定哪些源表行可以组合。 | `lineage_orders.customer_id = lineage_customers.customer_id`。 |
| `FILTER` | `WHERE` 或 `HAVING` 条件决定哪些行或分组进入结果。 | `status = 'PAID'`、`customer_level = 'VIP'`、`HAVING SUM(amount) >= 50`。 |
| `GROUP_BY` | 分组表达式决定聚合结果的粒度。 | 按 `customer_id` 和 `UPPER(region)` 分组。 |
| `SORT` | `ORDER BY` 或 TopN 的排序表达式决定结果顺序。 | 按 `total_amount DESC` 排序；别名解析后对应 `SUM(amount)`。 |

该示例产生以下数据集级间接血缘：

| 类型 | 事件中的源表达式示例 | 作用 |
| --- | --- | --- |
| `JOIN` | `lineage_orders.customer_id = lineage_customers.customer_id` | 决定订单与客户的匹配关系。 |
| `FILTER` | `status = 'PAID'`、`customer_level = 'VIP'`、`SUM(amount) >= 50` | 分别来自 `WHERE` 和 `HAVING`，共同决定进入结果的行和分组。 |
| `GROUP_BY` | `lineage_orders.customer_id`、`UPPER(lineage_orders.region)` | 决定每个客户、区域的聚合粒度。 |
| `SORT` | `total_amount DESC`，解析后对应 `SUM(lineage_orders.amount)` | 决定插入查询结果的顺序。 |

#### 输出列级间接血缘

输出列级间接血缘只挂到受影响的目标列，不会应用到其他输出列。

| 类型 | 含义 | 示例 |
| --- | --- | --- |
| `WINDOW` | 窗口函数的 `PARTITION BY` 和 `ORDER BY` 输入影响对应输出列。 | `customer_seq` 由 `ROW_NUMBER() OVER (ORDER BY customer_id)` 产生，其 `WINDOW` 依赖是 `customer_id`。 |
| `CONDITIONAL` | `CASE`、`IF` 的条件或 `COALESCE` 的候选表达式影响对应输出列。 | `region_group` 的值由 `CASE WHEN region_label = 'EAST' ...` 决定，其 `CONDITIONAL` 依赖是该判断条件。 |

窗口或条件表达式本身仍会出现在列级直接血缘中。例如，`customer_seq` 的直接类型是 `TRANSFORMATION`，同时具有 `WINDOW` 间接血缘；`region_group` 的直接类型也是 `TRANSFORMATION`，同时具有 `CONDITIONAL` 间接血缘。

该示例产生以下输出列级间接血缘：

| 目标列 | 类型 | 事件中的源表达式 | 作用 |
| --- | --- | --- | --- |
| `customer_seq` | `WINDOW` | `lineage_orders.customer_id` | 作为 `ROW_NUMBER()` 的窗口排序输入，只影响 `customer_seq`。 |
| `region_group` | `CONDITIONAL` | `UPPER(lineage_orders.region) = 'EAST'` | 作为 `CASE WHEN` 条件，只影响 `region_group`。 |

其他三个目标列没有输出列级间接血缘。数据集级的 `JOIN`、`FILTER`、`GROUP_BY` 和 `SORT` 仍然影响整个结果集。

#### 查询上下文

查询上下文说明这次血缘事件由谁、在什么会话中、通过哪条 DML 产生。

| 字段 | 示例或含义 |
| --- | --- |
| Source Command | `InsertIntoTableCommand`，表示事件来自 Insert。 |
| Query ID 和原始 SQL | 本次 DML 的 Query ID，以及完整的 `INSERT INTO lineage_customer_summary ...` 文本。 |
| 用户和客户端 IP | 例如 `lineage_user` 和 `192.0.2.10`。 |
| 会话数据库和 Catalog | 上述示例为 `lineage_demo` 和 `internal`；它们是会话上下文，不一定等于目标表所在位置。 |
| 执行状态 | 成功的 DML 通常记录为 `OK`。 |
| 时间戳和耗时 | 事件创建时间和从查询开始到事件创建的毫秒数；无法取得时为 `-1`。 |
| 外部 Catalog 属性 | 记录查询涉及的外部 Catalog 的非敏感属性。密码、密钥和隐藏属性会被删除；仅使用 `internal` Catalog 时该 map 为空。 |

该示例的原始 SQL 是上述复杂 Insert，Source Command 为 `InsertIntoTableCommand`，会话数据库为 `lineage_demo`，会话 Catalog 为 `internal`，成功状态为 `OK`。Query ID、用户、客户端 IP、事件时间戳和耗时使用实际执行上下文中的值；因为示例只使用 Internal Catalog，外部 Catalog 属性 map 为空。

在插件的下游系统中确认已收到事件。首次部署时，还应检查 `fe.log` 是否出现 `Loaded lineage plugin`，以及插件自身错误或队列满 warning。

![LineageInfo 事件模型：目标和源表形成直接、间接血缘，并与查询上下文一起由插件转换为下游系统事件。](/images/data-lineage/lineage-event-model-zh-CN.svg)

提取器会在事件到达插件前解析 CTE 生产者表达式，并展开 `UNION` 的各分支。下游插件需要将 `TableIf`、`SlotReference` 和 `Expression` 等 Doris Java 对象转换为稳定标识或自身事件格式。

### 事件处理行为

`lineage_event_queue_size` 设置每个 FE 进程本地队列能够等待处理的最大血缘事件数，单位是事件数，不是字节数。队列满时，系统会丢弃新事件，DML 正常继续。工作线程串行调用插件，慢插件会延迟后续事件，并可能在持续负载下造成事件丢弃。插件抛出的异常会被记录，不会停止工作线程，也不会影响 DML。

插件发现和初始化只在 FE 启动时进行，不支持动态 reload 或 unload。

## 配置和使用

### 前提条件

1. 准备外部血缘插件。Doris 不提供内置 sink。SPI 契约、JAR 打包方式和完整最小插件示例请参阅[数据血缘插件开发](/zh-CN/community/developer-guide/data-lineage-plugin-development)。
2. 将插件 JAR 及所需第三方依赖 JAR 复制到每个 FE。
3. 如果插件需要向外部治理服务发送事件，确保每个可能执行 DML 的 FE 都可以访问该服务端点。

### 部署插件

`FE_HOME` 表示包含 `bin/`、`conf/` 和 `lib/` 的单个 FE 安装目录。在每个 FE 上使用以下目录结构。加载器只扫描 `lineage/` 下的直接子目录，以及插件目录和其 `lib/` 目录中的 JAR。

```text
$FE_HOME/plugins/
└── lineage/
    └── example-lineage/
        ├── example-lineage.jar
        └── lib/
            └── downstream-client.jar
```

在每个 FE 的 `fe.conf` 中配置。将 `example-lineage` 替换为插件 Factory 的 `name()` 返回值：

```text
plugin_dir = /opt/apache-doris/fe/plugins
activate_lineage_plugin = example-lineage
lineage_event_queue_size = 50000
```

| 配置 | 类型和默认值 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `plugin_dir` | String；`$FE_HOME/plugins` | 否 | 插件根目录。血缘加载器扫描其 `lineage/` 直接子目录。使用默认目录时可以省略该配置。 |
| `activate_lineage_plugin` | String 数组；空 | 建议显式填写 | 需要实例化的 Factory 名称，以英文逗号分隔。空值表示不过滤，会实例化全部已发现的 Factory。 |
| `lineage_event_queue_size` | 正整数；`50000` | 否 | 当前 FE 等待工作线程处理的最大血缘事件数。队列满时丢弃新事件。 |

三个参数都在各 FE 节点的 `$FE_HOME/conf/fe.conf` 中配置，作用范围是当前 FE 进程。它们都只在 FE 启动时生效，修改后必须重启对应 FE。

#### 激活插件

在每个 FE 节点的 `$FE_HOME/conf/fe.conf` 中配置 `activate_lineage_plugin`。它控制哪些已发现的 Factory 会被实例化，不负责发现 JAR，也不控制队列容量。名称必须与 `LineagePluginFactory.name()` 完全一致并区分大小写；插件实现的 `LineagePlugin.name()` 应返回相同名称。插件目录名不参与匹配。配置多个插件时使用英文逗号分隔；FE 配置解析器会去除各项两侧的空格，但名称匹配仍区分大小写：

```text
activate_lineage_plugin = example-lineage,governance-lineage
```

FE 启动时会发现内置和外部 Factory，然后只为配置中列出的名称创建插件实例。每个 FE 独立读取该配置，因此所有可能执行 DML 的 FE 都需要配置相同的插件集合。修改后必须重启 FE，不支持通过 `ADMIN SET FRONTEND CONFIG` 动态修改。

:::caution 空值行为

当前实现中，`activate_lineage_plugin` 为空并不表示关闭血缘插件，而是跳过名称筛选并实例化全部已发现的 Factory。应显式填写需要启用的插件名称，不要把空值当作禁用开关。插件实例加载后，`eventFilter()` 仍会在提取前和分发前决定是否接收事件。

:::

#### 配置事件队列

在每个 FE 节点的 `$FE_HOME/conf/fe.conf` 中配置 `lineage_event_queue_size`。该参数必须是正整数，每个可能执行 DML 的 FE 都有自己的独立队列，因此需要分别配置。

该参数是 FE 启动配置，不支持通过 `ADMIN SET FRONTEND CONFIG` 动态修改。修改后必须重启对应 FE。增大参数只会提高待处理事件的缓冲能力和 FE 内存占用，不会增加消费线程数，也不会提高插件处理速度。出现事件丢失时，应先在 `fe.log` 中搜索 `the lineage event queue is full`，并优先降低插件 `exec()` 的处理延迟，再根据峰值积压量和 FE 内存容量调整队列大小。

修改其他插件配置或替换插件 JAR 后，也必须重启每个 FE。这些配置和插件目录只在 FE 启动时读取。

## 运维和排障

### 写入后没有事件

常见原因包括语句不受支持、DML 执行失败、当前 FE 没有加载插件，或者插件的 `eventFilter()` 返回了 `false`。

按以下顺序检查：

1. 确认语句是成功执行的 `INSERT INTO ... SELECT`、`INSERT OVERWRITE TABLE ... SELECT` 或 `CREATE TABLE AS SELECT`。仅包含 `VALUES` 的 Insert 不会生成事件。
2. 确认执行该 DML 的 FE 已配置并加载插件，在 `fe.log` 中搜索 `Loaded lineage plugin`。
3. 确认插件的 `eventFilter()` 在查询线程和工作线程中都返回 `true`。
4. 检查插件日志和下游服务，确认事件不是在 FE 之外处理失败。

### 插件未加载

检查插件目录中是否存在 JAR，以及 JAR 中是否包含 `META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory`。每个插件目录只能提供一个 Factory，Factory 名称必须全局唯一，并且应与 `activate_lineage_plugin` 中的名称一致。修正目录、JAR 或配置后重启对应 FE。

### 高负载下事件缺失

在 `fe.log` 中搜索 `the lineage event queue is full` 和插件异常。如果队列已满，先减少插件 `exec()` 中的同步阻塞，使下游投递具备幂等性和有界重试，再评估是否增大 `lineage_event_queue_size`。增大队列前需要评估 FE 内存，因为不同 SQL 产生的事件大小并不固定。

还应确认所有可能执行 DML 的 FE 都部署了相同插件和配置。每个 FE 使用独立的本地队列，一个 FE 上的插件和队列状态不会自动同步到其他 FE。

### 更新插件后未生效

插件目录只在 FE 启动时扫描，不支持动态 reload 或 unload。替换插件 JAR、依赖或配置后，重启每个相关 FE，并再次检查 `Loaded lineage plugin` 日志。

应使用 Query ID 和目标表等信息构造下游事件标识。这样，即使插件在框架外实现重试，治理系统也可以对事件去重。

## 相关文档

- [数据血缘插件开发](/zh-CN/community/developer-guide/data-lineage-plugin-development)
