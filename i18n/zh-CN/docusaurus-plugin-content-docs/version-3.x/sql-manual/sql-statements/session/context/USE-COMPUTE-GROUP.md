---
{
    "title": "USE COMPUTE GROUP",
    "language": "zh-CN",
    "description": "在存算分离版本中，指定使用计算集群"
}
---

## 描述

在存算分离版本中，指定使用计算集群

## 语法

```sql
USE { [ <catalog_name>. ]<database_name>[ @<compute_group_name> ] | @<compute_group_name> }
```

## 必选参数

`<compute_group_name>` ：计算集群名字

## 返回值

切换计算集群成功返回 "Database changed"，切换失败返回相应错误提示信息

## 示例

1. 指定使用该计算集群 compute_cluster

    ```sql
    use @compute_cluster;
    Database changed
    ```

2. 同时指定使用该数据库 mysql 和计算集群 compute_cluster

    ```sql
    use mysql@compute_cluster
    Database changed
    ```

## 权限控制

执行此 SQL 命令成功的前置条件是，拥有 compute group 的使用权限 USAGE_PRIV，参考权限文档。

| 权限（Privilege） | 对象（Object） | 说明（Notes）    |
| :---------------- | :------------- | :--------------- |
| USAGE_PRIV        | Compute group  | 计算集群使用权限 |

若用户无 compute group 权限，而去指定 compute group 会报错，注 test 为普通用户无集群使用权限

```sql
mysql -utest -h175.40.1.1 -P9030

use @compute_cluster;
ERROR 5042 (42000): errCode = 2, detailMessage = USAGE denied to user test'@'127.0.0.1' for compute group 'compute_cluster'
```

## 注意事项

1. 如果 database 名字或者 compute group 名字是保留的关键字，需要用反引号，例如：

    ```sql
    use @`create`
    ```

2. 若 compute group 不存在，返回报错信息

    ```sql
    mysql> use @compute_group_not_exist;
    ERROR 5098 (42000): errCode = 2, detailMessage = Compute Group compute_group_not_exist not exist
    ```