---
{
    "title": "DECOMMISSION BACKEND",
    "language": "zh-CN",
    "description": "该语句用于将 BE 节点安全地从集群中下线。该操作为异步操作。"
}
---

## 描述

该语句用于将 BE 节点安全地从集群中下线。该操作为异步操作。

## 语法

```sql
ALTER SYSTEM DECOMMISSION BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```

其中：

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```

## 必选参数

**1. <be_host>**

> 可以是 BE 节点的主机名或 IP 地址

**2. <heartbeat_port>**

> BE 节点的心跳端口，默认为 9050

**3. <backend_id>**

> BE 节点的 ID

:::tip
`<be_host>`、`<be_heartbeat_port>`及`<backend_id>`均可通过[SHOW BACKENDS](./SHOW-BACKENDS.md)语句查询获得。
:::

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限        | 对象 | 说明 |
|-----------|----|----|
| NODE_PRIV |    |    |

## 注意事项

1. 执行此命令后，可以通过[SHOW BACKENDS](./SHOW-BACKENDS.md)语句查看下线状态（`SystemDecommissioned`列的值为`true`）和下线进度（`TabletNum`列的值会缓慢降到 0）
2. 通常情况下，在`TabletNum`列的值会降到 0 后，此 BE 节点就会被删除，如果您不希望 Doris 自动删除 BE，可以更改 FE Master 的配置`drop_backend_after_decommission`为 false
3. 当前 BE 如果存储的数据量比较大，那么 DECOMMISSION 操作可能持续几个小时甚至是几天
4. 如果 DECOMMISSION 操作的进度卡住不动，具体表现为[SHOW BACKENDS](./SHOW-BACKENDS.md)语句中的`TabletNum`列一直固定在某个值，那么可能是以下的一些情况：
   - 当前 BE 上的 tablet 找不到合适的其他 BE 去迁移，比如在一个 3 节点的集群有一张 3 副本的表，要下线其中一个节点，那么该节点找不到其他 BE 可用来迁移数据（其他两个 BE 已经各有一个副本了）
   - 当前 BE 上的 tablet 还在[回收站](../../recycle/SHOW-CATALOG-RECYCLE-BIN.md)中，可以[清空回收站](../../recycle/DROP-CATALOG-RECYCLE-BIN.md)后，再等待
   - 当前 BE 上的 tablet 太大，导致在迁移单个 tablet 时，一直因为超时而无法将这个 tablet 迁移走，可以调整 FE Master 的配置`max_clone_task_timeout_sec`为一个更大的值（默认为 7200 秒）
   - 当前 BE 上的 tablet 存在未完成的事务，可以等事务完成或手动中止事务
   - 其他情况可以在 FE Master 的日志过滤`replicas to decommission`关键字，找出异常的 tablet，使用[SHOW TABLET](../../table-and-view/data-and-status-management/SHOW-TABLET.md)语句找到该 tablet 所属的表，然后重新建一张新的表，将数据从旧表迁移至新表，最后使用[DROP TABLE FORCE](../../table-and-view/table/DROP-TABLE.md)的方式将旧表删除掉

## 示例

1. 根据 BE 的 Host 和 HeartbeatPort 从集群中安全下线两个节点
   ```sql
   ALTER SYSTEM DECOMMISSION BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```

2. 根据 BE 的 ID 从集群中安全下线一个节点
    ```sql
    ALTER SYSTEM DECOMMISSION BACKEND "10002";
    ```
