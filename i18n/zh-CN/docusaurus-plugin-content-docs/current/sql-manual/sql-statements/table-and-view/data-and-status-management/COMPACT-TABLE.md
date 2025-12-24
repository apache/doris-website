---
{
    "title": "COMPACT TABLE",
    "language": "zh-CN",
    "description": "存算一体模式中，用于对指定表分区下的所有副本触发一次 Compaction。"
}
---

## 描述

存算一体模式中，用于对指定表分区下的所有副本触发一次 Compaction。

存算分离模式不支持这个命令。

## 语法

```sql
ADMIN COMPACT TABLE <table_name> 
PARTITION <partition_name> 
WHERE TYPE={ BASE | CUMULATIVE }
```

## 必选参数

1. `<table_name>` ：待触发 Compaction 的表名

2. `<partition_name>`：待触发 Compaction 的表名

3. `TYPE={ BASE | CUMULATIVE }` : 其中 BASE 是指触发 Base Compaction，CUMULATIVE 是指触发 Cumulative Compaction，具体可以参考 COMPACTION 章节

## 权限控制

执行此 SQL 命令成功的前置条件是，拥有 ADMIN_PRIV 权限，参考权限文档。

| 权限（Privilege） | 对象（Object）   | 说明（Notes）               |
| :---------------- | :--------------- | :-------------------------- |
| ADMIN_PRIV        | 整个集群管理权限 | 除 NODE_PRIV 以外的所有权限 |

## 示例

1. 触发表 tbl 分区 par01 的 cumulative compaction。

    ```sql
    ADMIN COMPACT TABLE tbl PARTITION par01 WHERE TYPE='CUMULATIVE';
    ```

## 注意事项（Usage Note）

1. 存算分离模式不支持这个命令，在此模式下执行会报错，例如：

    ```sql
    ADMIN COMPACT TABLE tbl PARTITION par01 WHERE TYPE='CUMULATIVE';
    ```

    报错信息如下：

    ```sql
    ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported operation
    ```