---
{
    "title": "Data Lineage Technical Guide",
    "sidebar_label": "Data Lineage",
    "language": "en",
    "description": "Collect table-level and column-level lineage from supported Doris DML statements through an external LineagePlugin.",
    "keywords": ["Apache Doris", "data lineage", "data governance", "LineagePlugin", "column-level lineage"]
}
---

<!-- Knowledge type: Feature overview + technical design + user guide -->
<!-- Use cases: Data governance integration / impact analysis / compliance traceability -->

Data Lineage extracts table-level and column-level dependencies from supported Doris DML statements and sends them to external governance systems through a `LineagePlugin`. Doris is the lineage producer. It does not retain events, expose a lineage query API, or provide lineage visualization.

> This capability is available in the Dev version. It was first released in Apache Doris 4.0.6.

## Capabilities and limitations

The framework generates an event only after one of the following statements succeeds:

| Supported statement | Event behavior |
| --- | --- |
| `INSERT INTO ... SELECT` | Generates one event after the Insert succeeds. |
| `INSERT OVERWRITE ... SELECT` | Generates one event after the Overwrite succeeds. |
| `CREATE TABLE AS SELECT` | Generates one event after the internal Insert succeeds. |

The following operations do not generate an event: `SELECT`, `UPDATE`, `DELETE`, load jobs, `VALUES`-only inserts, and writes whose target is `__internal_schema`.

:::caution Delivery guarantee

Lineage delivery is asynchronous and best effort. A successful DML statement is not rolled back when event collection or plugin delivery fails. Events can be discarded when the queue is full, and Doris does not retry or persist them.

:::

## Technical design

### Collection flow

For a supported statement, Doris records the analyzed Nereids logical plan in an `afterAnalyze` planner hook. After the DML succeeds, Doris extracts lineage from that plan and submits the event to an FE-local queue. A single daemon worker dispatches the event to every active plugin.

![Data lineage collection architecture: successful supported DML statements are analyzed by Nereids, extracted into LineageInfo, queued in FE, and delivered by a plugin to an external governance system.](/images/data-lineage/lineage-architecture.svg)

Before extraction, Doris calls `eventFilter()` on the loaded plugins. If no plugin is willing to receive events, extraction is skipped. The worker evaluates `eventFilter()` again before dispatch.

### Lineage content

Each `LineageInfo` event contains table lineage, direct column lineage, two kinds of indirect lineage, and query context. The complete SQL example below establishes the source tables, target table, and result used by the following sections.

#### Example SQL and result

The current user must have privileges to create a database and tables, write data, and query data, and the FE must have loaded a lineage plugin. The example uses two source tables and creates a customer summary through a CTE, Join, filters, aggregation, a window function, a conditional expression, and sorting.

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

The query returns:

```text
+-------------+--------------+--------------+--------------+--------------+
| customer_id | region_label | total_amount | customer_seq | region_group |
+-------------+--------------+--------------+--------------+--------------+
|           1 | EAST         |       150.00 |            1 | CORE         |
|           2 | WEST         |        80.00 |            2 | OTHER        |
+-------------+--------------+--------------+--------------+--------------+
```

The two `VALUES`-only inserts do not generate lineage events. The `INSERT INTO lineage_customer_summary ... SELECT` statement generates one `LineageInfo` event, whose contents are described below.

#### Table lineage

Table lineage records one target table and every source table scanned by the analyzed logical plan. The query that writes `lineage_customer_summary` scans both `lineage_orders` and `lineage_customers`, so both source tables have a table-level relationship with the target. A CTE is resolved to its underlying tables, and every `UNION` branch contributes to the source-table set.

This example produces the following table lineage:

| Source table | Target table |
| --- | --- |
| `lineage_orders` | `lineage_customer_summary` |
| `lineage_customers` | `lineage_customer_summary` |

#### Direct column lineage

Direct column lineage describes which source expression produces each target-column value. After resolving aliases and CTEs, Doris classifies expressions in this order: an expression containing an aggregate function is `AGGREGATION`; a plain source-column reference is `IDENTITY`; every other expression is `TRANSFORMATION`.

