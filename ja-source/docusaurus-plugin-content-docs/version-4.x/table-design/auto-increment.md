---
{
  "title": "自動インクリメントカラム",
  "language": "ja",
  "description": "Dorisでは、auto incrementカラムは一意の数値を自動的に生成する機能です。"
}
---
Dorisにおいて、auto incrementカラムは一意の数値を自動的に生成する機能で、各データ行に対する一意の識別子（主キーなど）を作成するのによく使用されます。新しいレコードが挿入されるたびに、auto incrementカラムは自動的にインクリメントされた値を割り当て、手動で番号を指定する必要がなくなります。DorisのAuto incrementカラムを使用することで、データの一意性と一貫性が保証され、データ挿入プロセスが簡素化され、人的エラーが減少し、データ管理効率が向上します。これにより、auto incrementカラムは、ユーザーIDなどの一意の識別子が必要なシナリオにとって理想的な選択肢となります。

## 機能

auto-incrementカラムを持つテーブルに対して、Dorisは以下のようにデータ書き込みを処理します：

- **自動入力（カラム除外）**:
  書き込まれるデータにauto-incrementカラムが含まれていない場合、Dorisはこのカラムに対して一意の値を生成し、入力します。

- **部分指定（カラム含有）**:

  - **Null値**: Dorisは書き込まれるデータ内のnull値を、システム生成された一意の値で置き換えます。

  - **非Null値**: ユーザーが提供した値はそのまま保持されます。
  
  :::caution Attention
  ユーザーが提供した非null値は、auto-incrementカラムの一意性を損なう可能性があります。
  :::
  
### 一意性

Dorisは、auto-incrementカラムで生成する値について**テーブル全体での一意性**を保証します。ただし：

- **保証された一意性**: これはシステム生成された値のみに適用されます。
- **ユーザー提供値**: Dorisは、ユーザーがauto-incrementカラムで指定した値の一意性を検証または強制しません。これにより重複エントリが発生する可能性があります。

### 密度

Dorisによって生成されるauto-increment値は一般的に**密度が高い**ですが、いくつかの考慮事項があります：

- **潜在的なギャップ**: パフォーマンス最適化により、ギャップが現れる可能性があります。各backendノード（BE）は効率性のために一意の値のブロックを事前割り当てし、これらのブロックはノード間で重複しません。
- **非時系列値**: Dorisは、後の書き込みで生成された値が以前の書き込みの値よりも大きいことを保証しません。

  :::info Note
  Auto-increment値を使用して書き込みの時系列順序を推測することはできません。
  :::
  
## 構文

auto-incrementカラムを使用するには、テーブル作成時（[CREATE-TABLE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)）に対応するカラムに`AUTO_INCREMENT`属性を追加する必要があります。auto-incrementカラムの開始値を手動で指定するには、テーブル作成時に`AUTO_INCREMENT(start_value)`文を使用することで行えます。指定されない場合、デフォルトの開始値は1です。

### 例

1. auto-incrementカラムをキーカラムとしてduplicateテーブルを作成する。

  ```sql
  CREATE TABLE `demo`.`tbl` (
          `id` BIGINT NOT NULL AUTO_INCREMENT,
          `value` BIGINT NOT NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`id`)
  DISTRIBUTED BY HASH(`id`) BUCKETS 10
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 3"
  );

2. Creating a duplicate table with an auto-increment column as the key column, and setting the starting value to 100.

  ```sql
CREATE TABLE `demo`.`tbl` (
        `id` BIGINT NOT NULL AUTO_INCREMENT(100),
        `value` BIGINT NOT NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`id`)
  DISTRIBUTED BY HASH(`id`) BUCKETS 10
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 3"
  );

  ```

3. Creating a duplicate table with an auto-increment column as one of the value columns.

  ```sql
CREATE TABLE `demo`.`tbl` (
      `uid` BIGINT NOT NULL,
      `name` BIGINT NOT NULL,
      `id` BIGINT NOT NULL AUTO_INCREMENT,
      `value` BIGINT NOT NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`uid`, `name`)
  DISTRIBUTED BY HASH(`uid`) BUCKETS 10
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 3"
  );

  ```

4. Creating a unique table with an auto-increment column as the key column.

  ```sql
