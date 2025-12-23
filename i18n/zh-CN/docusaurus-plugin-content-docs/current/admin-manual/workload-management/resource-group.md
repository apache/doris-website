---
{
    "title": "Resource Group",
    "language": "zh-CN",
    "description": "Resource Group 是存算一体架构下，实现不同的负载之间物理隔离的一种机制，它的基本原理如下图所示："
}
---

Resource Group 是存算一体架构下，实现不同的负载之间物理隔离的一种机制，它的基本原理如下图所示：

![Resource Group](/images/resource_group.png)

- 通过 Tag 的方式，把 BE 划分为不同的组，每个组通过 tag 的名字来标识，比如上图中把 host1,host2,host3 都设置为 group a, 把 host4,host5 都设置为 group b；
- 将表的不同的副本放到不同的分组中，比如上图中 table1 有 3 个副本，都位于 group a 中，table2 有 4 个副本，其中 2 个位于 group a 中，2 个副本位于 group b 中；
- 在查询时，根据不同的用户，使用不同的 Resource Group，比如 online 用户，只能访问 host1,host2,host3 上的数据，所以他可以访问 table1 和 table2；但是 offline 用户只能访问 host4，host5，所以只能访问 table2 的数据，由于 table1 在 group b 上没有对应的副本，所以访问会出错。

Resource Group 本质上是一种 Table 副本的放置策略，所以它有以下优势和限制：
- 不同的 Resource Group 使用的是不同的 BE，所以它们之间完全无干扰，即使一个 group 内的某个 BE 宕机了，也不会影响其他 Group 的查询；由于导入需要多副本成功，所以如果剩下的副本数量不满足 Quorum，那么导入还是会失败；
- 每个 Resource Group 至少要有一个 Table 的一个副本，比如如果要建立 5 个 Resource Group，并且每个 Resource Group 都可能访问所有的 Table，那么就需要 Table 有 5 个副本，会带来比较大的存储开销。

## 典型使用场景

- 读写隔离，可以将一个集群划分为两个 Resource Group，Offline Resource Group 用来执行 ETL 作业，Online Resource Group 负责在线查询；数据以 3 副本的方式存储，其中 2 个副本存放在 Online 资源组，1 个副本存放在 Offline 资源组。Online 资源组主要用于高并发低延迟的在线数据服务，而一些大查询或离线 ETL 操作，则可以使用 Offline 资源组中的节点执行。从而实现在统一集群内同时提供在线和离线服务的能力。
- 不同业务之间隔离，此时多个业务之间数据没有共享，可以为每个业务划分一个 Resource Group，多个业务之间没有任何干扰，这实际上是把多个物理集群合并到统一的一个大集群管理；
- 不同用户之间隔离，比如集群内有一张业务表需要共享给所有 3 个用户使用，但是希望能够尽量避免不同用户之间的资源抢占。则我们可以为这张表创建 3 个副本，分别存储在 3 个资源组中，为每个用户绑定一个资源组。

## 配置 Resource Group

### 为 BE 设置标签

   假设当前 Doris 集群有 6 个 BE 节点。分别为 host[1-6]。在初始情况下，所有 BE 节点都属于一个默认资源组（Default）。

   我们可以使用以下命令将这 6 个节点划分成 3 个资源组：group_a、group_b、group_c：

   ```sql
   alter system modify backend "host1:9050" set ("tag.location" = "group_a");
   alter system modify backend "host2:9050" set ("tag.location" = "group_a");
   alter system modify backend "host3:9050" set ("tag.location" = "group_b");
   alter system modify backend "host4:9050" set ("tag.location" = "group_b");
   alter system modify backend "host5:9050" set ("tag.location" = "group_c");
   alter system modify backend "host6:9050" set ("tag.location" = "group_c");
   ```

   这里我们将 `host[1-2]` 组成资源组 `group_a`，`host[3-4]` 组成资源组 `group_b`，`host[5-6]` 组成资源组 `group_c`。

   > 注：一个 BE 只能属于一个资源组。

### 按照资源组分配数据分布

   资源组划分好后可以将用户数据的不同副本分布在不同资源组。假设一张用户表 UserTable。我们希望在 3 个资源组内各存放一个副本，则可以通过如下建表语句实现：

   ```sql
   create table UserTable
   (k1 int, k2 int)
   distributed by hash(k1) buckets 1
   properties(
       "replication_allocation"="tag.location.group_a:1, tag.location.group_b:1, tag.location.group_c:1"
   )
   ```

   这样一来，表 UserTable 中的数据，将会以 3 副本的形式，分别存储在资源组 group_a、group_b、group_c 所在的节点中。

   下图展示了当前的节点划分和数据分布：

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

   当一个 DB 下有非常多的 Table 时，修改每个 Table 的分布策略是非常繁琐的，所以 Doris 还支持了在 database 层面设置统一的数据分布策略，但是 table 设置的优先级高于 database。比如有一个 db1, db1 下有四个 table，table1 需要的副本分布策略为 `group_a:1,group_b:2`，table2，table3, table4 需要的副本分布策略为 `group_c:1,group_b:2`

   那么可以使用如下语句创建 db1：

   ```sql
   CREATE DATABASE db1 PROPERTIES (
   "replication_allocation" = "tag.location.group_c:1, tag.location.group_b:2"
   )
   ```

   使用如下语句创建 table1：

   ```sql
   CREATE TABLE table1
   (k1 int, k2 int)
   distributed by hash(k1) buckets 1
   properties(
   "replication_allocation"="tag.location.group_a:1, tag.location.group_b:2"
   )
   ```

   table2，table3,table4 的建表语句无需再指定`replication_allocation`。

   :::caution 注意
   更改 database 的副本分布策略不会对已有的 table 产生影响。
   :::


## 为用户设置 ResourceGroup

   可以通过以下语句，限制 user1 只能使用 `group_a` 资源组中的节点进行数据查询，user2 只能使用 `group_b` 资源组，而 user3 可以同时使用 3 个资源组：

   ```sql
   set property for 'user1' 'resource_tags.location' = 'group_a';
   set property for 'user2' 'resource_tags.location' = 'group_b';
   set property for 'user3' 'resource_tags.location' = 'group_a, group_b, group_c';
   ```

   设置完成后，user1 在发起对 UserTable 表的查询时，只会访问 `group_a` 资源组内节点上的数据副本，并且查询仅会使用 `group_a` 资源组内的节点计算资源。而 user3 的查询可以使用任意资源组内的副本和计算资源。

   > 注：默认情况下，用户的 `resource_tags.location` 属性为空，在 2.0.2（含）之前的版本中，默认情况下，用户不受 tag 的限制，可以使用任意资源组。在 2.0.3 版本之后，默认情况下，普通用户只能使用 `default` 资源组。root 和 admin 用户可以使用任意资源组。

   :::caution 注意
   属性 `resource_tags.location` 每次修改完成之后，用户需要重新建立连接才能使变更生效。
   :::

   

## 导入作业的资源组分配

   导入作业（包括 insert、broker load、routine load、stream load 等）的资源使用可以分为两部分：
   
   1. 计算资源：负责读取数据源、数据转换和分发；
   
   2. 写入资源：负责数据编码、压缩并写入磁盘。

   由于写入资源必须是数据副本所在的节点，而计算资源可以选择任意节点完成，所以在导入的场景下，Resource Group 只能限制计算部分使用的资源。

