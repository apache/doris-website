---
{
    "title": "ADD BROKER",
    "language": "zh-CN",
    "description": "该语句用于添加一个或者多个 BROKER 节点。"
}
---

## 描述

该语句用于添加一个或者多个 BROKER 节点。

## 语法

```sql
ALTER SYSTEM ADD BROKER <broker_name> "<host>:<ipc_port>" [,"<host>:<ipc_port>" [, ...] ];
```

## 必选参数
**1. `<broker_name>`**

给添加的 `broker` 进程起的名字。同一个集群中的 broker_name 建议保持一致。

**2. `<host>`**

需要添加的 `broker` 进程所在节点的 `IP` ，如果启用了 `FQDN`，则使用该节点的 `FQDN`。

**3. `<ipc_port>`**

需要添加的 `broker` 进程所在节点的 `PORT` ，该端口默认值为 `8000`。

## 输出字段
无

## 权限控制
执行该操作的用户需要具备 `NODE_PRIV` 的权限。

## 示例

1. 增加两个 Broker

    ```sql
    ALTER SYSTEM ADD BROKER "host1:port", "host2:port";
    ```
2. 增加一个 Broker，使用 FQDN

    ```sql
    ALTER SYSTEM ADD BROKER "broker_fqdn1:port";
    ```