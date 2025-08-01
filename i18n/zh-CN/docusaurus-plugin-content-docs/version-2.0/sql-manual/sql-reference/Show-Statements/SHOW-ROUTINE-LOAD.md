---
{
    "title": "SHOW-ROUTINE-LOAD",
    "language": "zh-CN"
}
---

## SHOW-ROUTINE-LOAD

### Name

SHOW ROUTINE LOAD

## 描述

该语句用于展示 Routine Load 作业运行状态

语法：

```sql
SHOW [ALL] ROUTINE LOAD [FOR jobName];
```

结果说明：

```
                  Id: 作业ID
                Name: 作业名称
          CreateTime: 作业创建时间
           PauseTime: 最近一次作业暂停时间
             EndTime: 作业结束时间
              DbName: 对应数据库名称
           TableName: 对应表名称 （多表的情况下由于是动态表，因此不显示具体表名，我们统一显示 multi-table ）
           IsMultiTbl: 是否为多表
               State: 作业运行状态
      DataSourceType: 数据源类型：KAFKA
      CurrentTaskNum: 当前子任务数量
       JobProperties: 作业配置详情
DataSourceProperties: 数据源配置详情
    CustomProperties: 自定义配置
           Statistic: 作业运行状态统计信息
            Progress: 作业运行进度
                 Lag: 作业延迟状态
ReasonOfStateChanged: 作业状态变更的原因
        ErrorLogUrls: 被过滤的质量不合格的数据的查看地址
            OtherMsg: 其他错误信息
```

* State
  
        有以下5种State：
        * NEED_SCHEDULE：作业等待被调度
        * RUNNING：作业运行中
        * PAUSED：作业被暂停
        * STOPPED：作业已结束
        * CANCELLED：作业已取消
    
* Progress
  
        对于Kafka数据源，显示每个分区当前已消费的offset。如 {"0":"2"} 表示Kafka分区0的消费进度为2。
    
* Lag
  
        对于Kafka数据源，显示每个分区的消费延迟。如{"0":10} 表示Kafka分区0的消费延迟为10。

## 举例

1. 展示名称为 test1 的所有例行导入作业（包括已停止或取消的作业）。结果为一行或多行。

    ```sql
    SHOW ALL ROUTINE LOAD FOR test1;
    ```

2. 展示名称为 test1 的当前正在运行的例行导入作业

    ```sql
    SHOW ROUTINE LOAD FOR test1;
    ```

3. 显示 example_db 下，所有的例行导入作业（包括已停止或取消的作业）。结果为一行或多行。

    ```sql
    use example_db;
    SHOW ALL ROUTINE LOAD;
    ```

4. 显示 example_db 下，所有正在运行的例行导入作业

    ```sql
    use example_db;
    SHOW ROUTINE LOAD;
    ```

5. 显示 example_db 下，名称为 test1 的当前正在运行的例行导入作业

    ```sql
    SHOW ROUTINE LOAD FOR example_db.test1;
    ```

6. 显示 example_db 下，名称为 test1 的所有例行导入作业（包括已停止或取消的作业）。结果为一行或多行。

    ```sql
    SHOW ALL ROUTINE LOAD FOR example_db.test1;
    ```

### Keywords

    SHOW, ROUTINE, LOAD

### Best Practice

