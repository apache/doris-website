---
{
    "title": "终止查询与断开连接：KILL 命令使用指南",
    "sidebar_label": "终止查询与断开连接",
    "language": "zh-CN",
    "description": "使用 KILL 命令取消正在执行的查询或断开会话连接，支持通过 Query ID、Connection ID 和 Trace ID 定位目标查询。",
    "keywords": ["kill query", "终止查询", "取消查询", "断开连接", "kill connection", "Query ID", "Trace ID", "processlist"]
}
---

<!-- 知识类型: 操作指南 -->

`KILL` 命令用于取消正在执行的查询，或断开指定的会话连接。使用前需先获取目标查询的标识（Query ID、Connection ID 或 Trace ID），再执行对应的 KILL 语句。

## 获取查询标识

<!-- 知识类型: 概念定义 -->

KILL 命令支持以下三种查询标识：

| 标识类型 | 说明 | 获取方式 |
|---|---|---|
| Query ID | 系统为每个查询自动生成的唯一标识 | `SHOW PROCESSLIST` 或 `information_schema.processlist` |
| Connection ID | 会话连接的唯一标识 | `SHOW PROCESSLIST` 或 `information_schema.processlist` |
| Trace ID | 用户自定义的查询标识（2.1.11 / 3.0.7 起支持） | 通过 `session_context` 变量设置 |

### 通过 PROCESSLIST 查看

<!-- 知识类型: 操作步骤 -->

`SHOW PROCESSLIST` 显示当前所有会话连接及其正在执行的查询，包含 Query ID 和 Connection ID。

```sql
SHOW PROCESSLIST;
```

示例输出：

```
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+----------------------------------+------------------+---------------+--------------+
| CurrentConnected | Id   | User | Host                | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                          | Info             | FE            | CloudCluster |
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+----------------------------------+------------------+---------------+--------------+
| No               |    2 | root | 172.20.32.136:54850 | 2025-05-11 10:41:52 | internal |      | Query   |    6 | OK    | 12ccf7f95c1c4d2c-b03fa9c652757c15| select sleep(20) | 172.20.32.152 | NULL         |
| Yes              |    3 | root | 172.20.32.136:54862 | 2025-05-11 10:41:55 | internal |      | Query   |    0 | OK    | b710ed990d4144ee-8b15bb53002b7710| show processlist | 172.20.32.152 | NULL         |
| No               |    1 | root | 172.20.32.136:47964 | 2025-05-11 10:41:54 | internal |      | Sleep   |   11 | EOF   | b60daa992bac4fe4-b29466aacce67d27|                  | 172.20.32.153 | NULL         |
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+----------------------------------+------------------+---------------+--------------+
```

关键字段说明：

- `CurrentConnected`：`Yes` 表示当前会话对应的连接。
- `Id`：Connection ID，连接的唯一标识。
- `QueryId`：Query ID，显示最近执行或正在执行的 SQL 的唯一标识。

**默认行为**：`SHOW PROCESSLIST` 仅显示当前连接的 FE 节点上的会话，不包含其他 FE 节点。若需查看所有 FE 节点的会话，先设置以下变量再执行查询：

```sql
SET show_all_fe_connection = true;
SHOW PROCESSLIST;
```

也可通过 `information_schema` 系统表查看，该表默认显示所有 FE 节点的会话，无需额外设置：

```sql
SELECT * FROM information_schema.processlist;
```

### 通过 Trace ID 标识查询

<!-- 知识类型: 操作步骤 -->

> 该功能自 2.1.11 和 3.0.7 版本起支持。

Trace ID 是用户为查询预先指定的自定义标识，便于管控工具在提交查询前就记录其唯一标识，后续可随时通过 Trace ID 取消。

通过以下方式为当前会话设置 Trace ID：

```sql
SET session_context = "trace_id:your_trace_id";
```

- `your_trace_id`：自定义字符串，不可包含 `;` 符号，建议使用 UUID 确保唯一性。
- Trace ID 为会话级参数，仅作用于当前会话。设置后，该会话中的后续查询均映射到此 Trace ID。

也可在单条查询语句中通过 Hint 设置，无需修改会话变量：

```sql
SELECT /*+SET_VAR(session_context=trace_id:your_trace_id)*/ * FROM table ...;
```

## 执行 KILL 操作

<!-- 知识类型: 操作步骤 -->

**权限说明**：普通用户只能终止自身发送的查询；ADMIN 用户可终止任意用户的查询。

### Kill 查询

`KILL QUERY` 取消指定的正在运行的查询，不断开会话连接。

```sql
KILL QUERY "query_id" | "trace_id" | connection_id;
```

三种用法对比：

| 参数类型 | 示例 | 作用范围 |
|---|---|---|
| `"query_id"` | `KILL QUERY "d36417cc05ff41ab-9d3afe49be251055";` | 在所有 FE 节点查找并取消对应查询 |
| `"trace_id"` | `KILL QUERY "your_trace_id";` | 在所有 FE 节点查找并取消对应查询 |
| `connection_id` | `KILL QUERY 55;` | 仅取消当前连接的 FE 上该连接正在执行的查询 |

注意：

- Query ID 和 Trace ID 需用引号包裹；Connection ID 必须是大于 0 的整数，不可加引号。
- 通过 Connection ID 执行的 `KILL QUERY` 仅作用于当前连接的 FE 节点。

### Kill 连接

`KILL CONNECTION` 断开指定的会话连接，同时取消该连接上正在执行的查询。

```sql
KILL [CONNECTION] connection_id;
```

`CONNECTION` 关键词可省略，以下两种写法等价：

```sql
KILL CONNECTION 55;
KILL 55;
```

注意：不同 FE 节点上的 Connection ID 可能相同，该操作仅作用于当前连接的 FE 节点。

## 最佳实践：通过 Trace ID 管理查询

<!-- 知识类型: 最佳实践 -->

在管控系统或业务平台中，推荐使用 Trace ID 实现查询的预先标记与精准取消，流程如下：

1. **提交查询前**，生成唯一 Trace ID（推荐使用 UUID）并绑定到查询。
2. **查询执行中**，系统通过 Trace ID 随时发起 KILL 请求。

两种绑定方式：

- 在查询前设置会话变量（适合单连接场景）：

    ```sql
    SET session_context = "trace_id:your_trace_id";
    SELECT * FROM table ...;
    ```

- 在查询语句中内嵌 Hint（适合连接池复用场景）：

    ```sql
    SELECT /*+SET_VAR(session_context=trace_id:your_trace_id)*/ * FROM table ...;
    ```

绑定后，可在任意时刻通过以下命令取消该查询：

```sql
KILL QUERY "your_trace_id";
```
