---
{
    "title": "ALTER CATALOG",
    "language": "zh-CN",
    "description": "该语句用于设置指定数据目录的属性。"
}
---

## 描述

该语句用于设置指定数据目录的属性。

## 语法
1) 重命名数据目录

    ```sql
    ALTER CATALOG <catalog_name> RENAME <new_catalog_name>;
    ```

2) 设置数据目录属性

    ```sql
    ALTER CATALOG <catalog_name> SET PROPERTIES ('<key>' = '<value>' [, ... ]); 
    ```

3) 修改数据目录注释

    ```sql
    ALTER CATALOG <catalog_name> MODIFY COMMENT "<new catalog comment>";
    ```

## 必选参数

**1. `<catalog_name>`**

需要修改的 Catalog 名称

**2. `<new_catalog_name>`**

修改后的新 Catalog 名称

**3. `'<key>' = '<value>'`**

需要修改/添加的 Catalog 属性的 key 和 value

**4. `<new catalog comment>`**

修改后的 Catalog 注释

## 权限控制
| 权限（Privilege） | 对象（Object）   | 说明（Notes）                 |
|:--------------|:-------------|:--------------------------|
| ALTER_PRIV    | Catalog      | 需要有对应 catalog 的 ALTER_PRIV 权限 |

## 注意事项

1) 重命名数据目录
- `internal` 是内置数据目录，不允许重命名
- 对 `catalog_name` 拥有 Alter 权限才允许对其重命名
- 重命名数据目录后，如需要，请使用 REVOKE 和 GRANT 命令修改相应的用户权限。

2) 设置数据目录属性
- 不可更改数据目录类型，即 `type` 属性
- 不可更改内置数据目录 `internal` 的属性
- 更新指定属性的值为指定的 value。如果 SET PROPERTIES 从句中的 key 在指定 catalog 属性中不存在，则新增此 key。

3) 修改数据目录注释
- `internal` 是内置数据目录，不允许修改注释

## 示例

1. 将数据目录 ctlg_hive 重命名为 hive

    ```sql
    ALTER CATALOG ctlg_hive RENAME hive;
    ```

2. 更新名为 hive 数据目录的属性 `hive.metastore.uris`

    ```sql
    ALTER CATALOG hive SET PROPERTIES ('hive.metastore.uris'='thrift://172.21.0.1:9083');
    ```

3. 更改名为 hive 数据目录的注释

    ```sql
    ALTER CATALOG hive MODIFY COMMENT "new catalog comment";
    ```