CREATE TABLE `demo`.`tbl` (
        `id` BIGINT NOT NULL AUTO_INCREMENT,
        `name` varchar(65533) NOT NULL,
        `value` int(11) NOT NULL
  ) ENGINE=OLAP
  UNIQUE KEY(`id`)
  DISTRIBUTED BY HASH(`id`) BUCKETS 10
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 3",
  "enable_unique_key_merge_on_write" = "true"
  );

  ```

5. Creating a unique table with an auto-increment column as one of the value columns.

  ```sql
CREATE TABLE `demo`.`tbl` (
        `text` varchar(65533) NOT NULL,
        `id` BIGINT NOT NULL AUTO_INCREMENT,
  ) ENGINE=OLAP
  UNIQUE KEY(`text`)
  DISTRIBUTED BY HASH(`text`) BUCKETS 10
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 3",
  "enable_unique_key_merge_on_write" = "true"
  );

  ```

### Constraints and Limitations

- Auto-increment columns can only be used in Duplicate or Unique model tables.
- A table can have only one auto-increment column.
- The auto-increment column must be of type `BIGINT` and cannot be `NULL`.
- The manually specified starting value for an auto-increment column must be 0 or greater.

## Usage

### Loading

Consider the table below:

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` varchar(65533) NOT NULL,
    `value` int(11) NOT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 3",
"enable_unique_key_merge_on_write" = "true"
);

```

When using the insert into statement to write data without including the auto-increment column `id`,  Doris automatically generates and fills unique values for the column.

```sql
insert into tbl(name, value) values("Bob", 10), ("Alice", 20), ("Jack", 30);

select * from tbl order by id;
+------+-------+-------+
| id   | name  | value |
+------+-------+-------+
|    1 | Bob   |    10 |
|    2 | Alice |    20 |
|    3 | Jack  |    30 |
+------+-------+-------+

```

Similarly, when using stream load to load the file `test.csv` without specifying the auto-increment column `id`, Doris will automatically populate the `id` column with generated values.

test.csv:
```
Tom、40
John、50

```

```
curl --location-trusted -u user:passwd -H "columns:name,value" -H "column_separator:," -T ./test1.csv http://{host}:{port}/api/{db}/tbl/_stream_load

```

```sql
select * from tbl order by id;
+------+-------+-------+
| id   | name  | value |
+------+-------+-------+
|    1 | Bob   |    10 |
|    2 | Alice |    20 |
|    3 | Jack  |    30 |
|    4 | Tom   |    40 |
|    5 | John  |    50 |
+------+-------+-------+

```
When writing data using the `INSERT INTO` statement and specifying the auto-increment column `id`, any null values in the written data for that column will be replaced with generated values.

```sql
insert into tbl(id, name, value) values(null, "Doris", 60), (null, "Nereids", 70);

select * from tbl order by id;
+------+---------+-------+
| id   | name    | value |
+------+---------+-------+
|    1 | Bob     |    10 |
|    2 | Alice   |    20 |
|    3 | Jack    |    30 |
|    4 | Tom     |    40 |
|    5 | John    |    50 |
|    6 | Doris   |    60 |
|    7 | Nereids |    70 |
+------+---------+-------+

```

### Partial Update

When performing a partial update on a merge-on-write Unique table with an auto-increment column:

If the auto-increment column is a key column, users must explicitly specify it during partial updates. As a result, the target columns for partial updates must include the auto-increment column. In this case, the behavior aligns with that of standard partial updates.

```sql
CREATE TABLE `demo`.`tbl2` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` varchar(65533) NOT NULL,
  `value` int(11) NOT NULL DEFAULT "0"
  ) ENGINE=OLAP
  UNIQUE KEY(`id`)
  DISTRIBUTED BY HASH(`id`) BUCKETS 10
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 3",
  "enable_unique_key_merge_on_write" = "true"
  );


insert into tbl2(id, name, value) values(1, "Bob", 10), (2, "Alice", 20), (3, "Jack", 30);

select * from tbl2 order by id;
+------+-------+-------+
| id   | name  | value |
+------+-------+-------+
|    1 | Bob   |    10 |
|    2 | Alice |    20 |
|    3 | Jack  |    30 |
+------+-------+-------+


set enable_unique_key_partial_update=true;
set enable_insert_strict=false;
insert into tbl2(id, name) values(1, "modified"), (4, "added");

select * from tbl2 order by id;
+------+----------+-------+
| id   | name     | value |
+------+----------+-------+
|    1 | modified |    10 |
|    2 | Alice    |    20 |
|    3 | Jack     |    30 |
|    4 | added    |     0 |
+------+----------+-------+

```

