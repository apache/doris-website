---
{
    "title": "VARIANT",
    "language": "zh-CN"
}
---

## VARIANT

## 描述

在 Doris 2.1 中引入一种新的数据类型 VARIANT，它可以存储半结构化 JSON 数据。它允许存储包含不同数据类型（如整数、字符串、布尔值等）的复杂数据结构，而无需在表结构中提前定义具体的列。VARIANT 类型特别适用于处理复杂的嵌套结构，而这些结构可能随时会发生变化。在写入过程中，该类型可以自动根据列的结构、类型推断列信息，动态合并写入的 schema，并通过将 JSON 键及其对应的值存储为列和动态子列。

### Note

相比 JSON 类型有以下优势：

1. 存储方式不同，JSON 类型是以二进制 JSONB 格式进行存储，整行 JSON 以行存的形式存储到 segment 文件中。而 VARIANT 类型在写入的时候进行类型推断，将写入的 JSON 列存化。比 JSON 类型有更高的压缩比，存储空间更小。
2. 查询方式不同，查询不需要进行解析。VARIANT 充分利用 Doris 中列式存储、向量化引擎、优化器等组件给用户带来极高的查询性能。
下面是基于 clickbench 数据测试的结果：

|    | 存储空间   |
|--------------|------------|
| 预定义静态列 | 12.618 GB  |
| VARIANT 类型    | 12.718 GB |
| JSON 类型             | 35.711 GB   |

**节省约 65% 存储容量**

| 查询次数        | 预定义静态列 | VARIANT 类型 | JSON 类型        |
|----------------|--------------|--------------|-----------------|
| 第一次查询 (cold) | 233.79s      | 248.66s      | **大部分查询超时**  |
| 第二次查询 (hot)  | 86.02s       | 94.82s       | 789.24s         |
| 第三次查询 (hot)  | 83.03s       | 92.29s       | 743.69s         |

