---
{
    "title": "Workload Group 绑定 Compute Group",
    "language": "zh-CN",
    "description": "Doris 支持通过 Compute Group 功能对集群内的 BE 资源进行逻辑划分，形成独立的子集群单元，从而实现不同业务方计算与存储资源的物理隔离。由于各业务方的负载特性差异显著，其对 Workload Group 的配置需求往往存在明显区别。"
}
---

## 背景
Doris 支持通过 Compute Group 功能对集群内的 BE 资源进行逻辑划分，形成独立的子集群单元，从而实现不同业务方计算与存储资源的物理隔离。由于各业务方的负载特性差异显著，其对 Workload Group 的配置需求往往存在明显区别。

在早期版本中，用户配置的 Workload Group 会全局生效于所有 Compute Group，这导致不同业务方被迫共享同一套 Workload Group 配置。例如，业务 A 的高并发查询与业务 B 的大规模数据分析可能需要完全不同的资源配额，而旧架构无法满足这种差异化需求，资源管理灵活性受限。

为此，最新版本引入 Workload Group 绑定 Compute Group 机制，允许每个 Compute Group 配置独立的 Workload Group。

## Compute Group概念介绍
Compute Group 最初作为存算分离架构下的核心概念，其设计目的是在单一集群内完成独立子集群的逻辑划分。而在存算一体架构中，具备同等功能的概念被称为 Resource Group，二者均能实现集群资源的隔离与分组管理。

在探讨 Doris 计算资源管理体系时，可将 Compute Group 与 Resource Group 视作逻辑等价的概念，这一认知能显著降低理解成本。而在具体的接口调用层面，二者仍保持原有的独立调用规范与使用逻辑不变。

因此在本文中提到的 Workload Group 绑定到的 Compute Group 的概念和用法，对于存算一体架构和存算分离架构都是适用的。

## 原理介绍
假设集群中存在两个 Compute Group，分别命名为 Compute Group A 与 Compute Group B，各自服务于业务方 A 和业务方 B，且两个业务体系完全独立运行。

与此同时，集群中配置了两个 Workload Group：业务 A 创建的 group_a 与业务 B 创建的 group_b，二者的资源配置配额之和恰好占满集群总资源的 100%。

### 之前版本的Workload Group设计
在之前的版本中，group_a 和 group_b 会在所有的 BE 节点生效，即使不同的BE之间已经根据 Compute Group 进行分组。
当业务A创建了 group_a 之后就无法再创建新的 Worload Group ，因为所有 Workload Group 的资源累加值已经达到100%；而 group_b 是业务B创建的 Worload Group，业务A和业务B是完全独立的业务方，因此业务A也无法访问和修改 group_b。

即便从权限策略上打通双方对 Workload Group 的使用权限，由于业务逻辑完全独立，两者在资源配置需求上仍可能存在显著差异（如业务 A 的高并发查询与业务 B 的批量计算需不同资源配比），导致旧架构难以满足差异化管理需求。

![wg_bind_cg](/images/wg_bind_cg1.png)

### 当前版本的Workload Group设计
在最新的版本中，Workload Group支持绑定到Compute Group，这意味着不同的Compute Group可以有不同的Workload Group配置。如下图所示：

![wg_bind_cg](/images/wg_bind_cg2.png)

## 使用方法

:::tip
Doris 中设有默认 Compute Group 机制：当用户新增 BE 节点且未指定归属时，该节点将自动划分至默认 Compute Group。具体而言，在存算分离架构下，默认 Compute Group 的名称为 default_compute_group；而在存算一体架构中，其名称则为 default。
:::

1. 创建一个名为 group_a 的 Workload Group，并把它绑定到名为compute_group_a的 Compute Group 上。
```
create workload group group_a for compute_group_a properties('cpu_share'='1024')
```

2. 如果创建时不指定 Compute Group ，那么该 Workload Group 就会绑定到默认的 Compute Group 上。
```
create workload group group_a properties('cpu_share'='1024')
```

3. 删除 compue_group_a 中名为 group_a 的 Workload Group。
```
create workload group group_a for compute_group_a properties('cpu_share'='1024')
```

4. 如果删除 Workload Group 时不指定 Compute Group ，那么尝试从名为 default 的 Compute Group 中删除这个 Workload Group。
```
create workload group group_a properties('cpu_share'='1024')
```

5. 修改 Workload Group 的语句同理，需要在执行alter语句时指定 Compute Group ；如果不指定 Compute Group ，那么就会尝试修改默认 Compute Group 下的 Workload Group；需要注意的是alter语句只是修改 Workload Group的属性，并不能修改 Workload Group 和 Compute Group 的绑定关系。
```
alter workload group group_a for compute_group_a properties('cpu_share'='2048')
```

## 注意事项
1. 暂不支持对 Workload Group 与 Compute Group 之间的绑定关系进行修改。Workload Group 自创建时就归属于固定的 Compute Group， 无法实现 Workload Group 在 Compute Group 之间进行移动。
2. 在 Doris 从旧版本升级至新版本时，系统会基于旧版本的 Workload Group，为每个 Compute Group 自动创建同名但 id 不同的新 Workload Group。例如，若旧版本集群包含两个 Compute Group，且存在一个名为 group_a 的 Workload Group，升级后，Doris 将分别为这两个 Compute Group 各创建一个名为 group_a 的新 Workload Group，其 id 与原 Workload Group 不同，而原有未归属任何 Compute Group 的 group_a 则会被系统自动删除。
3. Workload Group的权限管理没有变化，Workload Group 的鉴权还是通过关联 Workload Group的名称实现的。
4. 在 Doris 中存在名为 normal 的默认 Workload Group。每当新建 Compute Group 时，Doris 会自动为其创建一个名为 normal 的 Workload Group；而当某个 Compute Group 被删除，与之对应的 normal Workload Group 也会被自动删除。这意味着，normal Workload Group 的生命周期管理均由 Doris 自动管理，无需人工介入操作。