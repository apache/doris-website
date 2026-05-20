---
{
    "title": "Resource Group：BE 节点物理隔离与资源组管理",
    "sidebar_label": "Resource Group",
    "language": "zh-CN",
    "description": "介绍如何通过 Resource Group 实现 BE 节点物理隔离，支持读写分离、多业务隔离和多用户隔离场景。",
    "keywords": [
        "Resource Group",
        "资源组",
        "物理隔离",
        "BE 标签",
        "tag.location",
        "读写分离",
        "多租户",
        "副本分布",
        "replication_allocation",
        "负载隔离"
    ]
}
---

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 多负载隔离 / 读写分离 / 多租户资源管理 -->

Resource Group 是存算一体架构下实现不同负载之间物理隔离的机制。它通过给 BE 节点打标签（Tag），将集群的节点划分为多个资源组，并将表副本按资源组分布，从而让不同用户或业务访问各自专属的计算与存储资源，互不干扰。

![Resource Group](/images/resource_group.png)

## 工作原理

Resource Group 本质上是一种**表副本的放置策略**，核心机制如下：

- 通过 Tag 将 BE 节点划分为不同的组，每个组以 Tag 名称标识（如 `group_a`、`group_b`）。
- 将表的不同副本放到不同的资源组中（如 table1 的 3 个副本全在 group_a，table2 的 4 个副本中 2 个在 group_a、2 个在 group_b）。
- 查询时根据用户绑定的资源组，限定其只能访问该组内节点上的副本和计算资源。

**优势与限制**：

| 维度 | 说明 |
|------|------|
| 故障隔离 | 不同资源组使用独立 BE，单组 BE 宕机不影响其他组的查询 |
| 导入限制 | 导入需要多副本写入成功；若剩余副本不满足 Quorum，导入仍会失败 |
| 存储开销 | 每个资源组至少需要表的一个副本；资源组越多，存储副本数越多 |

## 典型使用场景

<!-- 知识类型: 架构选型决策 -->

| 场景 | 说明 |
|------|------|
| **读写隔离** | 将集群划分为 Online 和 Offline 两个资源组。Online 用于高并发低延迟查询，Offline 用于 ETL 作业。数据以 3 副本存储，2 个在 Online 组，1 个在 Offline 组 |
| **多业务隔离** | 多个业务之间数据无共享，为每个业务划分独立资源组，相当于将多个物理集群合并为一个大集群统一管理 |
| **多用户隔离** | 共享同一张业务表，但为不同用户提供独立资源组，避免资源抢占。为表创建多个副本，分别存入对应资源组，每个用户绑定各自资源组 |

## 配置 Resource Group

<!-- 知识类型: 操作步骤 -->

### 前置条件

- 已部署存算一体模式的 Doris 集群，并有多个 BE 节点。
- 具备 `ALTER SYSTEM` 权限（通常为 admin 用户）。

### 流程总览

1. 为 BE 节点设置 Tag，划分资源组。
2. 建表时或修改表时，指定副本的资源组分布策略。
3. 为用户绑定资源组，限制其查询范围。

### 第一步：为 BE 节点设置标签

<!-- 知识类型: 操作步骤 -->

假设当前集群有 6 个 BE 节点（host1～host6），初始状态下所有节点属于默认资源组（Default）。

将 6 个节点划分为 3 个资源组：

```sql
alter system modify backend "host1:9050" set ("tag.location" = "group_a");
alter system modify backend "host2:9050" set ("tag.location" = "group_a");
alter system modify backend "host3:9050" set ("tag.location" = "group_b");
alter system modify backend "host4:9050" set ("tag.location" = "group_b");
alter system modify backend "host5:9050" set ("tag.location" = "group_c");
alter system modify backend "host6:9050" set ("tag.location" = "group_c");
```

执行后，`host[1-2]` 属于 `group_a`，`host[3-4]` 属于 `group_b`，`host[5-6]` 属于 `group_c`。

> 注：一个 BE 只能属于一个资源组。

### 第二步：按资源组分配副本

<!-- 知识类型: 配置参数 -->

资源组划分完成后，建表时通过 `replication_allocation` 属性指定各资源组存放的副本数。

**示例**：将 UserTable 的 3 个副本分别存放在 3 个资源组中：

```sql
create table UserTable
(k1 int, k2 int)
distributed by hash(k1) buckets 1
properties(
    "replication_allocation"="tag.location.group_a:1, tag.location.group_b:1, tag.location.group_c:1"
)
```