When the auto-increment column is a non-key column and no value is provided, its value will be derived from existing rows in the table. If a value is specified for the auto-increment column, null values in the written data will be replaced with generated values, while non-null values will remain unchanged. These records will then be processed according to the semantics of partial updates.

```sql
CREATE TABLE `demo`.`tbl3` (
  `id` BIGINT NOT NULL,
  `name` varchar(100) NOT NULL,
  `score` BIGINT NOT NULL,
  `aid` BIGINT NOT NULL AUTO_INCREMENT
  ) ENGINE=OLAP
  UNIQUE KEY(`id`)
  DISTRIBUTED BY HASH(`id`) BUCKETS 1
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 3",
  "enable_unique_key_merge_on_write" = "true"
  );


insert into tbl3(id, name, score) values(1, "Doris", 100), (2, "Nereids", 200), (3, "Bob", 300);

select * from tbl3 order by id;
+------+---------+-------+------+
| id   | name    | score | aid  |
+------+---------+-------+------+
|    1 | Doris   |   100 |    0 |
|    2 | Nereids |   200 |    1 |
|    3 | Bob     |   300 |    2 |
+------+---------+-------+------+

set enable_unique_key_partial_update=true;
set enable_insert_strict=false;
insert into tbl3(id, score) values(1, 999), (2, 888);

select * from tbl3 order by id;
+------+---------+-------+------+
| id   | name    | score | aid  |
+------+---------+-------+------+
|    1 | Doris   |   999 |    0 |
|    2 | Nereids |   888 |    1 |
|    3 | Bob     |   300 |    2 |
+------+---------+-------+------+

insert into tbl3(id, aid) values(1, 1000), (3, 500);

select * from tbl3 order by id;
+------+---------+-------+------+
| id   | name    | score | aid  |
+------+---------+-------+------+
|    1 | Doris   |   999 | 1000 |
|    2 | Nereids |   888 |    1 |
|    3 | Bob     |   300 |  500 |
+------+---------+-------+------+

```

## Usage Scenarios

### Dictionary Encoding

Using bitmaps for audience analysis in user profiling involves creating a user dictionary, where each user is assigned a unique integer as their dictionary value. Aggregating these dictionary values can improve the performance of bitmap operations.

For example, in an offline UV (Unique Visitors) and PV (Page Views) analysis scenario, consider a detailed user behavior table:


```sql
CREATE TABLE `demo`.`dwd_dup_tbl` (
    `user_id` varchar(50) NOT NULL,
    `dim1` varchar(50) NOT NULL,
    `dim2` varchar(50) NOT NULL,
    `dim3` varchar(50) NOT NULL,
    `dim4` varchar(50) NOT NULL,
    `dim5` varchar(50) NOT NULL,
    `visit_time` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`user_id`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 32
PROPERTIES (
"replication_allocation" = "tag.location.default: 3"
);

```

Using the auto-increment column to create the following dictionary table:

```sql
CREATE TABLE `demo`.`dictionary_tbl` (
    `user_id` varchar(50) NOT NULL,
    `aid` BIGINT NOT NULL AUTO_INCREMENT
) ENGINE=OLAP
UNIQUE KEY(`user_id`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 32
PROPERTIES (
"replication_allocation" = "tag.location.default: 3",
"enable_unique_key_merge_on_write" = "true"
);

```

Write the `user_id` values from existing data into the dictionary table to map `user_id` to corresponding integer values:

```sql
insert into dictionary_tbl(user_id)
select user_id from dwd_dup_tbl group by user_id;

```

Alternatively, write only the `user_id` values from incremental data into the dictionary table.

```sql
insert into dictionary_tbl(user_id)
select dwd_dup_tbl.user_id from dwd_dup_tbl left join dictionary_tbl
on dwd_dup_tbl.user_id = dictionary_tbl.user_id where dwd_dup_tbl.visit_time > '2023-12-10' and dictionary_tbl.user_id is NULL;

```

In practical applications, Flink connectors can be used to write data into Doris.

To store aggregated results for the statistical dimensions `dim1`, `dim3`, and `dim5`, create the following table:

