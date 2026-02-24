---
{
    "title": "FRONTENDS",
    "language": "zh-CN",
    "description": "表函数，生成 frontends 临时表，可以查看当前 doris 集群中的 FE 节点信息。"
}
---

## 描述

表函数，生成 frontends 临时表，可以查看当前 doris 集群中的 FE 节点信息。

## 语法
```sql
FRONTENDS()
```

## 权限控制

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :----------------|:-----------| :------------ |
| SELECT_PRIV | internal.information_schema | 所有用户默认有该 db 的权限 |

## 返回值
| Field                  | Description                                         |
|------------------------|-----------------------------------------------------|
| **Name**               | Frontend 节点的唯一名称。                                   |
| **Host**               | Frontend 节点的 IP 地址或主机名。                             |
| **EditLogPort**        | 用于编辑日志通信的端口。                                        |
| **HttpPort**           | Frontend 节点的 HTTP 端口。                               |
| **QueryPort**          | Frontend 节点用于执行查询的端口。                               |
| **RpcPort**            | 用于 RPC 通信的端口。                                       |
| **ArrowFlightSqlPort** | Arrow Flight SQL 端口（用于与 Apache Arrow 集成，进行高性能数据传输）。 |
| **Role**               | Frontend 节点的角色（例如：`FOLLOWER`）。                      |
| **IsMaster**           | 表示该节点是否是主节点（True/False）。                            |
| **ClusterId**          | 该 Frontend 节点所属集群的标识符。                              |
| **Join**               | 表示该 Frontend 节点是否已经加入集群（True/False）。                |
| **Alive**              | 表示该 Frontend 节点是否存活（True/False）。                    |
| **ReplayedJournalId**  | 该 Frontend 节点最后重放的日志 ID。                            |
| **LastStartTime**      | 该 Frontend 节点最后一次启动的时间戳。                            |
| **LastHeartbeat**      | 该 Frontend 节点接收到的最后一次心跳时间戳。                         |
| **IsHelper**           | 表示该 Frontend 节点是否是辅助节点（True/False）。                 |
| **ErrMsg**             | 该 Frontend 节点的错误信息。                                 |
| **Version**            | 该 Frontend 节点的版本。                                   |
| **CurrentConnected**   | 表示该 Frontend 节点当前是否连接到集群（Yes/No）。                   |



## 示例
查看 frontends 集群信息
```sql
select * from frontends();
```

```text
+-----------------------------------------+------------+-------------+----------+-----------+---------+--------------------+----------+----------+-----------+------+-------+-------------------+---------------------+---------------------+----------+--------+-------------------------+------------------+
| Name                                    | Host       | EditLogPort | HttpPort | QueryPort | RpcPort | ArrowFlightSqlPort | Role     | IsMaster | ClusterId | Join | Alive | ReplayedJournalId | LastStartTime       | LastHeartbeat       | IsHelper | ErrMsg | Version                 | CurrentConnected |
+-----------------------------------------+------------+-------------+----------+-----------+---------+--------------------+----------+----------+-----------+------+-------+-------------------+---------------------+---------------------+----------+--------+-------------------------+------------------+
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.xx.xx.90 | 9010        | 8030     | 9030      | 9020    | -1               | FOLLOWER | true     | 917153130 | true | true  | 555248            | 2025-01-13 14:11:31 | 2025-01-16 14:27:56 | true     |        | doris-0.0.0--83f899b32b | Yes              |
+-----------------------------------------+------------+-------------+----------+-----------+---------+--------------------+----------+----------+-----------+------+-------+-------------------+---------------------+---------------------+----------+--------+-------------------------+------------------+
```