| Type | Meaning | Example |
| --- | --- | --- |
| `IDENTITY` | The target value is taken directly from a source column without a function or operation. | `lineage_customer_summary.customer_id` comes directly from `lineage_orders.customer_id`. |
| `TRANSFORMATION` | A non-aggregate expression transforms the target value, such as arithmetic, a string function, a window function, or a conditional expression. | `region_label` comes from `UPPER(lineage_orders.region)`; `customer_seq` comes from `ROW_NUMBER()`. |
| `AGGREGATION` | The target value is produced by an expression that contains an aggregate function. It remains this type even when another expression wraps the aggregate. | `total_amount` comes from `SUM(lineage_orders.amount)`. |

This example produces the following direct column lineage:

| Target column | Source expression | Type |
| --- | --- | --- |
| `lineage_customer_summary.customer_id` | `lineage_orders.customer_id` | `IDENTITY` |
| `lineage_customer_summary.region_label` | `UPPER(lineage_orders.region)` | `TRANSFORMATION` |
| `lineage_customer_summary.total_amount` | `SUM(lineage_orders.amount)` | `AGGREGATION` |
| `lineage_customer_summary.customer_seq` | `ROW_NUMBER() OVER (ORDER BY lineage_orders.customer_id)` | `TRANSFORMATION` |
| `lineage_customer_summary.region_group` | `CASE WHEN UPPER(lineage_orders.region) = 'EAST' ... END` | `TRANSFORMATION` |

#### Dataset indirect lineage

Dataset indirect lineage records expressions that affect the complete result set without directly producing a target-column value. These dependencies are stored in an event-level map and can be applied to every target output column when needed.

| Type | Meaning | Example |
| --- | --- | --- |
| `JOIN` | Join conditions determine which source rows can be combined. | `lineage_orders.customer_id = lineage_customers.customer_id`. |
| `FILTER` | `WHERE` or `HAVING` conditions determine which rows or groups enter the result. | `status = 'PAID'`, `customer_level = 'VIP'`, and `HAVING SUM(amount) >= 50`. |
| `GROUP_BY` | Grouping expressions determine the granularity of aggregate results. | Group by `customer_id` and `UPPER(region)`. |
| `SORT` | `ORDER BY` or TopN expressions determine result order. | Sort by `total_amount DESC`, which resolves to `SUM(amount)`. |

This example produces the following dataset indirect lineage:

| Type | Example source expression in the event | Effect |
| --- | --- | --- |
| `JOIN` | `lineage_orders.customer_id = lineage_customers.customer_id` | Determines how orders match customers. |
| `FILTER` | `status = 'PAID'`, `customer_level = 'VIP'`, and `SUM(amount) >= 50` | The `WHERE` and `HAVING` predicates jointly determine which rows and groups enter the result. |
| `GROUP_BY` | `lineage_orders.customer_id` and `UPPER(lineage_orders.region)` | Determine the aggregation granularity for each customer and region. |
| `SORT` | `total_amount DESC`, resolved to `SUM(lineage_orders.amount)` | Determines the order of the Insert query result. |

#### Output indirect lineage

Output indirect lineage is attached only to the affected target column and does not apply to the other output columns.

| Type | Meaning | Example |
| --- | --- | --- |
| `WINDOW` | The `PARTITION BY` and `ORDER BY` inputs of a window function affect its output column. | `customer_seq` is produced by `ROW_NUMBER() OVER (ORDER BY customer_id)`, whose `WINDOW` dependency is `customer_id`. |
| `CONDITIONAL` | A `CASE` or `IF` condition, or the candidate expressions of `COALESCE`, affect its output column. | `region_group` is determined by `CASE WHEN region_label = 'EAST' ...`, whose `CONDITIONAL` dependency is that predicate. |

The window or conditional expression itself still appears in direct column lineage. For example, the direct type of `customer_seq` is `TRANSFORMATION`, and it also has `WINDOW` indirect lineage. The direct type of `region_group` is also `TRANSFORMATION`, and it also has `CONDITIONAL` indirect lineage.

This example produces the following output indirect lineage:

