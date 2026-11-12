---
{
    "title": "基于导入的批量删除",
    "language": "zh-CN",
    "description": "删除操作可以视为数据更新的一种特殊形式。在主键模型（Unique Key）表上，Doris 支持通过导入数据时添加删除标记来实现删除操作。"
}
---

## 基于导入的批量删除

删除操作可以视为数据更新的一种特殊形式。在主键模型（Unique Key）表上，Doris 支持通过导入数据时添加删除标记来实现删除操作。

相比 `DELETE` 语句，使用删除标记在以下场景中具有更好的易用性和性能优势：

1. **CDC 场景**：在从 OLTP 数据库同步数据到 Doris 时，binlog 中的 Insert 和 Delete 操作通常交替出现。使用 `DELETE` 语句无法高效处理这些删除操作。通过使用删除标记，可以统一处理 Insert 和 Delete 操作，简化 CDC 写入 Doris 的代码，同时提高数据导入和查询性能。
2. **批量删除指定主键**：如果需要删除大量主键，使用 `DELETE` 语句的效率较低。每次执行 `DELETE` 都会生成一个空的 rowset 来记录删除条件，并产生一个新的数据版本。频繁删除或删除条件过多时，会严重影响查询性能。

## 删除标记的工作原理

### 原理说明

- **表结构**：删除标记在主键表上存储为一个隐藏列 `__DORIS_DELETE_SIGN__`，该列值为 1 时表示删除标记生效。
- **数据导入**：用户在导入任务中可以指定删除标记列的映射条件，不同导入任务的用法不同，详见下文语法说明。
- **查询**：在查询时，Doris FE 会在查询规划中自动添加 `__DORIS_DELETE_SIGN__ != true` 的过滤条件，将删除标记为 1 的数据过滤掉。
- **数据合并（compaction）**：Doris 的后台数据合并会定期清理删除标记为 1 的数据。

### 数据示例

#### 表结构

创建一个示例表：

```sql
CREATE TABLE example_table (
    id BIGINT NOT NULL,
    value STRING
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "replication_num" = "3"
);
```

使用 session 变量 `show_hidden_columns` 查看隐藏列：

```sql
mysql> set show_hidden_columns=true;

mysql> desc example_table;
+-----------------------+---------+------+-------+---------+-------+
| Field                 | Type    | Null | Key   | Default | Extra |
+-----------------------+---------+------+-------+---------+-------+
| id                    | bigint  | No   | true  | NULL    |       |
| value                 | text    | Yes  | false | NULL    | NONE  |
| __DORIS_DELETE_SIGN__ | tinyint | No   | false | 0       | NONE  |
| __DORIS_VERSION_COL__ | bigint  | No   | false | 0       | NONE  |
+-----------------------+---------+------+-------+---------+-------+
```

#### 数据导入

表中有如下存量数据：

```sql
+------+-------+
| id   | value |
+------+-------+
|    1 | foo   |
|    2 | bar   |
+------+-------+
```

通过 `INSERT INTO` 写入 id 为 1 的删除标记（此处仅做原理展示，不介绍各种导入使用删除标记的方法）：

```sql
mysql> insert into example_table (id, __DORIS_DELETE_SIGN__) values (1, 1);
```

#### 查询

直接查看数据，可以发现 id 为 1 的记录已被删除：

```sql
mysql> select * from example_table;
+------+-------+
| id   | value |
+------+-------+
|    2 | bar   |
+------+-------+
```

使用 session 变量 `show_hidden_columns` 查看隐藏列，可以看到 id 为 1 的行并未被实际删除，其隐藏列 `__DORIS_DELETE_SIGN__` 值为 1，在查询时被过滤掉：

```sql
mysql> set show_hidden_columns=true;
mysql> select * from example_table;
+------+-------+-----------------------+-----------------------+
| id   | value | __DORIS_DELETE_SIGN__ | __DORIS_VERSION_COL__ |
+------+-------+-----------------------+-----------------------+
|    1 | NULL  |                     1 |                     3 |
|    2 | bar   |                     0 |                     2 |
+------+-------+-----------------------+-----------------------+
```

## 语法说明

不同导入类型在设置删除标记的语法上有所不同，以下是各种导入类型的删除标记使用语法。

### 导入合并方式选择

导入数据时有几种合并方式：

1. **APPEND**：数据全部追加到现有数据中。
2. **DELETE**：删除所有与导入数据 key 列值相同的行。
3. **MERGE**：根据 DELETE ON 的条件决定 APPEND 还是 DELETE。

### Stream Load

`Stream Load` 的写法是在 header 中的 columns 字段增加一个设置删除标记列的字段，示例：`-H "columns: k1, k2, label_c3" -H "merge_type: [MERGE|APPEND|DELETE]" -H "delete: label_c3=1"`。

关于 Stream Load 的使用示例，请查阅 [Stream Load 使用手册](../import/import-way/stream-load-manual.md) 中“指定 merge_type 进行 Delete 操作”和“指定 merge_type 进行 Merge 操作”章节的内容。

### Broker Load

`Broker Load` 的写法是在 `PROPERTIES` 处设置删除标记列的字段，语法如下：

```sql
LOAD LABEL db1.label1
(
    [MERGE|APPEND|DELETE] DATA INFILE("hdfs://abc.com:8888/user/palo/test/ml/file1")
    INTO TABLE tbl1
    COLUMNS TERMINATED BY ","
    (tmp_c1,tmp_c2, label_c3)
    SET
    (
        id=tmp_c2,
        name=tmp_c1,
    )
    [DELETE ON label_c3=true]
)
WITH BROKER 'broker'
(
    "username"="user",
    "password"="pass"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### Routine Load

`Routine Load` 的写法是在 `columns` 字段增加映射，映射方式同上，语法如下：

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl 
 [WITH MERGE|APPEND|DELETE]
 COLUMNS(k1, k2, k3, v1, v2, label),
 WHERE k1  100 and k2 like "%doris%"
 [DELETE ON label=true]
 PROPERTIES
 (
     "desired_concurrent_number"="3",
     "max_batch_interval" = "20",
     "max_batch_rows" = "300000",
     "max_batch_size" = "209715200",
     "strict_mode" = "false"
 )
 FROM KAFKA
 (
     "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
     "kafka_topic" = "my_topic",
     "kafka_partitions" = "0,1,2,3",
     "kafka_offsets" = "101,0,0,200"
 );
```
