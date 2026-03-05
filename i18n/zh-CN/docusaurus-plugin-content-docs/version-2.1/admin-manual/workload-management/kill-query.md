---
{
    "title": "终止查询",
    "language": "zh-CN",
    "description": "可以通过 KILL 命令取消当前正在执行的操作或断开当前连接会话。本文档介绍相关操作和注意事项"
}
---

可以通过 `KILL` 命令取消当前正在执行的操作或断开当前连接会话。本文档介绍相关操作和注意事项

## 获取查询标识

`KILL` 需通过查询标识取消对应的查询请求。查询标识包括：查询 ID（Query ID） 、连接 ID（Connection ID）和 Trace ID。

可以通过以下方式获取查询标识。

### PROCESSLIST

通过 `processlist` 系统表可以获取当前所有的会话连接，以及连接中正在执行的查询操作。其中包含查询 ID 和连接 ID。

```sql
mysql> SHOW PROCESSLIST;
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+---------------+--------------+
| CurrentConnected | Id   | User | Host                | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                           | Info             | FE            | CloudCluster |
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+---------------+--------------+
| No               |    2 | root | 172.20.32.136:54850 | 2025-05-11 10:41:52 | internal |      | Query   |    6 | OK    | 12ccf7f95c1c4d2c-b03fa9c652757c15 | select sleep(20) | 172.20.32.152 | NULL         |
| Yes              |    3 | root | 172.20.32.136:54862 | 2025-05-11 10:41:55 | internal |      | Query   |    0 | OK    | b710ed990d4144ee-8b15bb53002b7710 | show processlist | 172.20.32.152 | NULL         |
| No               |    1 | root | 172.20.32.136:47964 | 2025-05-11 10:41:54 | internal |      | Sleep   |   11 | EOF   | b60daa992bac4fe4-b29466aacce67d27 |                  | 172.20.32.153 | NULL         |
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+---------------+--------------+
```

- `CurrentConnected`：`Yes` 表示当前会话所对应的连接。 
- `Id`：连接的唯一标识，即 Connection ID。
- `QueryId`：Query 的唯一标识。显示最仅执行的、或正在执行的 SQL 命令的 Query Id。

注意，在默认情况下，`SHOW PROCESSLIST` 仅显示当前会话所连接到的 FE 节点上的所有会话连接，并不会显示其他 FE 节点的会话连接。

如果要显示所有 FE 节点的会话连接，需设置一下会话变量：

```
SET show_all_fe_connection=true;
```

然后再执行 `SHOW PROCESSLIST` 命令，即可显示所有 FE 节点的会话连接。

也可以通过 `information_schema` 中的系统表查看：

```
SELECT * FROM information_schema.processlist;
```

`processlist` 默认会显示所有 FE 节点的会话连接，不需要额外进行设置。

### TRACE ID

> 该功能自 2.1.11 和 3.0.7 版本支持。

默认情况下，系统会为每个查询自动生成 Query ID。用户需先通过 `processlist` 系统表获取到 Query ID 后，再进行 KILL 操作。

除此之外，用户还可以自定义 Trace ID，并通过 Trace ID 进行 KILL 操作。

```
SET session_context = "trace_id:your_trace_id"
```

其中 `your_trace_id ` 为用户自定义的 Trace ID。可以是任意字符串，但不可以包含 `;` 符号。

Trace ID 是会话级别参数，仅作用于当前会话。Doris 会将之后发生在当前会话中的查询请求映射到这个 Trace ID 上。

## Kill 请求

`KILL` 语句支持通过取消指定的查询操作，也支持断开指定的会话连接。

普通用户可以通过 `KILL` 操作取消掉自身用户发送的查询。ADMIN 用户可以取消自身和任意其他用户发送的查询。 

### Kill 查询

语法：

```sql
KILL QUERY "query_id" | "trace_id" | connection_id;
```

`KILL QUERY` 用于取消一个指定的正在运行的查询操作。

- `"query_id"`

	通过 `processlist` 系统表获取到的 Query ID。需用引号包裹。如：
	
	`KILL QUERY "d36417cc05ff41ab-9d3afe49be251055";`
	
	该操作会尝试在所有 FE 节点查找 Query ID 并取消对应的查询。
	
- `"trace_id"`

	通过 `session_context` 自定义的 Trace ID。需用引号包裹。如：

	`KILL QUERY "your_trace_id";`
	
	该操作会尝试在所有 FE 节点查找 Trace ID 并取消对应的查询。

	> 该功能自 2.1.11 和 3.0.7 版本支持。

- `connection_id`

	通过 `processlist` 系统表获取到的 Connection ID。必须是一个大于 0 的整数，不可用引号包裹。如：

	`KILL QUERY 55;`
	
	该操作仅作用于当前连接到的 FE 上的会话连接，会取消对应会话连接上正在执行的查询。

### Kill 连接

Kill 连接会断开指定的会话连接，同时也会取消连接上正在执行的查询操作。

语法：

```sql
KILL [CONNECTION] connection_id;
```

其中 `CONNECTION` 关键词可以省略。

- `connection_id `

	通过 `processlist` 系统表获取到的 Connection ID。必须是一个大于 0 的整数，不可用引号包裹。如：

	```sql
	KILL CONNECTION 55;
	KILL 55;
	```
	
	不同 FE 上的连接 ID 可能相同，但该操作仅作用于当前连接到的 FE 上的会话连接。

## 最佳实践

1. 通过自定义 Trace ID 实现查询管理

	通过自定义 Trace ID 可以预先为查询指定唯一标识，方便管控工具实现【取消查询】的功能。可以通过如下方式自定义 Trace ID：
	
	- 每次查询前设置 `session_context`

		用户自行生成 Trace ID。建议使用 UUID 以确保 Trace ID 的唯一性。

		```sql
		SET session_context="trace_id:your_trace_id";
		SELECT * FROM table ...;
		```
		
	- 在查询语句中添加 Trace ID

		```sql
		SELECT /*+SET_VAR(session_context=trace_id:your_trace_id)*/ * FROM table ...;
		```
	
	之后，管控工具可以通过 Trace ID 随时取消正在执行的操作。