```sql
CREATE TABLE `demo`.`dws_agg_tbl` (
    `dim1` varchar(50) NOT NULL,
    `dim3` varchar(50) NOT NULL,
    `dim5` varchar(50) NOT NULL,
    `user_id_bitmap` BITMAP BITMAP_UNION NOT NULL,
    `pv` BIGINT SUM NOT NULL 
) ENGINE=OLAP
AGGREGATE KEY(`dim1`,`dim3`,`dim5`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 32
PROPERTIES (
"replication_allocation" = "tag.location.default: 3"
);

```

Save the aggregated data into the results table.

```sql
insert into dws_agg_tbl
select dwd_dup_tbl.dim1, dwd_dup_tbl.dim3, dwd_dup_tbl.dim5, BITMAP_UNION(TO_BITMAP(dictionary_tbl.aid)), COUNT(1)
from dwd_dup_tbl INNER JOIN dictionary_tbl on dwd_dup_tbl.user_id = dictionary_tbl.user_id;

```

Execute UV and PV queries with the following statement:

```sql
select dim1, dim3, dim5, user_id_bitmap as uv, pv from dws_agg_tbl;

```

### Efficient Pagination

Pagination is often required when displaying data on a page. Traditional pagination usually involves using `LIMIT`, `OFFSET`, and `ORDER BY` in SQL queries. For example, consider the following business table designed for display:

```sql
CREATE TABLE `demo`.`records_tbl` (
    `key` int(11) NOT NULL COMMENT "",
    `name` varchar(26) NOT NULL COMMENT "",
    `address` varchar(41) NOT NULL COMMENT "",
    `city` varchar(11) NOT NULL COMMENT "",
    `nation` varchar(16) NOT NULL COMMENT "",
    `region` varchar(13) NOT NULL COMMENT "",
    `phone` varchar(16) NOT NULL COMMENT "",
    `mktsegment` varchar(11) NOT NULL COMMENT ""
) DUPLICATE KEY (`key`, `name`)
DISTRIBUTED BY HASH(`key`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 3"
);

```

Assuming 100 records are displayed per page, the following SQL query can be used to fetch data for the first page:

```sql
select * from records_tbl order by `key`, `name` limit 100;

```

To fetch data for the second page, you can use the following query:

```sql
select * from records_tbl order by `key`, `name` limit 100 offset 100;

```

However, when performing deep pagination queries (with large offsets), this method can be inefficient, as it reads all data into memory for sorting before processing, even if only a small number of rows are needed. By using an auto-increment column, each row is assigned a unique value, enabling the use of a query like `WHERE unique_value > x LIMIT y` to filter out a large portion of the data in advance, making pagination more efficient.

To illustrate this, an auto-increment column is added to the business table, giving each row a unique identifier:

```sql
CREATE TABLE `demo`.`records_tbl2` (
    `key` int(11) NOT NULL COMMENT "",
    `name` varchar(26) NOT NULL COMMENT "",
    `address` varchar(41) NOT NULL COMMENT "",
    `city` varchar(11) NOT NULL COMMENT "",
    `nation` varchar(16) NOT NULL COMMENT "",
    `region` varchar(13) NOT NULL COMMENT "",
    `phone` varchar(16) NOT NULL COMMENT "",
    `mktsegment` varchar(11) NOT NULL COMMENT "",
    `unique_value` BIGINT NOT NULL AUTO_INCREMENT
) DUPLICATE KEY (`key`, `name`)
DISTRIBUTED BY HASH(`key`) BUCKETS 10
PROPERTIES (
    "replication_num" = "3"
);

```

For pagination with 100 records per page, the following SQL query can be used to fetch the data for the first page:

```sql
select * from records_tbl2 order by unique_value limit 100;

```

By recording the maximum value of `unique_value` from the returned results, let's assume it is 99. The following query can then be used to fetch data for the second page:

```sql
select * from records_tbl2 where unique_value > 99 order by unique_value limit 100;

```

If directly querying data from a later page and it's inconvenient to retrieve the maximum value of `unique_value` from the previous page's results (for example, when fetching data starting from the 101st page), the following query can be used:

```sql
select key, name, address, city, nation, region, phone, mktsegment
from records_tbl2, (select unique_value as max_value from records_tbl2 order by unique_value limit 1 offset 9999) as previous_data
where records_tbl2.unique_value > previous_data.max_value
order by records_tbl2.unique_value limit 100;

```
