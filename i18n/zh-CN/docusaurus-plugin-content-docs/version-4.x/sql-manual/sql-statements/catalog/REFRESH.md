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

