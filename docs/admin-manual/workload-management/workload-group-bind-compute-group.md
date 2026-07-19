---
{
    "title": "Bind Workload Group to Compute Group: Resource Isolation Across Workloads",
    "sidebar_label": "Bind Workload Group to Compute Group",
    "language": "en",
    "description": "Learn how to bind a Workload Group to a specific Compute Group in Apache Doris to manage independent resource quotas for different workloads, applicable to both storage-compute separation and storage-compute integrated architectures.",
    "keywords": ["Workload Group", "Compute Group", "Resource Group", "resource isolation", "multi-tenancy", "resource management", "storage-compute separation"]
}
---

<!-- Knowledge type: Concept + Procedure -->

## Why Bind Workload Group to Compute Group

Doris supports logically grouping BE nodes within a cluster through **Compute Group**, forming independent sub-clusters that isolate compute resources across different workloads.

In earlier versions, **a Workload Group took effect globally across all Compute Groups**, forcing different workloads to share the same set of resource quota configurations. For example:

- Workload A and Workload B each created their own Workload Group, and the sum of their resource quotas already reached 100%.
- Workload A could not create any additional Workload Group.
- The two workloads had significantly different Workload Group configuration needs, but the old architecture could not manage them independently per workload.

To address this, the current version introduces the **Bind Workload Group to Compute Group** mechanism, which lets each Compute Group maintain its own independent set of Workload Group configurations.

## Relationship Between Compute Group and Resource Group

<!-- Knowledge type: Concept definition -->

| Architecture type | Corresponding concept | Description |
|---------|---------|------|
| Storage-compute separation | Compute Group | Logical partitioning unit for independent sub-clusters |
| Storage-compute integrated | Resource Group | Functionally equivalent to Compute Group |

When discussing resource management, you can treat the two as logically equivalent concepts. **All descriptions in this document about binding a Workload Group to a Compute Group apply to both storage-compute separation and storage-compute integrated architectures.**

## How It Works

<!-- Knowledge type: Concept -->

### Design in Earlier Versions

Assume the cluster has Compute Group A (serving Workload A) and Compute Group B (serving Workload B), along with two Workload Groups, `group_a` and `group_b`, whose resource quotas sum to 100%.

In earlier versions, `group_a` and `group_b` took effect on **all BE nodes** and were not restricted by Compute Group boundaries, as shown below:

![Earlier version: Workload Group takes effect globally](/images/wg_bind_cg1.png)

This led to:

- After Workload A created `group_a`, the resource quota was full, and no additional Workload Group could be created.
- The Workload Group configurations of the two workloads affected each other, making differentiated management difficult.

### Design in the Current Version

In the current version, a Workload Group can be bound to a specific Compute Group. **Different Compute Groups have their own independent Workload Group configurations**, as shown below:

![Current version: Workload Group isolated by Compute Group](/images/wg_bind_cg2.png)

## Usage

<!-- Knowledge type: Procedure -->

:::tip Default Compute Group
Doris has a default Compute Group mechanism: when a new BE node is added without specifying its affiliation, the node is automatically placed into the default Compute Group.

| Architecture type | Default Compute Group name |
|---------|----------------------|
| Storage-compute separation | `default_compute_group` |
| Storage-compute integrated | `default` |
:::

:::caution Behavior of the `FOR` clause differs between architectures
- **Cloud (storage-compute decoupled) mode**: CREATE / ALTER / DROP WORKLOAD GROUP **must** explicitly include the `FOR <compute_group>` clause. Omitting it raises: `Must specify compute group via 'FOR <compute_group>' in cloud mode.`
- **Non-cloud (storage-compute coupled) mode**: The `FOR <compute_group>` clause is optional. The value here actually refers to a resource group (Tag) rather than a real compute group — the grammar is shared with cloud mode purely for consistency. When omitted, it defaults to the default resource group (`default`).
:::

### Create a Workload Group

**Bind to a specific Compute Group:**

```sql
CREATE WORKLOAD GROUP group_a FOR compute_group_a PROPERTIES ('cpu_share'='1024');
```

**Without specifying a Compute Group (non-cloud mode only, binds to the default resource group):**

```sql
CREATE WORKLOAD GROUP group_a PROPERTIES ('cpu_share'='1024');
```

### Drop a Workload Group

**Drop from a specific Compute Group:**

```sql
DROP WORKLOAD GROUP group_a FOR compute_group_a;
```

**Without specifying a Compute Group (non-cloud mode only, drops from the default resource group):**

```sql
DROP WORKLOAD GROUP group_a;
```

### Alter Workload Group Properties

**Alter the properties of a Workload Group in a specific Compute Group:**

```sql
ALTER WORKLOAD GROUP group_a FOR compute_group_a PROPERTIES ('cpu_share'='2048');
```

**Without specifying a Compute Group (non-cloud mode only, alters the Workload Group in the default resource group):**

```sql
ALTER WORKLOAD GROUP group_a PROPERTIES ('cpu_share'='2048');
```

:::note
The `ALTER` statement is used only to modify the properties of a Workload Group. **It cannot modify the binding relationship between a Workload Group and a Compute Group.**
:::

### Referencing a Workload Group from a Workload Policy

In the `workload_group` property of [CREATE WORKLOAD POLICY](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-POLICY) / [ALTER WORKLOAD POLICY](../../sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-POLICY), because a workload group belongs to a compute group, the value must follow these rules:

- **Cloud (storage-compute decoupled) mode**: The fully qualified form `<compute_group>.<workload_group>` is required, for example:

    ```sql
    CREATE WORKLOAD POLICY p1 CONDITIONS(query_time > 3000) ACTIONS(cancel_query)
    PROPERTIES('workload_group'='compute_group_a.wg1');
    ```

- **Non-cloud (storage-compute coupled) mode**: Both `<workload_group>` (default resource group) and `<resource_group>.<workload_group>` are accepted.

## Notes

<!-- Knowledge type: Constraints and limitations -->

1. **The binding relationship cannot be modified**: A Workload Group is assigned to a fixed Compute Group at creation time and cannot be migrated between Compute Groups.

2. **Upgrade behavior**: When upgrading from an earlier version to the current version, the system automatically creates a new Workload Group with the same name but a different ID for each Compute Group, based on existing Workload Groups. For example, if the earlier version had two Compute Groups and a `group_a`, after the upgrade each Compute Group gets its own new Workload Group named `group_a`, and the original `group_a` that did not belong to any Compute Group is automatically deleted.

3. **Privilege management is unchanged**: Privilege checks for Workload Groups are still performed by associating with the Workload Group name, and the management approach is the same as in earlier versions.

4. **Lifecycle of the `normal` Workload Group**: Doris has a default Workload Group named `normal`. Whenever a new Compute Group is created, the system automatically creates a corresponding `normal` Workload Group for it; when a Compute Group is dropped, the associated `normal` Workload Group is automatically dropped as well. The lifecycle of the `normal` Workload Group is fully managed by the system and requires no manual operation.
