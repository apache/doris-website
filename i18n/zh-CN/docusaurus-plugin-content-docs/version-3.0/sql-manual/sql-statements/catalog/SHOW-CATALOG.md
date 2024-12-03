---
{
    "title": "ALTER DATABASE",
    "language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->



## 描述

该语句用于设置指定数据库的属性。（仅管理员使用）


1) 设置数据库数据量配额，单位为 B/K/KB/M/MB/G/GB/T/TB/P/PB


```sql
ALTER DATABASE db_name SET DATA QUOTA quota;
```

2) 重命名数据库

```sql
ALTER DATABASE db_name RENAME new_db_name;
```

3) 设置数据库的副本数量配额

```sql
ALTER DATABASE db_name SET REPLICA QUOTA quota; 
```

说明：
    重命名数据库后，如需要，请使用 REVOKE 和 GRANT 命令修改相应的用户权限。

    数据库的默认数据量配额为 1024GB，默认副本数量配额为 1073741824。

4) 对已有 database 的 property 进行修改操作

```sql
ALTER DATABASE db_name SET PROPERTIES ("key"="value", ...); 
```

### Example

1. 设置指定数据库数据量配额

    ```sql
    ALTER DATABASE example_db SET DATA QUOTA 10995116277760;
    上述单位为字节，等价于
    ALTER DATABASE example_db SET DATA QUOTA 10T;

    ALTER DATABASE example_db SET DATA QUOTA 100G;

    ALTER DATABASE example_db SET DATA QUOTA 200M;
    ```

2. 将数据库 example_db 重命名为 example_db2

    ```sql
    ALTER DATABASE example_db RENAME example_db2;
    ```

3. 设定指定数据库副本数量配额

    ```sql
    ALTER DATABASE example_db SET REPLICA QUOTA 102400;
    ```

4. 修改 db 下 table 的默认副本分布策略（该操作仅对新建的 table 生效，不会修改 db 下已存在的 table）

    ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "tag.location.default:2");
    ```


5. 取消 db 下 table 的默认副本分布策略（该操作仅对新建的 table 生效，不会修改 db 下已存在的 table）

    ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "");
    ```

## 关键词


ALTER,DATABASE,RENAME




  用于指定作业执行频率，它可以是天、小时、分钟、周。例如：` 1 DAY` 表示每天执行一次，` 1 HOUR` 表示每小时执行一次，` 1 MINUTE` 表示每分钟执行一次，` 1 WEEK` 表示每周执行一次。

    - STARTS timestamp（可选字段）

      格式：'YYYY-MM-DD HH:MM:SS',用于指定作业的开始时间，如果没有指定，则从当前时间的下一个时间点开始执行。开始时间必须大于当前时间。

    - ENDS timestamp（可选字段）

      格式：'YYYY-MM-DD HH:MM:SS', 用于指定作业的结束时间，如果没有指定，则表示永久执行。该日期必须大于当前时间，如果指定了开始时间，即 `STARTS`，则结束时间必须大于开始时间。

- DO

  用于指定作业触发时需要执行的操作，目前仅支持 ***INSERT 内表*** 操作。后续我们会支持更多的操作。

## 例子

创建一个一次性的 Job，它会在 2020-01-01 00:00:00 时执行一次，执行的操作是将 db2.tbl2 中的数据导入到 db1.tbl1 中。

```sql

CREATE JOB my_job ON SCHEDULE AT '2020-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;

```

创建一个周期性的 Job，它会在 2020-01-01 00:00:00 时开始执行，每天执行一次，执行的操作是将 db2.tbl2 中的数据导入到 db1.tbl1 中。

```sql
CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2020-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 WHERE  create_time >=  days_add(now(),-1);
```

创建一个周期性的 Job，它会在 2020-01-01 00:00:00 时开始执行，每天执行一次，执行的操作是将 db2.tbl2 中的数据导入到 db1.tbl1 中，该 Job 在 2020-01-01 00:10:00 时结束。