| Target column | Type | Source expression in the event | Effect |
| --- | --- | --- | --- |
| `customer_seq` | `WINDOW` | `lineage_orders.customer_id` | Serves as the window ordering input to `ROW_NUMBER()` and affects only `customer_seq`. |
| `region_group` | `CONDITIONAL` | `UPPER(lineage_orders.region) = 'EAST'` | Serves as the `CASE WHEN` condition and affects only `region_group`. |

The other three target columns have no output indirect lineage. Dataset-level `JOIN`, `FILTER`, `GROUP_BY`, and `SORT` dependencies still affect the complete result set.

#### Query context

Query context identifies who produced the lineage event, in which session, and through which DML statement.

| Field | Example or meaning |
| --- | --- |
| Source Command | `InsertIntoTableCommand`, indicating that the event comes from an Insert. |
| Query ID and original SQL | The Query ID and the complete `INSERT INTO lineage_customer_summary ...` text. |
| User and client IP | For example, `lineage_user` and `192.0.2.10`. |
| Session database and catalog | `lineage_demo` and `internal` in this example. They describe session context and do not necessarily identify the target-table location. |
| Execution state | A successful DML statement normally records `OK`. |
| Timestamp and duration | The event creation time and the milliseconds from query start to event creation. The value is `-1` when unavailable. |
| External catalog properties | Non-sensitive properties from external catalogs referenced by the query. Passwords, keys, and hidden properties are removed. The map is empty when only the `internal` catalog is used. |

For this example, the original SQL is the complex Insert above, the Source Command is `InsertIntoTableCommand`, the session database is `lineage_demo`, the session catalog is `internal`, and the successful state is `OK`. The Query ID, user, client IP, timestamp, and duration use values from the actual execution context. Because the example uses only the Internal Catalog, the external catalog properties map is empty.

Confirm in the plugin's downstream system that the event was received. During initial deployment, also check `fe.log` for `Loaded lineage plugin`, plugin-specific errors, and queue-full warnings.

![LineageInfo event model: target and source tables feed direct and indirect lineage, which are combined with query context before a plugin converts the event for a downstream system.](/images/data-lineage/lineage-event-model.svg)

The extractor resolves CTE producer expressions and expands `UNION` branches before the event is delivered. A downstream plugin must convert Doris Java objects such as `TableIf`, `SlotReference`, and `Expression` to stable identifiers or its own event schema.

### Event processing behavior

`lineage_event_queue_size` sets the maximum number of lineage events waiting in each FE-local queue. It counts events, not bytes. When the queue is full, the new event is discarded and the DML continues normally. The worker invokes plugins serially, so a slow plugin delays later events and can cause drops under sustained load. Exceptions thrown by a plugin are logged and do not stop the worker or affect the DML.

Plugin discovery and initialization occur only when FE starts. Dynamic reload and unload are not supported.

## Configure and use

### Prerequisites

1. Prepare an external lineage plugin. Doris does not ship a built-in sink. For the SPI contract, JAR packaging, and a complete minimal plugin, see [Data Lineage Plugin Development](/community/developer-guide/data-lineage-plugin-development).
2. Copy the plugin JAR and any required third-party dependency JARs to every FE.
3. If the plugin sends events to an external governance service, make sure that service is reachable from every FE that can execute the DML.

### Deploy the plugin

`FE_HOME` denotes a single FE installation directory that contains `bin/`, `conf/`, and `lib/`. Use the following layout on every FE. The loader scans only direct child directories under `lineage/`, plus JARs in each plugin directory and its `lib/` directory.

```text
$FE_HOME/plugins/
└── lineage/
    └── example-lineage/
        ├── example-lineage-plugin.jar
        └── lib/
            └── downstream-client.jar
```

Configure `fe.conf` on every FE. Replace `example-lineage` with the value returned by the plugin factory's `name()` method:

```text
plugin_dir = /opt/apache-doris/fe/plugins
activate_lineage_plugin = example-lineage
lineage_event_queue_size = 50000
```

| Configuration | Type and default | Required | Description |
| --- | --- | --- | --- |
| `plugin_dir` | String; `$FE_HOME/plugins` | No | Plugin root directory. The lineage loader scans its direct children under `lineage/`. Omit this setting when using the default directory. |
| `activate_lineage_plugin` | String array; empty | Explicit configuration recommended | Comma-separated Factory names to instantiate. An empty value disables name filtering and instantiates all discovered factories. |
| `lineage_event_queue_size` | Positive integer; `50000` | No | Maximum pending lineage events on the current FE. New events are discarded when the queue is full. |

