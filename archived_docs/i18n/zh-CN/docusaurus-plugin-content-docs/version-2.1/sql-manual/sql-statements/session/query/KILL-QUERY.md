---
{
    "title": "KILL QUERY",
    "language": "zh-CN",
    "description": "每个 Doris 的连接都在一个单独的线程中运行。使用该语句终止线程。"
}
---

## 描述

每个 Doris 的连接都在一个单独的线程中运行。使用该语句终止线程。

## 语法

```SQL
KILL [CONNECTION] <processlist_id>
```

## 变种语法

```SQL
KILL QUERY [ { <processlist_id> | <query_id> } ]
```

## 必选参数

**1. `<processlist_id>`**

> 表示需要被杀掉的连接线程 ID

**2. `<query_id>`**

> 表示需要被杀掉的查询 ID

## 可选参数

**1. `CONNECTION`**

> 表示是否是当前连接的线程

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）              |
|:--------------|:-----------|:-----------------------|
| GRANT_PRIV         | 数据库   | 若需要 KILL 语句需要获得 GRANT 权限 |

## 注意事项

- 线程进程列表标识符可以从 SHOW PROCESSLIST 输出的 Id 列查询

- Connection ID 可以从 SELECT CONNECTION_ID() 来查询

## 示例

```sql
select connection_id()
```

```text
+-----------------+
| connection_id() |
+-----------------+
| 48              |
+-----------------+
```

```sql
SHOW PROCESSLIST
```

```text
+------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
| CurrentConnected | Id   | User | Host               | LoginTime           | Catalog  | Db      | Command | Time | State | QueryId                           | Info                                                                                  |
+------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
| Yes              |   48 | root | 10.16.xx.xx:44834   | 2025-01-21 16:49:47 | internal | test | Query   |    0 | OK    | e6e4ce9567b04859-8eeab8d6b5513e38 | SHOW PROCESSLIST                                                                      |
|                  |   50 | root | 192.168.xx.xx:52837 | 2025-01-21 16:51:34 | internal |      | Sleep   | 1837 | EOF   | deaf13c52b3b4a3b-b25e8254b50ff8cb | SELECT @@session.transaction_isolation                                                |
|                  |   51 | root | 192.168.xx.xx:52843 | 2025-01-21 16:51:35 | internal |      | Sleep   |  907 | EOF   | 437f219addc0404f-9befe7f6acf9a700 | /* ApplicationName=DBeaver Ultimate 23.1.3 - Metadata */ SHOW STATUS                  |
|                  |   55 | root | 192.168.xx.xx:55533 | 2025-01-21 17:09:32 | internal | test | Sleep   |  271 | EOF   | f02603dc163a4da3-beebbb5d1ced760c | /* ApplicationName=DBeaver Ultimate 23.1.3 - SQLEditor <Console> */ SELECT DATABASE() |
|                  |   47 | root | 10.16.xx.xx:35678   | 2025-01-21 16:21:56 | internal | test | Sleep   | 3528 | EOF   | f4944c543dc34a99-b0d0f3986c8f1c98 | select * from test                                                                    |
+------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
```

```sql
kill 51
```