```sql
CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2020-01-01 00:00:00' ENDS '2020-01-01 00:10:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 create_time >=  days_add(now(),-1);
```

### INSERT JOB

- 目前仅支持 ***INSERT 内表***
- 当下一个计划任务时间到期，即需要调度任务执行时，如果当前 JOB 仍有历史任务正在执行，则会跳过当前任务调度。因此控制一个合理的执行间隔非常重要。

### CONFIG

fe.conf

- job_dispatch_timer_job_thread_num, 用于分发定时任务的线程数，默认值 2，如果含有大量周期执行任务，可以调大这个参数。

- job_dispatch_timer_job_queue_size, 任务堆积时用于存放定时任务的队列大小，默认值 1024. 如果有大量任务同一时间触发，可以调大这个参数。否则会导致队列满，提交任务会进入阻塞状态，从而导致后续任务无法提交。

- finished_job_cleanup_threshold_time_hour, 用于清理已完成的任务的时间阈值，单位为小时，默认值为 24 小时。

- job_insert_task_consumer_thread_num = 10;用于执行 Insert 任务的线程数，值应该大于 0，否则默认为 5.

### 最佳实践

- 合理的进行 Job 的管理，避免大量的 Job 同时触发，导致任务堆积，从而影响系统的正常运行。
- 任务的执行间隔应该设置在一个合理的范围，至少应该大于任务执行时间。

## 关键词

        CREATE, JOB

         `status` 表示导入数据是否可见。如果可见，显示 `visible`，如果不可见，显示 `committed`。

         `txnId` 为这个 insert 对应的导入事务的 id。

         `err` 字段会显示一些其他非预期错误。

         当需要查看被过滤的行时，用户可以通过如下语句

         ```sql
         show load where label="xxx";
         ```

         返回结果中的 URL 可以用于查询错误的数据，具体见后面 **查看错误行** 小结。

         **数据不可见是一个临时状态，这批数据最终是一定可见的**

         可以通过如下语句查看这批数据的可见状态：

         ```sql
         show transaction where id=4005;
         ```

         返回结果中的 `TransactionStatus` 列如果为 `visible`，则表述数据可见。

   3. 执行失败

      执行失败表示没有任何数据被成功导入，并返回如下：

      ```sql
      mysql> insert into tbl1 select * from tbl2 where k1 = "a";
      ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=__shard_2/error_log_insert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0bf8a2
      ```

      其中 `ERROR 1064 (HY000): all partitions have no load data` 显示失败原因。后面的 url 可以用于查询错误的数据：

      ```sql
      show load warnings on "url";
      ```

      可以查看到具体错误行。

2. 超时时间

    
   INSERT 操作的超时时间由 [会话变量](../../../../advanced/variables.md) `insert_timeout` 控制。默认为 4 小时。超时则作业会被取消。

3. Label 和原子性

   INSERT 操作同样能够保证导入的原子性，可以参阅 [导入事务和原子性](../../../../data-operate/import/import-scenes/load-atomicity.md) 文档。

   当需要使用 `CTE(Common Table Expressions)` 作为 insert 操作中的查询部分时，必须指定 `WITH LABEL` 和 `column` 部分。

4. 过滤阈值

   与其他导入方式不同，INSERT 操作不能指定过滤阈值（`max_filter_ratio`）。默认的过滤阈值为 1，即素有错误行都可以被忽略。

   对于有要求数据不能够被过滤的业务场景，可以通过设置 [会话变量](../../../../advanced/variables.md) `enable_insert_strict` 为 `true` 来确保当有数据被过滤掉的时候，`INSERT` 不会被执行成功。

5. 性能问题

   不建议使用 `VALUES` 方式进行单行的插入。如果必须这样使用，请将多行数据合并到一个 INSERT 语句中进行批量提交。
