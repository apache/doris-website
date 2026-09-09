---
{
    "title": "COMPACT TABLE",
    "language": "zh-CN",
    "description": "手动触发一次 Compaction，支持按表分区触发（ADMIN COMPACT TABLE）和按单个 Tablet 触发（ADMIN COMPACT TABLET）。"
}
---

## 描述

手动触发一次 Compaction。Doris 提供两种粒度：

- `ADMIN COMPACT TABLE`：对指定表分区下的所有副本触发一次 Compaction。仅存算一体模式支持。
- `ADMIN COMPACT TABLET`：对指定 Tablet 的所有副本触发一次 Compaction，自 4.1.4 版本开始支持。存算一体与存算分离模式均支持。

## 语法

```sql
ADMIN COMPACT TABLE <table_name>
PARTITION <partition_name>
WHERE TYPE={ BASE | CUMULATIVE }
```

```sql
ADMIN COMPACT TABLET <tablet_id>
WHERE TYPE={ BASE | CUMULATIVE | FULL }
```

## 必选参数

**ADMIN COMPACT TABLE**

1. `<table_name>` ：待触发 Compaction 的表名

2. `<partition_name>`：待触发 Compaction 的分区名

3. `TYPE={ BASE | CUMULATIVE }` : 其中 BASE 是指触发 Base Compaction，CUMULATIVE 是指触发 Cumulative Compaction，具体可以参考 COMPACTION 章节

**ADMIN COMPACT TABLET**

1. `<tablet_id>`：待触发 Compaction 的 Tablet ID，必须是内表（OLAP 表）的 Tablet。可通过 `SHOW TABLETS FROM <table_name>` 获取

2. `TYPE={ BASE | CUMULATIVE | FULL }`：其中 FULL 是指触发 Full Compaction

## 权限控制

**ADMIN COMPACT TABLE**

执行此 SQL 命令成功的前置条件是，拥有 ADMIN_PRIV 权限，参考权限文档。

| 权限（Privilege） | 对象（Object）   | 说明（Notes）               |
| :---------------- | :--------------- | :-------------------------- |
| ADMIN_PRIV        | 整个集群管理权限 | 除 NODE_PRIV 以外的所有权限 |

**ADMIN COMPACT TABLET**

执行此 SQL 命令成功的前置条件是，拥有全局 ADMIN_PRIV 权限，或者拥有该 Tablet 所属表的 ALTER_PRIV 权限，二者满足其一即可。

| 权限（Privilege） | 对象（Object）   | 说明（Notes）                              |
| :---------------- | :--------------- | :----------------------------------------- |
| ADMIN_PRIV        | 整个集群管理权限 | 除 NODE_PRIV 以外的所有权限                |
| ALTER_PRIV        | 表               | 对该 Tablet 所属表拥有 ALTER 权限即可执行  |

## 示例

1. 触发表 tbl 分区 par01 的 cumulative compaction。

    ```sql
    ADMIN COMPACT TABLE tbl PARTITION par01 WHERE TYPE='CUMULATIVE';
    ```

2. 触发 Tablet 10086 的 full compaction。

    ```sql
    ADMIN COMPACT TABLET 10086 WHERE TYPE='FULL';
    ```

3. 触发 Tablet 10086 的 base compaction。

    ```sql
    ADMIN COMPACT TABLET 10086 WHERE TYPE='BASE';
    ```

## 注意事项（Usage Note）

1. 存算分离模式不支持 `ADMIN COMPACT TABLE`，在此模式下执行会报错，例如：

    ```sql
    ADMIN COMPACT TABLE tbl PARTITION par01 WHERE TYPE='CUMULATIVE';
    ```

    报错信息如下：

    ```sql
    ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported operation
    ```

    此场景请改用 `ADMIN COMPACT TABLET`。

2. `ADMIN COMPACT TABLET` 只支持内表（OLAP 表）的 Tablet。如果 Tablet ID 不存在、所属库表已被删除，或所属 Index 处于不可见状态，会直接报错，例如：

    ```sql
    ERROR 1105 (HY000): errCode = 2, detailMessage = Unknown tablet: 10086
    ```

3. 上述命令都只是向 BE 下发一次 Compaction 任务，命令返回成功不代表 Compaction 已经执行完成。可通过 [SHOW TABLET](./SHOW-TABLET) 观察 Tablet 版本数变化，或通过 BE 的 [compaction-status](../../../../admin-manual/open-api/be-http/compaction-status) 接口查看执行情况。
