---
{
    "title": "CREATE WORKLOAD POLICY",
    "language": "zh-CN",
    "description": "创建一个 Workload Policy，用于当一个查询满足一些条件时，就对该查询执行相应的动作。"
}
---

## 描述

创建一个 Workload Policy，用于当一个查询满足一些条件时，就对该查询执行相应的动作。

## 语法

```sql
CREATE WORKLOAD POLICY [ IF NOT EXISTS ] <workload_policy_name>
CONDITIONS(<conditions>) ACTIONS(<actions>)
[ PROPERTIES (<properties>) ]
```

## 必选参数

1. `<workload_policy_name>`: Workload Policy 的名字

2. `<conditions>`
    - be_scan_rows，一个 SQL 在单个 BE 进程内 Scan 的行数，如果这个 SQL 在 BE 上是多并发执行，那么就是多个并发的累加值。
    - be_scan_bytes，一个 SQL 在单个 BE 进程内 Scan 的字节数，如果这个 SQL 在 BE 上是多并发执行，那么就是多个并发的累加值，单位是字节。
    - query_time，一个 SQL 在单个 BE 进程上的运行时间，时间单位是毫秒。
    - query_be_memory_bytes，从 2.1.5 版本开始支持。一个 SQL 在单个 BE 进程内使用的内存用量，如果这个 SQL 在 BE 上是多并发执行，那么就是多个并发的累加值，单位是字节。

3. `<actions>`
    - set_session_variable，这个 Action 可以执行一条 `set_session_variable` 的语句。同一个 Policy 可以有多个 `set_session_variable`，也就是说一个 Policy 可以执行多个修改 session 变量的语句。
    - cancel_query，取消查询。

## 可选参数

1. `<properties>`
    - enabled，取值为 true 或 false，默认值为 true，表示当前 Policy 处于启用状态，false 表示当前 Policy 处于禁用状态。
    - priority，取值范围为 0 到 100 的正整数，默认值为 0，代表 Policy 的优先级，该值越大，优先级越高。这个属性的主要作用是，当匹配到多个 Policy 时，选择优先级最高的 Policy。
    - workload_group，目前一个 Policy 可以绑定一个 Workload Group，代表这个 Policy 只对某个 Workload Group 生效。默认为空，代表对所有查询生效。

## 权限控制

至少具备`ADMIN_PRIV`权限

## 示例

1. 新建一个 Workload Policy，作用是杀死所有查询时间超过 3s 的查询

    ```Java
    create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query)
    ```

2. 新建一个 Workload Policy，默认不开启

    ```Java
    create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query) properties('enabled'='false')
    ```