---
{
    "title": "REFRESH",
    "language": "zh-CN",
    "description": "该语句用于刷新指定 Catalog/Database/Table 的元数据。"
}
---

## 描述

该语句用于刷新指定 Catalog/Database/Table 的元数据。

## 语法

```sql
REFRESH CATALOG <catalog_name>
    [PROPERTIES ("invalid_cache" = "true" | "false")];
REFRESH DATABASE [<catalog_name>.]<database_name>;
REFRESH TABLE [[<catalog_name>.]<database_name>.]<table_name>;
```

## 必选参数

**1. `<catalog_name>`**

需要刷新的 catalog 的名字

**2. `[<catalog_name>.]<database_name>`**

需要刷新的 catalog 里面 database 的名字

**3. `[[<catalog_name>.]<database_name>.]<table_name>`**

需要刷新的 catalog 里面 table 的名字


## 权限控制
| 权限（Privilege）                                                                                | 对象（Object） | 说明（Notes）      |
|:---------------------------------------------------------------------------------------------|:-----------|:---------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog    | 需要有上述权限中的一种就可以 |


## 注意事项
刷新 Catalog 的同时，会强制使对象相关的 Cache 失效。包括 Partition Cache、Schema Cache、File Cache 等。

`invalid_cache` 用于控制 `REFRESH CATALOG` 时是否继续失效更细粒度的元数据缓存：

- `true`：失效 catalog 对象缓存，以及分区、schema、文件列表等更细粒度缓存。这也是默认行为。
- `false`：只刷新 catalog 级对象/名称元数据，保留更细粒度缓存。

`invalid_cache` 当前用于 `REFRESH CATALOG`。

以下行为需在对应的开发版本实现合入后使用；当前 master、4.x 和 3.x 均尚未支持。合入该实现后，`REFRESH TABLE` 将已存在的外部数据库中的表名作为元数据缓存失效的目标。即使远端表已被删除，或指定的表名从未存在，该语句也会成功。Catalog 或数据库不存在、指定内部 Catalog，或权限不足时仍会报错。

表刷新成功不表示远端表存在，也不会立即重新加载其 schema。Doris 会在后续访问时重新加载元数据，因此查询已删除的表仍可能失败。这使多 FE 集群能够清除旧表的查找缓存，即使 master 尚未缓存该表。

## 示例

1. 刷新 hive catalog

    ```sql
    REFRESH CATALOG hive;
    ```

2. 刷新 hive catalog，但不失效更细粒度缓存

    ```sql
    REFRESH CATALOG hive PROPERTIES("invalid_cache" = "false");
    ```

3. 刷新 database1

    ```sql
    REFRESH DATABASE ctl.database1;
    REFRESH DATABASE database1;
    ```

4. 刷新 table1

    ```sql
    REFRESH TABLE ctl.db.table1;
    REFRESH TABLE db.table1;
    REFRESH TABLE table1;
    ```

