---
{
    'title': 'Variant in Apache Doris 2.1.0: a new data type 8 times faster than JSON for semi-structured data analysis',
    'description': 'Doris 2.1.0 provides a new data type: Variant, for semi-structured data analysis, which enables 8 times faster query performance than JSON with one-third storage space.',
    'date': '2024-03-26',
    'author': 'Apache Doris',
    'tags': ['Tech Sharing'],
    "image": '/images/variant-in-apache-doris-2.1.png'
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

Semi-structured data is data arranged in flexible formats. Unlike structured data, it does not require data users to pre-define the table schema for it, so it provides convenience for data storage and analysis. Common forms of semi-structured data include XML, JSON, and log files. They are widely seen in the following industry scenarios:

- **E-commerce** platforms store user reviews of products as semi-structured data for sentiment analysis and user behavior pattern mining.

- **Telecommunication** use cases often require schemaless support for their network data and complicated nested JSON data.

- **Mobile applications** keep records of user behavior in the form of semi-structured data, because after new features are introduced, the user behavior attributes can change. A non-fixed schema can adapt to these changes easily and save the trouble of frequent manual modification. 

- **Internet of Vehicles** (IoV) and **Internet of Things** (IoT) platforms receive real-time data from vehicle sensors, such as speed, location, and fuel consumption, based on which they perform real-time monitoring, fault alerting, and route planning. Such data is also stored as semi-structured data.

As an open-source real-time data warehouse, [Apache Doris](https://doris.apache.org) provides semi-structured data processing capabilities, and the newly-released [version 2.1.0](https://doris.apache.org/blog/release-note-2.1.0) makes a stride in this direction. Before V2.1, Apache Doris stores semi-structured data as JSON files. However, during query execution, the real-time parsing of JSON data leads to high CPU and I/O consumption in addition to high query latency, especially when the dataset is huge and complicated. Moreover, the lack of a pre-defined schema means there is no handle for query optimization. 


## A newly-added data type: Variant

:::tip
To help you quickly learn and use Variant data type, we provide **[a hands-on demo](https://www.youtube.com/watch?v=FVfsnkZUBsU) **
:::


In Apache Doris 2.1.0, we have introduced a new data type: [Variant](https://doris.apache.org/docs/sql-manual/sql-reference/Data-Types/VARIANT). Fields of the Variant data type can accommodate integers, strings, boolean values, and any combination of them. With Variant, you don't have to define the specific columns in the table schema in advance.

The Variant data type is well-suited to handle nested structures, which tend to change dynamically. Upon data writing, the Variant type automatically infers column information based on the data and its structure in the columns, and then merges it into the existing table schema. It stores the JSON keys and their corresponding values as dynamic sub-columns. 

Meanwhile, you can include both Variant columns and static columns of pre-defined data types in the same table. This Schema-on-Write method provides greater flexibility in storage and queries. Powered by the columnar storage, vectorized execution engine, and query optimizer of Doris, the Variant type delivers high efficiency in queries and storage. 

Compared to the JSON type, storage data in the Variant type can save up to 65% of disk space, and increase query speed by 8 times. (See details later in this post)

## Usage guide

Create table: syntax keyword `variant`

```sql
-- No index
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT
)
table_properties;

-- Create index for the v column, specify the parser
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT,
    INDEX idx_var(v) USING INVERTED [PROPERTIES("parser" = "english|unicode|chinese")] [COMMENT 'your comment']
)
table_properties;

-- Create Bloom Filter for the v column
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT
)
...
properties("replication_num" = "1", "bloom_filter_columns" = "v");
```

Query: access sub-column via `[]`. The sub-columns are also of the Variant type.

```sql
SELECT v["properties"]["title"] from ${table_name}
```

Now, let's show you how to create a table containing the Variant data type and conduct data ingestion and queries to it. The dataset is Github Events records. This is one of the formatted records:

```JSON
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

### 01  Create table

- Create 3 columns of the Variant type: `actor`, `repo` and `payload`

- Meanwhile, create inverted index for the `payload` column: `idx_payload`

- `USING INVERTED` specifies the index as inverted index, which accelerates conditional filtering on sub-columns

```sql
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

> Note: If the `Payload` column has too many sub-columns, creating indexes on it may lead to an excessive number of index columns and decrease data writing performance. If the data analysis only involves equivalence queries, it is advisable to build Bloom Filter index on the Variant columns. This can bring better performance than inverted index. For a single Variant column, if the parsing properties are the same but you have multiple parsing requirements, you can replicate the column and specify various indexes for each of them.

### 02  Ingest data by Stream Load

Load the `gh_2022-11-07-3.json` file, which is Github Events records of an hour. One formatted row of it looks like this: 

```JSON
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

Check if the data loading succeeds:

```sql
-- Check the number of rows
mysql> select count() from github_events;
+----------+
| count(*) |
+----------+
|   139325 |
+----------+
1 row in set (0.25 sec)

-- View a random row
mysql> select * from github_events limit 1;
+-------------+-----------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------+---------------------+
| id          | type      | actor                                                                                                                                                                                                                       | repo                                                                                                                                                     | payload                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | public | created_at          |
+-------------+-----------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------+---------------------+
| 25061821748 | PushEvent | {"gravatar_id":"","display_login":"jfrog-pipelie-intg","url":"https://api.github.com/users/jfrog-pipelie-intg","id":98024358,"login":"jfrog-pipelie-intg","avatar_url":"https://avatars.githubusercontent.com/u/98024358?"} | {"url":"https://api.github.com/repos/jfrog-pipelie-intg/jfinte2e_1667789956723_16","id":562683829,"name":"jfrog-pipelie-intg/jfinte2e_1667789956723_16"} | {"commits":[{"sha":"334433de436baa198024ef9f55f0647721bcd750","author":{"email":"98024358+jfrog-pipelie-intg@users.noreply.github.com","name":"jfrog-pipelie-intg"},"message":"commit message 10238493157623136117","distinct":true,"url":"https://api.github.com/repos/jfrog-pipelie-intg/jfinte2e_1667789956723_16/commits/334433de436baa198024ef9f55f0647721bcd750"}],"before":"f84a26792f44d54305ddd41b7e3a79d25b1a9568","head":"334433de436baa198024ef9f55f0647721bcd750","size":1,"push_id":11572649828,"ref":"refs/heads/test-notification-sent-branch-10238493157623136113","distinct_size":1} |      1 | 2022-11-07 11:00:00 |
+-------------+-----------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------+---------------------+
1 row in set (0.23 sec)
```

View schema information via `desc`. The sub-columns will be automatically extended in the storage layer, and the data types of the sub-columns are automatically inferred.

```sql
-- No display of extended columns
mysql> desc github_events;
+------------+-------------+------+-------+---------+-------+
| Field      | Type        | Null | Key   | Default | Extra |
+------------+-------------+------+-------+---------+-------+
| id         | BIGINT      | No   | true  | NULL    |       |
| type       | VARCHAR(30) | Yes  | false | NULL    | NONE  |
| actor      | VARIANT     | Yes  | false | NULL    | NONE  |
| repo       | VARIANT     | Yes  | false | NULL    | NONE  |
| payload    | VARIANT     | Yes  | false | NULL    | NONE  |
| public     | BOOLEAN     | Yes  | false | NULL    | NONE  |
| created_at | DATETIME    | Yes  | false | NULL    | NONE  |
+------------+-------------+------+-------+---------+-------+
7 rows in set (0.01 sec)

-- Displaying extended columns of Variant columns
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

With the `desc` statement, you can specify which partition you want to check the schema of: 

```sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

### 03  Query

> Note: When filtering and aggregating sub-columns, an additional CAST operation is required to ensure data type consistency. This is because the storage types may not be fixed, and the `CAST` expression in SQL can unify the data types. For example, `SELECT * FROM tbl WHERE CAST(var['title'] AS TEXT) MATCH 'hello world'`.

**The following are simple examples of queries on Variant columns**

1. Retrieve the Top 5 repositories with the most Stars from `github_events`.

```sql
mysql> SELECT
    ->     cast(repo["name"] as text) as repo_name, count() AS stars
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

2. Count the number of events containing the keyword `doris`.

```sql
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

3. Check the ID of the issue that has the most comments and the repository it belongs to.

```sql
mysql> SELECT 
    ->   cast(repo["name"] as string) as repo_name, 
    ->   cast(payload["issue"]["number"] as int) as issue_number, 
    ->   count() AS comments, 
    ->   count(
    ->     distinct cast(actor["login"] as string)
    ->   ) AS authors 
    -> FROM  github_events 
    -> WHERE type = 'IssueCommentEvent' AND (cast(payload["action"] as string) = 'created') AND (cast(payload["issue"]["number"] as int) > 10) 
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

### 04  Notes

Based on our test results, it is safe to say that there is no efficiency disparity between Variant dynamic columns and pre-defined static columns. However, in log data processing, when users need to add fields to the table, such as container labels in Kubernetes, JSON parsing and type inference during data writing incur additional overhead.

To strike a balance between flexibility and efficiency for the Variant data type, we recommend keeping the number of columns below 1000. A small number of columns will reduce overheads caused by data parsing and type inference and thus increase data writing performance.

It is also advisable to ensure field type consistency whenever possible. This is because Doris automatically performs compatible type conversions to unify fields of different data types. If it cannot find a compatible type, it will convert the data to the JSONB type, which may result in degraded performance compared to the int or text type.

## Variant VS JSON

To see how the newly added Variant type impacts data storage and queries, we did comparison tests on pre-defined static columns, Variant columns, and JSON columns with ClickBench.

**Test environment**: 16 core, 64GB, AWS EC2 instance, 1TB ESSD

**Test result**:

### 01 Storage space

As the results show, storing data as Variant columns takes up a similar storage space to storing it as pre-defined static columns. Compared with the JSON type, the Variant type requires 65% less space. **In other words, the Variant type only takes up one-third of the storage space that JSON does. The difference will be even more notable with low-cardinality data because of columnar storage.**


![Storage space](/images/storage-space.png)

### 02 Query performance

We tested with 43[ Clickbench](https://github.com/ClickHouse/ClickBench/blob/main/selectdb/queries.sql) SQL queries. Queries on the Variant columns are about 10% slower than those on pre-defined static columns, and **8 times faster than those on** **JSON** **columns**. (For I/O reasons, most cold runs on JSONB data failed with OOM.) 


![Query Performance](/images/query-performance.png)

## Design & implementation of Variant

### 01  Data writing & type inference

In Apache Doris, this is a normal writing process: data sorting, merging, and Segment file generation in the Memtable. Variant writing works similarly. It involves type inference and data merging of the same JSON keys within the Memtable, resulting in the creation of a prefix tree. The tree keeps the type and column information of every JSON field, and merges all type information of the same column into the least common type, generates columns, encodes them into the Doris storage formats, and appends them to the segment.

Each Segment file not only contains data after type encoding and compaction, but also includes the metadata of dynamically generated columns. Such design ensures data integrity and queryability while also improving storage efficiency. **By type inference and merging in the memory, the Variant type largely reduces disk space usage compared to traditional raw text storage**. 


![Data Writing & Type inferece](/images/data-writing-and-type-inference.png)

### 02 Column change (column adding or column type changes)

During the writing process, all metadata and data of the leaf nodes in the prefix tree will be appended to the Segment file, and the metadata of the Rowsets will be merged. Here is an example of the merging process:

![Column change (column adding or column type changes)](/images/column-change.png)

In the end, the Rowset will use the `Least Common Column Schema` as the metadata after data merging. (Least common column schema is a schema with the most sub-columns and the sub-column type being the least common type.) This allows for dynamic column extension and type changes. 

Based on this mechanism, the stored schema for Variant can be considered data-driven. It offers greater flexibility compared to the Schema Change process in Doris. The diagram below illustrates the directions for type changes (type changes can only be performed in the direction indicated by the arrows, with JSONB being the common type for all types):


![Column change (column adding or column type changes)](/images/column-change2.png)

### 03 Index & query acceleration

In Variant, the leaf nodes are stored in a columnar format in the Segment file, which is exactly the same as the storage format for static pre-defined columns. Thus, queries on Variant columns can also be accelerated by dictionary encoding, vectorization, and indexes (ZoneMap, inverted index, BloomFilter, etc.). Since the same column might be of different types in different files, users need to specify a type as the hint during query execution. Here is an example query: 

```sql
 -- var['title'] is to access the 'title' sub-column of var, which is a Variant column. If there is inverted index for var, the queries will be accelerated by inverted index.
 SELECT * FROM tbl where CAST(var['titile'] as text) MATCH "hello world"
 
 -- If there is Bloom Filter for var, equivalence queries will be accelerated by Bloom Filter.
 SELECT * FROM tbl where CAST(var['id'] as bigint) = 1010101
```

Predicates will be pushed down to the storage layer (Segment), where the storage type is checked against the target type of the CAST operation. If the types match, a more efficient predicate filtering mechanism will be utilized. This approach reduces unnecessary data reading and conversion, thus improving query performance.

### 04  Storage optimization for sparse columns

Examples of sparse JSON columns: 

```sql
{"a":[1], "b":2, "c":3, "x_1" : 1，"x_2": "3"}
{"a":1, "b":2, "c":3, "x_1" : 1，"x_2": "3"}
{"a":4, "b":5, "c":6, "x_3" : 1，"x_4": "3"}
{"a":7, "b":8, "c":9, "x_5" : 1，"x_6": "3"}
...
```

The `a, b, c` columns are dense. They are included in almost every row. While the ` x_？` columns are sparse. Only a few of them are not null. If the system stores every column in a columnar way, it will suffer huge storage pressure and exploding meta. 

To solve this, Doris detects the sparsity of columns based on the percentage of null values upon data ingestion. The highly sparse columns (with a high proportion of null values) will be packed into JSONB encoding and stored in a separate column. 


![ Storage optimization for sparse columns](/images/storage-optimization-for-sparse-columns.png)

Such optimization for storing sparse columns will relieve pressure on meta and data compaction and increase flexibility. 

Queries on the sparse columns are implemented in exactly the same way as those on other columns.

## Use case

GuanceDB, an observability platform, used an Elasticsearch-based solution for storing logs and user behavior data. However, Elasticsearch has inadequate schemaless support, so it is inefficient in processing large amounts of user-defined fields. Under the Dynamic Mapping mechanism in Elasticsearch, frequent field type conflicts led to data losses and required lots of human intervention. Meanwhile, the writing process in Elasticsearch was resource-intensive and the performance in massive data aggregation was less than ideal.

For a data architectural upgrade, GuanceDB works with [VeloDB](https://www.velodb.io/) and builds an Apache Doris-based observability solution. They utilize the Variant data type to realize partition-based schema change, which is more flexible and efficient. In addition, Doris imposes no upper limit on the number of columns, meaning that it can better accommodate schema-free data. 

The Doris-based solution also delivers lower CPU usage in data writing and higher speed in complicated data aggregation (accelerated by inverted index and query optimization techniques). After the upgrade, GuanceDB **decreased their machine costs by 70% and doubled their overall query speed**, with an over 4-time performance increase in simple queries. 

## Conclusion

The Variant data type has stood the test of many users before the official release of Apache Doris 2.1.0. It is production-available now. In the future, we plan to realize more lightweight changes for Variant to facilitate data modeling. 

For more information about Variant and guides on how to build a semi-structured data analytics solution for your case, come talk to the [Apache Doris developer team](https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-2unfw3a3q-MtjGX4pAd8bCGC1UV0sKcw).