执行后，UserTable 的数据以 3 副本形式分别存储在 `group_a`、`group_b`、`group_c` 所在节点中。

当前节点划分与数据分布如下：

```text
┌────────────────────────────────────────────────────┐
│                                                    │
│         ┌──────────────────┐  ┌──────────────────┐ │
│         │ host1            │  │ host2            │ │
│         │  ┌─────────────┐ │  │                  │ │
│ group_a │  │   replica1  │ │  │                  │ │
│         │  └─────────────┘ │  │                  │ │
│         │                  │  │                  │ │
│         └──────────────────┘  └──────────────────┘ │
│                                                    │
├────────────────────────────────────────────────────┤
├────────────────────────────────────────────────────┤
│                                                    │
│         ┌──────────────────┐  ┌──────────────────┐ │
│         │ host3            │  │ host4            │ │
│         │                  │  │  ┌─────────────┐ │ │
│ group_b │                  │  │  │   replica2  │ │ │
│         │                  │  │  └─────────────┘ │ │
│         │                  │  │                  │ │
│         └──────────────────┘  └──────────────────┘ │
│                                                    │
├────────────────────────────────────────────────────┤
├────────────────────────────────────────────────────┤
│                                                    │
│         ┌──────────────────┐  ┌──────────────────┐ │
│         │ host5            │  │ host6            │ │
│         │                  │  │  ┌─────────────┐ │ │
│ group_c │                  │  │  │   replica3  │ │ │
│         │                  │  │  └─────────────┘ │ │
│         │                  │  │                  │ │
│         └──────────────────┘  └──────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

**在 Database 层面统一设置副本策略**

当一个 Database 下有大量 Table 时，逐表修改副本策略较为繁琐。Doris 支持在 Database 层面设置统一的副本分布策略，Table 级设置优先级高于 Database 级。

示例：db1 下有 4 张表，其中 table1 需要单独的副本策略，其余 3 张表使用 Database 默认策略：

创建 db1，设置默认副本策略为 `group_c:1, group_b:2`：

```sql
CREATE DATABASE db1 PROPERTIES (
    "replication_allocation" = "tag.location.group_c:1, tag.location.group_b:2"
)
```

创建 table1，覆盖为 `group_a:1, group_b:2`：

```sql
CREATE TABLE table1
(k1 int, k2 int)
distributed by hash(k1) buckets 1
properties(
    "replication_allocation"="tag.location.group_a:1, tag.location.group_b:2"
)
```

table2、table3、table4 的建表语句无需再指定 `replication_allocation`，自动继承 db1 的策略。

:::caution 注意
更改 Database 的副本分布策略不会对已有 Table 产生影响。
:::

### 第三步：为用户绑定资源组

<!-- 知识类型: 操作步骤 -->

通过 `set property` 语句限制用户只能使用指定资源组内的节点进行查询：

```sql
set property for 'user1' 'resource_tags.location' = 'group_a';
set property for 'user2' 'resource_tags.location' = 'group_b';
set property for 'user3' 'resource_tags.location' = 'group_a, group_b, group_c';
```

设置后，user1 查询 UserTable 时只访问 `group_a` 内节点的副本，且仅使用 `group_a` 的计算资源；user3 可使用任意资源组的副本和计算资源。

**版本差异说明**：

| 版本 | 默认行为 |
|------|----------|
| 2.0.2 及之前 | 用户 `resource_tags.location` 为空时，不受 Tag 限制，可使用任意资源组 |
| 2.0.3 及之后 | 普通用户默认只能使用 `default` 资源组；root 和 admin 用户可使用任意资源组 |

:::caution 注意
修改 `resource_tags.location` 属性后，用户需要重新建立连接才能使变更生效。
:::

## 导入作业的资源组分配

<!-- 知识类型: 配置参数 -->

导入作业（包括 INSERT、Broker Load、Routine Load、Stream Load 等）的资源使用分为两部分：

| 资源类型 | 职责 | 是否受资源组限制 |
|----------|------|------------------|
| 计算资源 | 读取数据源、数据转换和分发 | 是，Resource Group 限制计算资源使用范围 |
| 写入资源 | 数据编码、压缩并写入磁盘 | 否，写入资源由副本所在节点决定，无法限制 |

由于写入资源必须在数据副本所在的节点上执行，而计算资源可选择任意节点，因此在导入场景下，Resource Group 只能限制计算部分使用的资源。
