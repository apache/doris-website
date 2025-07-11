---
{
    "title": "CREATE-POLICY",
    "language": "zh-CN"
}
---

## CREATE-POLICY

### Name
:::tip 提示
该功能自 Apache Doris  1.2 版本起支持
:::


CREATE POLICY



## 描述

创建策略，包含以下几种：

1. 创建安全策略 (ROW POLICY)，explain 可以查看改写后的 SQL。
2. 创建数据迁移策略 (STORAGE POLICY)，用于冷热数据转换。

#### 语法：

1. ROW POLICY
```sql
CREATE ROW POLICY test_row_policy_1 ON test.table1 
AS {RESTRICTIVE|PERMISSIVE} TO test USING (id in (1, 2));
```
参数说明：

- filterType：RESTRICTIVE 将一组策略通过 AND 连接，PERMISSIVE 将一组策略通过 OR 连接
- 配置多个策略首先合并 RESTRICTIVE 的策略，再添加 PERMISSIVE 的策略
- RESTRICTIVE 和 PERMISSIVE 之间通过 AND 连接的
- 不允许对 root 和 admin 用户创建

2. STORAGE POLICY
```sql
CREATE STORAGE POLICY test_storage_policy_1
PROPERTIES ("key"="value", ...);
```
参数说明：
- PROPERTIES 中需要指定资源的类型：
    1. storage_resource：指定策略使用的 storage resource 名称。
    2. cooldown_datetime：热数据转为冷数据时间，不能与 cooldown_ttl 同时存在。
    3. cooldown_ttl：热数据持续时间。从数据分片生成时开始计算，经过指定时间后转为冷数据。支持的格式：
        1d：1 天
        1h：1 小时
        50000: 50000 秒

## 举例

1. 创建一组行安全策略

   ```sql
   CREATE ROW POLICY test_row_policy_1 ON test.table1 
   AS RESTRICTIVE TO test USING (c1 = 'a');
   ```
   ```sql
   CREATE ROW POLICY test_row_policy_2 ON test.table1 
   AS RESTRICTIVE TO test USING (c2 = 'b');
   ```
   ```sql
   CREATE ROW POLICY test_row_policy_3 ON test.table1 
   AS PERMISSIVE TO test USING (c3 = 'c');
   ```
   ```sql
   CREATE ROW POLICY test_row_policy_3 ON test.table1 
   AS PERMISSIVE TO test USING (c4 = 'd');
   ```

   当我们执行对 table1 的查询时被改写后的 sql 为

   ```sql
   select * from (select * from table1 where c1 = 'a' and c2 = 'b' or c3 = 'c' or c4 = 'd')
   ```
2. 创建数据迁移策略
    1. 说明
        - 冷热分层创建策略，必须先创建 resource，然后创建迁移策略时候关联创建的 resource 名
        - 当前不支持删除 drop 数据迁移策略，防止数据被迁移后。策略被删除了，系统无法找回数据
   
    2. 指定数据冷却时间创建数据迁移策略
    ```sql
    CREATE STORAGE POLICY testPolicy
    PROPERTIES(
      "storage_resource" = "s3",
      "cooldown_datetime" = "2022-06-08 00:00:00"
    );
    ```
    3. 指定热数据持续时间创建数据迁移策略
    ```sql
    CREATE STORAGE POLICY testPolicy
    PROPERTIES(
      "storage_resource" = "s3",
      "cooldown_ttl" = "1d"
    );
    ```
    相关参数如下：
    - `storage_resource`：创建的storage resource名称
    - `cooldown_datetime`：迁移数据的时间点
    - `cooldown_ttl`：迁移数据距离当前时间的倒计时，单位s。与cooldown_datetime二选一即可

### Keywords

    CREATE, POLICY

### Best Practice

