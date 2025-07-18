---
{
    "title": "SHOW-POLICY",
    "language": "zh-CN"
}
---

## SHOW-POLICY

### Name

SHOW ROW POLICY

## 描述

查看当前 DB 下的行安全策略

语法：

```sql
SHOW ROW POLICY [FOR user| ROLE role]
```

## 举例

1. 查看所有安全策略。

    ```sql
    mysql> SHOW ROW POLICY;
    +-------------------+----------------------+-----------+------+-------------+-------------------+------+-------------------------------------------------------------------------------------------------------------------------------------------+
    | PolicyName        | DbName               | TableName | Type | FilterType  | WherePredicate    | User | OriginStmt                                                                                                                                |
    +-------------------+----------------------+-----------+------+-------------+-------------------+------+-------------------------------------------------------------------------------------------------------------------------------------------+
    | test_row_policy_1 | default_cluster:test | table1    | ROW  | RESTRICTIVE | `id` IN (1, 2)    | root | /* ApplicationName=DataGrip 2021.3.4 */ CREATE ROW POLICY test_row_policy_1 ON test.table1 AS RESTRICTIVE TO root USING (id in (1, 2));
    |
    | test_row_policy_2 | default_cluster:test | table1    | ROW  | RESTRICTIVE | `col1` = 'col1_1' | root | /* ApplicationName=DataGrip 2021.3.4 */ CREATE ROW POLICY test_row_policy_2 ON test.table1 AS RESTRICTIVE TO root USING (col1='col1_1');
    |
    +-------------------+----------------------+-----------+------+-------------+-------------------+------+-------------------------------------------------------------------------------------------------------------------------------------------+
    2 rows in set (0.00 sec)
    ```
    
2. 指定用户名查询

    ```sql
    mysql> SHOW ROW POLICY FOR test;
    +-------------------+----------------------+-----------+------+------------+-------------------+----------------------+------------------------------------------------------------------------------------------------------------------------------------------+
    | PolicyName        | DbName               | TableName | Type | FilterType | WherePredicate    | User                 | OriginStmt                                                                                                                               |
    +-------------------+----------------------+-----------+------+------------+-------------------+----------------------+------------------------------------------------------------------------------------------------------------------------------------------+
    | test_row_policy_3 | default_cluster:test | table1    | ROW  | PERMISSIVE | `col1` = 'col1_2' | default_cluster:test | /* ApplicationName=DataGrip 2021.3.4 */ CREATE ROW POLICY test_row_policy_3 ON test.table1 AS PERMISSIVE TO test USING (col1='col1_2');
    |
    +-------------------+----------------------+-----------+------+------------+-------------------+----------------------+------------------------------------------------------------------------------------------------------------------------------------------+
    1 row in set (0.01 sec)
    ```

3. 指定角色名查询
    
    ```sql
    mysql> SHOW ROW POLICY for role role1;
    +------------+--------+-----------+------+-------------+----------------+------+-------+----------------------------------------------------------------------------------+
    | PolicyName | DbName | TableName | Type | FilterType  | WherePredicate | User | Role  | OriginStmt                                                                       |
    +------------+--------+-----------+------+-------------+----------------+------+-------+----------------------------------------------------------------------------------+
    | zdtest1    | zd     | user      | ROW  | RESTRICTIVE | `user_id` = 1  | NULL | role1 | create row policy zdtest1 on user as restrictive to role role1 using (user_id=1) |
    +------------+--------+-----------+------+-------------+----------------+------+-------+----------------------------------------------------------------------------------+
    1 row in set (0.01 sec)
    ```

4. 展示数据迁移策略
    ```sql
    mysql> SHOW STORAGE POLICY;
    +---------------------+---------+-----------------------+---------------------+-------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
    | PolicyName          | Type    | StorageResource       | CooldownDatetime    | CooldownTtl | properties                                                                                                                                                                                                                                                                                                          |
    +---------------------+---------+-----------------------+---------------------+-------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
    | showPolicy_1_policy | STORAGE | showPolicy_1_resource | 2022-06-08 00:00:00 | -1          | {
    "type": "s3",
    "s3.endpoint": "bj.s3.comaaaa",
    "s3.region": "bj",
    "s3.access_key": "bbba",
    "s3.secret_key": "******",
    "s3.root.path": "path/to/rootaaaa",
    "s3.bucket": "test-bucket",
    "s3.connection.request.timeout": "3000"
    "3.connection.maximum": "50",
    "s3.connection.timeout": "1000",
    } |
    +---------------------+---------+-----------------------+---------------------+-------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
    1 row in set (0.00 sec)
    ```
        

### Keywords

    SHOW, POLICY

### Best Practice