[测试集](https://github.com/ClickHouse/ClickBench/blob/main/doris/queries.sql) 一共 43 个查询语句

**查询提速 8+ 倍，查询性能与静态列相当**

## 举例

用一个从建表、导数据、查询全周期的例子说明 VARIANT 的功能和用法。

**建表语法**

建表语法关键字 VARIANT

``` sql
-- 无索引
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT
)
table_properties;

-- 在v列创建索引，可选指定分词方式，默认不分词
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT,
    INDEX idx_var(v) USING INVERTED [PROPERTIES("parser" = "english|unicode|chinese")] [COMMENT 'your comment']
)
table_properties;

-- 在v列创建bloom filter
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT
)
...
properties("replication_num" = "1", "bloom_filter_columns" = "v");
```

**查询语法**

``` sql
-- 使用 v['a']['b'] 形式如下，v['properties']['title']类型是VARIANT
SELECT v['properties']['title'] from ${table_name}
```

### 基于 github events 数据集示例

这里用 github events 数据展示 VARIANT 的建表、导入、查询。
下面是格式化后的一行数据

``` json
{
  "id": "14186154924",
  "type": "PushEvent",
  "actor": {
    "id": 282080,
    "login": "brianchandotcom",
    "display_login": "brianchandotcom",
    "gravatar_id": "",
    "url": "https://api.github.com/users/brianchandotcom",
    "avatar_url": "https://avatars.githubusercontent.com/u/282080?"
  },
  "repo": {
    "id": 1920851,
    "name": "brianchandotcom/liferay-portal",
    "url": "https://api.github.com/repos/brianchandotcom/liferay-portal"
  },
  "payload": {
    "push_id": 6027092734,
    "size": 4,
    "distinct_size": 4,
    "ref": "refs/heads/master",
    "head": "91edd3c8c98c214155191feb852831ec535580ba",
    "before": "abb58cc0db673a0bd5190000d2ff9c53bb51d04d",
    "commits": [""]
  },
  "public": true,
  "created_at": "2020-11-13T18:00:00Z"
}
```

**建表**

- 创建了三个 VARIANT 类型的列， `actor`，`repo` 和 `payload`
- 创建表的同时创建了 `payload` 列的倒排索引 `idx_payload`
- USING INVERTED 指定索引类型是倒排索引，用于加速子列的条件过滤
- `PROPERTIES("parser" = "english")` 指定采用 english 分词

``` sql
CREATE DATABASE test_variant;
USE test_variant;
CREATE TABLE IF NOT EXISTS github_events (
    id BIGINT NOT NULL,
    type VARCHAR(30) NULL,
    actor VARIANT NULL,
    repo VARIANT NULL,
    payload VARIANT NULL,
    public BOOLEAN NULL,
    created_at DATETIME NULL,
    INDEX idx_payload (`payload`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for payload'
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(id) BUCKETS 10
properties("replication_num" = "1");
```

**需要注意的是：**

:::tip

1. 在 VARIANT 列上创建索引，比如 payload 的子列很多时，可能会造成索引列过多，影响写入性能
2. 同一个 VARIANT 列的分词属性是相同的，如果您有不同的分词需求，那么可以创建多个 VARIANT 然后分别指定索引属性

:::

**使用 streamload 导入**

导入 gh_2022-11-07-3.json，这是 github events 一个小时的数据

``` shell
wget https://qa-build.oss-cn-beijing.aliyuncs.com/regression/variant/gh_2022-11-07-3.json

curl --location-trusted -u root:  -T gh_2022-11-07-3.json -H "read_json_by_line:true" -H "format:json"  http://127.0.0.1:18148/api/test_variant/github_events/_strea
m_load

{
    "TxnId": 2,
    "Label": "086fd46a-20e6-4487-becc-9b6ca80281bf",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 139325,
    "NumberLoadedRows": 139325,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 633782875,
    "LoadTimeMs": 7870,
    "BeginTxnTimeMs": 19,
    "StreamLoadPutTimeMs": 162,
    "ReadDataTimeMs": 2416,
    "WriteDataTimeMs": 7634,
    "CommitAndPublishTimeMs": 55
}
```

确认导入成功

``` sql
-- 查看行数
mysql> select count() from github_events;
+----------+
| count(*) |
+----------+
|   139325 |
+----------+
1 row in set (0.25 sec)

-- 随机看一条数据
mysql> select * from github_events limit 1;
+-------------+-----------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------+---------------------+
| id          | type      | actor                                                                                                                                                                                                                       | repo                                                                                                                                                     | payload                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | public | created_at          |
+-------------+-----------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------+---------------------+
| 25061821748 | PushEvent | {"gravatar_id":"","display_login":"jfrog-pipelie-intg","url":"https://api.github.com/users/jfrog-pipelie-intg","id":98024358,"login":"jfrog-pipelie-intg","avatar_url":"https://avatars.githubusercontent.com/u/98024358?"} | {"url":"https://api.github.com/repos/jfrog-pipelie-intg/jfinte2e_1667789956723_16","id":562683829,"name":"jfrog-pipelie-intg/jfinte2e_1667789956723_16"} | {"commits":[{"sha":"334433de436baa198024ef9f55f0647721bcd750","author":{"email":"98024358+jfrog-pipelie-intg@users.noreply.github.com","name":"jfrog-pipelie-intg"},"message":"commit message 10238493157623136117","distinct":true,"url":"https://api.github.com/repos/jfrog-pipelie-intg/jfinte2e_1667789956723_16/commits/334433de436baa198024ef9f55f0647721bcd750"}],"before":"f84a26792f44d54305ddd41b7e3a79d25b1a9568","head":"334433de436baa198024ef9f55f0647721bcd750","size":1,"push_id":11572649828,"ref":"refs/heads/test-notification-sent-branch-10238493157623136113","distinct_size":1} |      1 | 2022-11-07 11:00:00 |
+-------------+-----------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------+---------------------+
1 row in set (0.23 sec)
```

desc 查看 schema 信息，子列会在存储层自动扩展、并进行类型推导

``` sql
mysql> desc github_events;
+------------------------------------------------------------+------------+------+-------+---------+-------+
| Field                                                      | Type       | Null | Key   | Default | Extra |
+------------------------------------------------------------+------------+------+-------+---------+-------+
| id                                                         | BIGINT     | No   | true  | NULL    |       |
| type                                                       | VARCHAR(*) | Yes  | false | NULL    | NONE  |
| actor                                                      | VARIANT    | Yes  | false | NULL    | NONE  |
| created_at                                                 | DATETIME   | Yes  | false | NULL    | NONE  |
| payload                                                    | VARIANT    | Yes  | false | NULL    | NONE  |
| public                                                     | BOOLEAN    | Yes  | false | NULL    | NONE  |
+------------------------------------------------------------+------------+------+-------+---------+-------+
6 rows in set (0.07 sec)

mysql> set describe_extend_variant_column = true;
Query OK, 0 rows affected (0.01 sec)

mysql> desc github_events;
+------------------------------------------------------------+------------+------+-------+---------+-------+
| Field                                                      | Type       | Null | Key   | Default | Extra |
+------------------------------------------------------------+------------+------+-------+---------+-------+
| id                                                         | BIGINT     | No   | true  | NULL    |       |
| type                                                       | VARCHAR(*) | Yes  | false | NULL    | NONE  |
| actor                                                      | VARIANT    | Yes  | false | NULL    | NONE  |
| actor.avatar_url                                           | TEXT       | Yes  | false | NULL    | NONE  |
| actor.display_login                                        | TEXT       | Yes  | false | NULL    | NONE  |
| actor.id                                                   | INT        | Yes  | false | NULL    | NONE  |
| actor.login                                                | TEXT       | Yes  | false | NULL    | NONE  |
| actor.url                                                  | TEXT       | Yes  | false | NULL    | NONE  |
| created_at                                                 | DATETIME   | Yes  | false | NULL    | NONE  |
| payload                                                    | VARIANT    | Yes  | false | NULL    | NONE  |
| payload.action                                             | TEXT       | Yes  | false | NULL    | NONE  |
| payload.before                                             | TEXT       | Yes  | false | NULL    | NONE  |
| payload.comment.author_association                         | TEXT       | Yes  | false | NULL    | NONE  |
| payload.comment.body                                       | TEXT       | Yes  | false | NULL    | NONE  |
....
+------------------------------------------------------------+------------+------+-------+---------+-------+
406 rows in set (0.07 sec)
```

desc 可以指定 partition 查看某个 partition 的 schema，语法如下

```
DESCRIBE ${table_name} PARTITION ($partition_name);
```

**查询**

:::tip

**注意**
如使用过滤和聚合等功能来查询子列，需要对子列进行额外的 cast 操作（因为存储类型不一定是固定的，需要有一个 SQL 统一的类型）。
例如 SELECT * FROM tbl where CAST(var['titile'] as text) MATCH "hello world"
以下简化的示例说明了如何使用 VARIANT 进行查询

:::

下面是典型的三个查询场景：

1. 从 github_events 表中获取 top 5 star 数的代码库

``` sql
mysql> SELECT
    ->     cast(repo['name'] as text) as repo_name, count() AS stars
    -> FROM github_events
    -> WHERE type = 'WatchEvent'
    -> GROUP BY repo_name
    -> ORDER BY stars DESC LIMIT 5;
+--------------------------+-------+
| repo_name                | stars |
+--------------------------+-------+
| aplus-framework/app      |    78 |
| lensterxyz/lenster       |    77 |
| aplus-framework/database |    46 |
| stashapp/stash           |    42 |
| aplus-framework/image    |    34 |
+--------------------------+-------+
5 rows in set (0.03 sec)
```

2. 获取评论中包含 doris 的数量

``` sql
-- implicit cast `payload['comment']['body']` to string type
mysql> SELECT
    ->     count() FROM github_events
    ->     WHERE payload['comment']['body'] MATCH 'doris';
+---------+
| count() |
+---------+
|       3 |
+---------+
1 row in set (0.04 sec)
```

3. 查询 comments 最多的 issue 号以及对应的库

``` sql
mysql> SELECT 
    ->   cast(repo['name'] as string) as repo_name, 
    ->   cast(payload['issue']['number'] as int) as issue_number, 
    ->   count() AS comments, 
    ->   count(
    ->     distinct cast(actor['login'] as string)
    ->   ) AS authors 
    -> FROM  github_events 
    -> WHERE type = 'IssueCommentEvent' AND (cast(payload['action'] as string) = 'created') AND (cast(payload['issue']['number'] as int) > 10) 
    -> GROUP BY repo_name, issue_number 
    -> HAVING authors >= 4
    -> ORDER BY comments DESC, repo_name 
    -> LIMIT 50;
+--------------------------------------+--------------+----------+---------+
| repo_name                            | issue_number | comments | authors |
+--------------------------------------+--------------+----------+---------+
| facebook/react-native                |        35228 |        5 |       4 |
| swsnu/swppfall2022-team4             |           27 |        5 |       4 |
| belgattitude/nextjs-monorepo-example |         2865 |        4 |       4 |
+--------------------------------------+--------------+----------+---------+
3 rows in set (0.03 sec)
```

### 使用限制和最佳实践

**VARIANT 类型的使用有以下限制：**
VARIANT 动态列与预定义静态列几乎一样高效。处理诸如日志之类的数据，在这类数据中，经常通过动态属性添加字段（例如 Kubernetes 中的容器标签）。但是解析 JSON 和推断类型会在写入时产生额外开销。因此，我们建议保持单次导入列数在 1000 以下。

尽可能保证类型一致，Doris 会自动进行如下兼容类型转换，当字段无法进行兼容类型转换时会统一转换成 JSONB 类型。JSONB 列的性能与 int、text 等列性能会有所退化。

1. tinyint->smallint->int->bigint，整形可以按照箭头做类型提升
2. float->double，浮点数按照箭头做类型提升
3. text，字符串类型
4. JSON，二进制 JSON 类型

上诉类型无法兼容时，会变成 JSON 类型防止类型信息丢失，如果您需要在 VARIANT 中设置严格的 schema，即将推出 VARIANT MAPPING 机制

其它限制如下：

- VARIANT 列只能创建倒排索引或者 bloom filter 来加速过滤
- **推荐使用 RANDOM 模式和[Group Commit](../../../../data-operate/import/group-commit-manual) 模式，写入性能更高效**
- 日期、decimal 等非标准 JSON 类型会被默认推断成字符串类型，所以尽可能从 VARIANT 中提取出来，用静态类型，性能更好
- 2 维及其以上的数组列存化会被存成 JSONB 编码，性能不如原生数组
- 不支持作为主键或者排序键
- 查询过滤、聚合需要带 cast，存储层会根据存储类型和 cast 目标类型来消除 cast 操作，加速查询。
- 读取整个 VARIANT 列时，会扫描其所有子字段。如果该列包含大量子字段，这可能导致显著的扫描开销，从而影响查询性能。为了优化在需要检索整个列时的性能，建议添加一个 STRING 或 JSONB 类型的附加列，用于存储原始的 JSON 字符串。这种方法允许您直接查询整个 JSON 对象，从而减少扫描成本。
``` sql
-- 导致扫描 data_variant 的所有子字段
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_variant LIKE '%doris%';

-- 对于 `LIKE` 查询，性能更佳
CREATE TABLE example_table (
  id INT,
  data_string STRING,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_string LIKE '%doris%';
```

**针对列数限制的调优手段：**

注意如果是 超过 5000 子列，对内存和配置有比较高的要求，单机尽可能 128G 以上内存，核数 32C 以上
1. BE 配置`variant_max_merged_tablet_schema_size=n` n 大于实际的列数（不推荐超过 10000）
2. 需要注意的是，提取的列数过多会导致 compaction 的压力过大（需要控制导入的吞吐）。根据内存使用情况增大客户端导入的 batch_size 可以降低 compaction 的写放大（或者推荐使用 group_commit，表 properties 配置，适当增加`group_commit_interval_ms` 和 `group_commit_data_bytes`）
3. 如果查询没有分桶裁剪的需求，可以使用 random 分桶，开启 [load_to_single_tablet](../../../../table-design/data-partitioning/data-bucketing#bucketing) 导入（导入的配置），可以减少 compaction 写放大
4. BE 配置 根据导入压力调整 `max_cumu_compaction_threads`，至少保证 8 个线程
5. BE 配置`vertical_compaction_num_columns_per_group=500`提升分组 compaction 效率，但是会增加内存开销销
6. BE 配置`segment_cache_memory_percentage=20`增加 segment 缓存的容量，提升元数据缓存效率率
7. 注意关注 Compaction Score，如果 Score 持续增加会导致，Score 过高反应 Compaction 做不过来（需要适当降低导入压力）
8. `SELECT *` 或者 `SELECT variant` 会导致集群整体压力明显上升，甚至出现超时或者内存超限。建议查询带上 Path 信息例如 `SELECT variant['path_1']`。


### FAQ
1. Stream Load 报错： [CANCELLED][INTERNAL_ERROR]tablet error: [DATA_QUALITY_ERROR]Reached max column size limit 2048。

    由于 Compaction 和元信息存储限制，VARIANT 类型会限制列数，默认 2048 列，可以适当调整 BE 配置 `variant_max_merged_tablet_schema_size` ，但是不建议超过 4096（依赖较高配置机型）

2. VARIANT 类型中的 null（例如 `{"key": null}` ）和 SQL 中的 NULL（即 IS NULL）有区别吗？ 

    没有区别，在 VARIANT 类型中，它们被视为等价的。

### Keywords

    VARIANT
