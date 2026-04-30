---
{
    "title": "Load High Availability",
    "language": "en",
    "description": "Introduces the majority-write strategy for Doris data loading and the minimum load replica number (min_load_replica_num) configuration to improve load high availability.",
    "keywords": [
        "Doris load high availability",
        "majority write",
        "minimum load replica number",
        "min_load_replica_num",
        "replication_num",
        "replica unavailable",
        "load failure",
        "data reliability"
    ]
}
---

<!-- Knowledge type: Architecture decision + Configuration parameter -->
<!-- Applicable scenarios: Partial replicas unavailable / Improving load availability / Fault tolerance -->

Doris provides multiple mechanisms to ensure high availability during data loading. This document explains the default load behavior of Doris in detail, along with additional options provided to improve load availability, especially the **Minimum Load Replica Number (Min Load Replica Num)** feature.

After reading this document, you will be able to:

- Understand the default majority-write strategy of Doris and how it works.
- Improve the load success rate when some replicas are unavailable by using the minimum load replica number.
- Master both table-level and global configuration methods, and the priority relationship between them.

## Applicable Scenarios

| Scenario | Recommended Strategy | Description |
| --- | --- | --- |
| Highest requirement on data reliability | Default majority write | A load is considered successful only when most replicas are written successfully |
| Some BE nodes are temporarily unavailable | Set `min_load_replica_num` | Allow loads to succeed with fewer than majority replicas written |
| High requirement on load speed | Set `min_load_replica_num` | Favor availability over consistency |

## Default Majority-Write Strategy

By default, Doris uses a majority-write strategy to ensure data reliability and consistency:

- A load is considered successful when the number of replicas written successfully **exceeds half of the total number of replicas**.
- For example, for a table with three replicas, at least 2 replicas must be written successfully for the load to succeed.

### How It Works

The execution flow of majority write is as follows:

1. **Data distribution**: The load task first distributes the data to all relevant BE nodes.
2. **Parallel writing**: Each BE node processes the data write operation in parallel.
3. **Write acknowledgement**: After completing the data write, each BE node sends an acknowledgement to the FE.
4. **Majority check**: The FE counts the number of replicas successfully written. When the count reaches a majority, the load is considered successful.
5. **Transaction commit**: The FE commits the load transaction, making the data visible externally.
6. **Asynchronous replication**: For replicas that were not written successfully, the system asynchronously replicates the data in the background to ensure eventual consistency across all replicas.

The majority-write strategy is a balance between data reliability and system availability in Doris. For scenarios with special requirements, Doris provides other options such as the minimum load replica number to further improve system flexibility.

## Minimum Load Replica Number

While the majority-write strategy ensures data reliability, it can also affect system availability in some scenarios. For example, with two replicas, both must be written successfully for the load to complete, which means no replica can be unavailable during the load.

To address this issue and improve load availability, Doris provides the **Minimum Load Replica Number (Min Load Replica Num)** option.

### Feature Description

The minimum load replica number allows you to specify the minimum number of replicas that must be written successfully when loading data. **A load is considered successful when the number of replicas written successfully is greater than or equal to this value.**

### Typical Use Cases

- When some nodes are unavailable, the data still needs to be loaded successfully.
- When you have a high requirement on load speed and are willing to sacrifice some consistency for higher availability.

### Configuration Methods

The minimum load replica number supports both **per-table configuration** and **global configuration**.

#### 1. Per-Table Configuration

**Method A: Set at table creation**

Specify `min_load_replica_num` in the `PROPERTIES` of the `CREATE TABLE` statement:

```sql
CREATE TABLE example_table
(
    id INT,
    name STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES
(
    'replication_num' = '3',
    'min_load_replica_num' = '2'
);
```

**Method B: Modify an existing table**

Adjust dynamically with `ALTER TABLE`:

```sql
ALTER TABLE example_table
SET ( 'min_load_replica_num' = '2' );
```

#### 2. Global Configuration

Set through the FE configuration item `min_load_replica_num`:

| Item | Value |
| --- | --- |
| Configuration item | `min_load_replica_num` |
| Valid values | Greater than 0 |
| Default value | `-1` (indicates that the global minimum load replica number is disabled) |

For viewing and modifying FE configuration items, refer to the [FE Configuration Documentation](../../../admin-manual/config/fe-config.md).

### Configuration Priority

When both the table property and the global configuration are set, the following priority applies:

> **Table property > Global configuration > Default majority rule**

If the table property is not set or is invalid, and the global configuration is valid, the minimum load replica number for the table is:

```text
min(min_load_replica_num configured in FE, table replica count / 2 + 1)
```

## Other High Availability Mechanisms

In addition to the minimum load replica number option, Doris also adopts the following mechanisms to improve load availability:

| Mechanism | Function |
| --- | --- |
| Load retry | Automatically retries load tasks that fail due to temporary issues |
| Load balancing | Distributes load tasks across different BE nodes to avoid excessive pressure on a single node |
| Transaction mechanism | Ensures data consistency and automatically rolls back on failure |

## FAQ

**Q1: Can `min_load_replica_num` be greater than `replication_num`?**

No. The semantics of the minimum load replica number is "the minimum number of replicas that must be written successfully during a load," and it should be less than or equal to the total number of replicas. When the global configuration takes effect, the system automatically takes `min(min_load_replica_num configured in FE, table replica count / 2 + 1)`.

**Q2: After enabling `min_load_replica_num`, will replicas that were not written successfully lose data?**

No. After the load is committed, replicas that were not written successfully will be eventually filled in through background asynchronous replication, ensuring consistency across replicas.

**Q3: When should I use `min_load_replica_num`?**

You can enable this option when some BE nodes are temporarily unavailable, replica scheduling is not yet complete, or the load availability requirement is higher than strong consistency, to ensure that loads are not blocked by a small number of replica anomalies.

**Q4: Which one takes effect when both the table property and the global configuration are set?**

The **table property** takes precedence. The global configuration is used only when the table property is not set or is invalid. If neither is set, the system falls back to the default majority rule.
