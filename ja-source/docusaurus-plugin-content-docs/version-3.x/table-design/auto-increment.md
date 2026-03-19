---
{
  "title": "自動インクリメント列",
  "language": "ja",
  "description": "Dorisでは、auto incrementカラムは一意の数値を自動的に生成する機能です、"
}
---
Dorisでは、自動増分カラムは一意の数値を自動的に生成する機能であり、主キーなど、各データ行に対する一意識別子の作成によく使用されます。新しいレコードが挿入されるたびに、自動増分カラムは自動的に増分値を割り当て、手動で番号を指定する必要がなくなります。Dorisの自動増分カラムを使用することで、データの一意性と整合性が保証され、データ挿入プロセスが簡素化され、人的エラーが削減され、データ管理効率が向上します。これにより、自動増分カラムは、ユーザーIDなど、一意識別子が必要なシナリオに理想的な選択肢となります。

## 機能

自動増分カラムを持つテーブルでは、Dorisは以下のようにデータ書き込みを処理します：

- **自動補完（カラムが除外された場合）**：
  書き込まれるデータに自動増分カラムが含まれていない場合、Dorisはこのカラムに一意の値を生成して補完します。

- **部分指定（カラムが含まれた場合）**：

  - **NULL値**：Dorisは書き込まれるデータ内のnull値を、システムが生成した一意の値に置き換えます。

  - **非NULL値**：ユーザー提供の値はそのまま維持されます。
  
  :::caution 注意
  ユーザー提供の非null値は、自動増分カラムの一意性を破綻させる可能性があります。
  :::
  
### 一意性

Dorisは自動増分カラムで生成する値について**テーブル全体の一意性**を保証します。ただし：

- **保証された一意性**：これはシステム生成値にのみ適用されます。
- **ユーザー提供値**：Dorisは自動増分カラム内でユーザーが指定した値の一意性を検証または強制しません。これにより重複エントリが発生する可能性があります。

### 密度

Dorisによって生成される自動増分値は一般的に**密**ですが、いくつかの考慮事項があります：

- **潜在的なギャップ**：パフォーマンス最適化によりギャップが現れる可能性があります。各バックエンドノード（BE）は効率性のために一意値のブロックを事前に割り当て、これらのブロックはノード間で重複しません。
- **非時系列値**：Dorisは後の書き込みで生成される値が以前の書き込みより大きいことを保証しません。

  :::info 注記
  自動増分値は書き込みの時系列順序を推測するために使用することはできません。
  :::
  
## 構文

自動増分カラムを使用するには、テーブル作成時（[CREATE-TABLE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)）に対応するカラムに`AUTO_INCREMENT`属性を追加する必要があります。自動増分カラムの開始値を手動で指定するには、テーブル作成時に`AUTO_INCREMENT(start_value)`文を使用することができます。指定しない場合、デフォルトの開始値は1です。

### 例

1. 自動増分カラムをキーカラムとする重複テーブルの作成。

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
