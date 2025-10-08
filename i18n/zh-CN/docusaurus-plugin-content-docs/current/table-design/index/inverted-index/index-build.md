---
{
    "title": "倒排索引构建",
    "language": "zh-CN"
}
---

## BUILD INDEX

`CREATE / ADD INDEX` 操作只是新增了索引定义，这个操作之后的新写入数据会生成倒排索引，而存量数据需要使用 `BUILD INDEX` 触发：

```sql
-- 语法 1，默认给全表的所有分区 BUILD INDEX
BUILD INDEX index_name ON table_name;
-- 语法 2，可指定 Partition，可指定一个或多个
BUILD INDEX index_name ON table_name PARTITIONS(partition_name1, partition_name2);
```

通过 `SHOW BUILD INDEX` 查看 `BUILD INDEX` 进度：
```sql
SHOW BUILD INDEX [FROM db_name];
-- 示例 1，查看所有的 BUILD INDEX 任务进展
SHOW BUILD INDEX;
-- 示例 2，查看指定 table 的 BUILD INDEX 任务进展
SHOW BUILD INDEX where TableName = "table1";
```

通过 `CANCEL BUILD INDEX` 取消 `BUILD INDEX`：
```sql
CANCEL BUILD INDEX ON table_name;
CANCEL BUILD INDEX ON table_name (job_id1,jobid_2,...);
```

:::tip

`BUILD INDEX` 会生成一个异步任务执行，在每个 BE 上有多个线程执行索引构建任务，通过 BE 参数 `alter_index_worker_count` 可以设置，默认值是 3。

2.0.12 和 2.1.4 之前的版本 `BUILD INDEX` 会一直重试直到成功，从这两个版本开始通过失败和超时机制避免一直重试。3.0 存算分离模式暂不支持此命令。

1. 一个 tablet 的多数副本 `BUILD INDEX` 失败后，整个 `BUILD INDEX` 失败结束
2. 时间超过 `alter_table_timeout_second` ()，`BUILD INDEX` 超时结束
3. 用户可以多次触发 `BUILD INDEX`，已经 BUILD 成功的索引不会重复 BUILD

:::