All three settings are configured in `$FE_HOME/conf/fe.conf` on each FE and apply only to that FE process. They are read only at FE startup, so restart the corresponding FE after changing them.

#### Activate plugins

Configure `activate_lineage_plugin` in `$FE_HOME/conf/fe.conf` on every FE. It controls which discovered factories are instantiated. It does not discover JARs or control queue capacity. Each name is case-sensitive and must exactly match `LineagePluginFactory.name()`. The `LineagePlugin.name()` implementation should return the same name. The plugin directory name is not used for matching. Separate multiple plugin names with commas; FE trims surrounding spaces:

```text
activate_lineage_plugin = example-lineage,governance-lineage
```

At startup, FE discovers built-in and external factories, then creates instances only for the configured names. Each FE reads its own configuration, so every FE that can execute DML must use the same plugin set. Restart FE after a change. This setting cannot be changed dynamically through `ADMIN SET FRONTEND CONFIG`.

:::caution Empty value behavior

In the current implementation, an empty `activate_lineage_plugin` value does not disable lineage plugins. It skips name filtering and instantiates every discovered factory. Explicitly list the plugins to enable, and do not use an empty value as a disable switch. After a plugin is loaded, `eventFilter()` still decides whether it receives an event before extraction and before dispatch.

:::

#### Configure the event queue

Configure `lineage_event_queue_size` in `$FE_HOME/conf/fe.conf` on every FE. It must be a positive integer. Each FE that can execute DML has an independent queue and must be configured separately.

This is an FE startup setting and cannot be changed dynamically through `ADMIN SET FRONTEND CONFIG`. Restart the corresponding FE after changing it. Increasing the value increases pending-event capacity and FE memory usage. It does not add consumer threads or increase plugin processing throughput. When events are missing, first search `fe.log` for `the lineage event queue is full` and reduce latency in the plugin's `exec()` method. Then size the queue according to peak backlog and available FE memory.

Restart every FE after changing other plugin settings or replacing plugin JARs. Plugin configuration and directories are read only at FE startup.

## Operate and troubleshoot

### No event after a write

Common causes include an unsupported statement, a failed DML statement, no plugin loaded on the current FE, or `eventFilter()` returning `false`.

Check in this order:

1. Confirm that the statement is a successful `INSERT INTO ... SELECT`, `INSERT OVERWRITE ... SELECT`, or `CREATE TABLE AS SELECT`. A `VALUES`-only Insert does not generate an event.
2. Confirm that the FE that executed the DML has configured and loaded the plugin. Search `fe.log` for `Loaded lineage plugin`.
3. Confirm that the plugin's `eventFilter()` returns `true` in both the query thread and the worker thread.
4. Check plugin logs and the downstream service to confirm that processing did not fail outside FE.

### Plugin not loaded

Confirm that the plugin directory contains a JAR and that the JAR contains `META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory`. Each plugin directory can expose only one Factory. Factory names must be globally unique and must match `activate_lineage_plugin`. Restart the corresponding FE after correcting the directory, JAR, or configuration.

### Missing events under high load

Search `fe.log` for `the lineage event queue is full` and plugin exceptions. If the queue is full, first reduce synchronous blocking in `exec()`, and make downstream delivery idempotent with bounded retries. Then evaluate whether to increase `lineage_event_queue_size`. Before increasing it, account for FE memory because event sizes vary by SQL statement.

Also confirm that every FE that can execute DML has the same plugin and configuration. Each FE uses an independent local queue; plugin and queue state are not synchronized across FEs.

### Plugin update did not take effect

Plugin directories are scanned only when FE starts. Dynamic reload and unload are not supported. Restart every relevant FE after replacing plugin JARs, dependencies, or configuration, and check `Loaded lineage plugin` again.

Use the Query ID and target table to construct downstream event identifiers. This allows the governance system to deduplicate events even when the plugin implements retries outside the framework.

## Further reading

- [Data Lineage Plugin Development](/community/developer-guide/data-lineage-plugin-development)
