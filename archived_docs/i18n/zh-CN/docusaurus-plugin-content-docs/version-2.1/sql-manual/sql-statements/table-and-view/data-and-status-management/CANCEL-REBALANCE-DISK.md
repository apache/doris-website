---
{
    "title": "CANCEL REBALANCE DISK",
    "language": "zh-CN",
    "description": "CANCEL REBALANCE DISK 语句用于取消优先均衡 BE（Backend）节点的磁盘数据。该语句具有以下功能："
}
---

## 描述

`CANCEL REBALANCE DISK` 语句用于取消优先均衡 BE（Backend）节点的磁盘数据。该语句具有以下功能：

- 可以取消指定 BE 节点的优先磁盘均衡
- 可以取消整个集群所有 BE 节点的优先磁盘均衡
- 取消后系统仍会以默认调度方式均衡 BE 的磁盘数据

## 语法

```sql
ADMIN CANCEL REBALANCE DISK [ ON ( "<host>:<port>" [, ... ] ) ];
```

## 可选参数

**1. `"<host>:<port>"`**

> 指定需要取消优先磁盘均衡的 BE 节点列表。
>
> 每个节点由主机名（或 IP 地址）和心跳端口组成。
>
> 如果不指定此参数，则取消所有 BE 节点的优先磁盘均衡。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                           |
| :---------------- | :------------- | :-------------------------------------- |
| ADMIN             | 系统          | 用户必须拥有 ADMIN 权限才能执行该命令    |

## 注意事项

- 该语句仅表示系统不再优先均衡指定 BE 的磁盘数据，系统仍会以默认调度方式均衡 BE 的磁盘数据。
- 执行该命令后，之前设置的优先均衡策略将立即失效。

## 示例

- 取消集群所有 BE 的优先磁盘均衡：

    ```sql
    ADMIN CANCEL REBALANCE DISK;
    ```

- 取消指定 BE 的优先磁盘均衡：

```sql
ADMIN CANCEL REBALANCE DISK ON ("192.168.1.1:1234", "192.168.1.2:1234");
```
