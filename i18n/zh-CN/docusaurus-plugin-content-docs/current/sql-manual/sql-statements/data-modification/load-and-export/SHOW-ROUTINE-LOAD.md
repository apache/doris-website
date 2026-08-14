---
{
    "title": "SHOW ROUTINE LOAD",
    "language": "zh-CN",
    "description": "该语句用于展示 Routine Load 作业运行状态。可以查看指定作业或所有作业的状态信息。"
}
---

## 描述

该语句用于展示 Routine Load 作业运行状态。可以查看指定作业或所有作业的状态信息。

## 语法

```sql
SHOW [ALL] ROUTINE LOAD [FOR <jobName>];
```

## 可选参数

**1. `[ALL]`**

> 可选参数。如果指定，则会显示所有作业（包括已停止或取消的作业）。否则只显示当前正在运行的作业。

**2. `[FOR <jobName>]`**

> 可选参数。指定要查看的作业名称。如果不指定，则显示当前数据库下的所有作业。
>
> 支持以下形式：
>
> - `job_name`: 显示当前数据库下指定名称的作业
> - `db_name.job_name`: 显示指定数据库下指定名称的作业

## 返回结果

| 字段名                 | 说明                                                         |
| :-------------------- | :---------------------------------------------------------- |
| Id                    | 作业ID                                                       |
| Name                  | 作业名称                                                     |
| CreateTime            | 作业创建时间                                                 |
| PauseTime             | 最近一次作业暂停时间                                         |
| EndTime               | 作业结束时间                                                 |
| DbName                | 对应数据库名称                                               |
| TableName             | 对应表名称（多表情况下显示 multi-table）                      |
| IsMultiTable          | 是否为多表                                                   |
| State                 | 作业运行状态                                                 |
| DataSourceType        | 数据源类型：KAFKA                                            |
| CurrentTaskNum        | 当前子任务数量                                               |
| JobProperties         | 作业配置详情                                                 |
| DataSourceProperties  | 数据源配置详情                                               |
| CustomProperties      | 自定义配置。其中的敏感属性会被脱敏为 `******`，详见下方「敏感属性脱敏」 |
| Statistic             | 作业运行状态统计信息                                         |
| Progress              | 作业运行进度                                                 |
| Lag                   | 作业延迟状态                                                 |
| ReasonOfStateChanged  | 作业状态变更的原因                                           |
| ErrorLogUrls          | 被过滤的质量不合格的数据的查看地址                           |
| OtherMsg              | 其他错误信息                                                 |
| User                  | 创建该作业的用户                                             |
| Comment               | 作业的注释                                                   |
| ComputeGroup          | 作业运行所在的计算组                                         |
| FirstErrorMsg         | 该作业遇到的第一条错误信息。自 4.0.8 版本起新增               |

### 敏感属性脱敏

<!-- 知识类型: 行为说明 -->
<!-- 适用场景: Kafka 认证信息保护 / 审计合规 -->

:::caution 版本行为变更（4.0.8）

自 4.0.8 版本起，Kafka Routine Load 作业的敏感属性在 `CustomProperties` 中统一显示为 `******`，不再返回明文。`SHOW CREATE ROUTINE LOAD` 的输出同样会脱敏。

:::

以下属性会被识别为敏感属性并脱敏：

| 匹配规则 | 示例 |
| --- | --- |
| 属性名为 `sasl.jaas.config` | `sasl.jaas.config` |
| 属性名为 `aws.access_key` | `aws.access_key` |
| 属性名为 `ssl.keystore.key`、`ssl.key.pem` | `ssl.keystore.key` |
| 以 `.password`、`.secret`、`.secret_key`、`.secret.key` 结尾 | `ssl.keystore.password`、`sasl.oauthbearer.client.secret` |
| 以 `.session_key`、`.session.token` 结尾 | `aws.session.token` |
| 以 `.private.key`、`.private_key`、`.passphrase` 结尾，或包含 `.private.key.` | `sasl.oauthbearer.assertion.private.key.pem` |

脱敏只影响查询结果的展示，作业实际使用的属性值不变。如需修改这些属性，请使用 [ALTER ROUTINE LOAD](./ALTER-ROUTINE-LOAD) 重新设置，无法从 `SHOW` 结果中读回原值。

### FirstErrorMsg 与 OtherMsg 的区别

- `FirstErrorMsg`：作业运行过程中遇到的**第一条**错误信息，用于定位问题的起因。作业长时间运行后，后续错误往往是首个错误的连锁反应。
- `OtherMsg`：最近一次的其他错误信息，会被后续错误覆盖。

:::info 备注

通过 [`information_schema.routine_load_job`](../../../../admin-manual/system-tables/information_schema/routine_load_job) 也可以查询这些信息。自 4.0.8 版本起，该系统表统一由 Master FE 提供数据，因此在非 Master FE 上查询时 `FIRST_ERROR_MSG` 与 `ERROR_LOG_URLS` 不再为空。

:::

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV         | 表（Table）    | SHOW ROUTINE LOAD 需要对表有LOAD权限 |

## 注意事项

- State 状态说明：
  - NEED_SCHEDULE：作业等待被调度
  - RUNNING：作业运行中
  - PAUSED：作业被暂停
  - STOPPED：作业已结束
  - CANCELLED：作业已取消

- Progress 说明：
  - 对于 Kafka 数据源，显示每个分区当前已消费的 offset
  - 例如 {"0":"2"} 表示 Kafka 分区 0 的消费进度为 2

- Lag 说明：
  - 对于 Kafka 数据源，显示每个分区的消费延迟
  - 例如 {"0":10} 表示 Kafka 分区 0 的消费延迟为 10

## 示例

- 展示名称为 test1 的所有例行导入作业（包括已停止或取消的作业）

    ```sql
    SHOW ALL ROUTINE LOAD FOR test1;
    ```

- 展示名称为 test1 的当前正在运行的例行导入作业

    ```sql
    SHOW ROUTINE LOAD FOR test1;
    ```

- 显示 example_db 下，所有的例行导入作业（包括已停止或取消的作业）。结果为一行或多行。

    ```sql
    use example_db;
    SHOW ALL ROUTINE LOAD;
    ```

- 显示 example_db 下，所有正在运行的例行导入作业

    ```sql
    use example_db;
    SHOW ROUTINE LOAD;
    ```

- 显示 example_db 下，名称为 test1 的当前正在运行的例行导入作业

    ```sql
    SHOW ROUTINE LOAD FOR example_db.test1;
    ```

- 显示 example_db 下，名称为 test1 的所有例行导入作业（包括已停止或取消的作业）。结果为一行或多行。

    ```sql
    SHOW ALL ROUTINE LOAD FOR example_db.test1;
    ```

