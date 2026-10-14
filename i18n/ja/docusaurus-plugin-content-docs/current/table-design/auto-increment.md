---
{
    "title": "自動採番列",
    "language": "ja",
    "description": "Doris の自動採番列（AUTO_INCREMENT）は、行ごとに一意の BIGINT 値を自動生成します。主キーの生成、辞書エンコーディング、効率的なページネーションなどでデータの取り込みを簡素化します。"
}
---

<!-- Knowledge type: Feature concept + procedure + use cases -->

Doris の自動採番列（Auto Increment Column）は、一意の数値を自動的に生成する機能です。主キーなど、各行の一意の識別子を作るためによく使用されます。新しいレコードを挿入するたびに自動採番列へ値が自動的に割り当てられるため、番号を手動で指定する手間が省けます。Doris の自動採番列を使うことで、データの一意性と一貫性を確保し、データ挿入を簡素化して人為的なミスを減らし、データ管理の効率を高められます。このため、ユーザー ID など、一意の識別子が必要な場面に適しています。

## 主な機能

### 書き込み時の動作

自動採番列を持つテーブルにデータを書き込む際、Doris は次のように処理します。

| 書き込みデータの状態 | 処理 |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 書き込みデータに自動採番列が**含まれない** | Doris が列に一意の値を自動生成して設定する |
| 書き込みデータに自動採番列が**含まれ**、その値が null | Doris が null をシステム生成の一意の値に置き換える |
| 書き込みデータに自動採番列が**含まれ**、その値が非 null | ユーザーが指定した値を変更せずに保持する |

:::caution 重要
ユーザーが指定した非 null 値によって、自動採番列の一意性が損なわれる可能性があります。
:::

### 一意性

Doris は、自動採番列に生成する値が**テーブル内で一意**であることを保証します。ただし、次の点に注意してください。

- **一意性が保証される値**：システムが生成した値に限ります。
- **ユーザーが指定した値**：自動採番列にユーザーが指定した値について、Doris は一意性を検証または強制しません。そのため、重複が生じる可能性があります。

### 値の密度

Doris が生成する自動採番値は通常**高密度**ですが、次の点に注意してください。

- **値の欠番**：性能を最適化するため、欠番が生じる場合があります。各バックエンドノード（BE）は、効率を高めるために一意の値のブロックを事前に割り当てます。ノード間でブロックが重複することはありません。
- **書き込み順と一致しない値**：後から書き込んだデータに生成される値が、先に書き込んだデータの値より大きくなるとは限りません。

:::info 注記
自動採番値から書き込みの時系列順を推測することはできません。
:::

## 自動採番列の作成

<!-- Knowledge type: Syntax + constraints -->

### 構文

自動採番列を使用するには、該当する列へ `AUTO_INCREMENT` 属性を追加して [CREATE-TABLE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE) を実行します。

- 開始値を指定しない場合、デフォルトの開始値は `1` です。
- テーブルの作成時に `AUTO_INCREMENT(start_value)` を使用すると、自動採番列の開始値を手動で指定できます。

### 制約と制限

1. 自動採番列を持てるのは、Duplicate モデルテーブルと Unique モデルテーブルのみです。
2. 一つのテーブルに設定できる自動採番列は一列までです。
3. 自動採番列の型は `BIGINT`、かつ `NOT NULL` でなければなりません。
4. 自動採番列の開始値を手動で指定する場合、値は 0 以上でなければなりません。

### テーブル作成の例

**例 1：キー列を自動採番列にした Duplicate モデルテーブル**

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
```

**例 2：キー列を自動採番列にし、開始値を 100 にした Duplicate モデルテーブル**

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

**例 3：値列を自動採番列にした Duplicate モデルテーブル**

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

**例 4：キー列を自動採番列にした Unique モデルテーブル**

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` varchar(65533) NOT NULL,
    `value` int(11) NOT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

**例 5：値列を自動採番列にした Unique モデルテーブル**

```sql
CREATE TABLE `demo`.`tbl` (
    `text` varchar(65533) NOT NULL,
    `id` BIGINT NOT NULL AUTO_INCREMENT
) ENGINE=OLAP
UNIQUE KEY(`text`)
DISTRIBUTED BY HASH(`text`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

## データの取り込み

<!-- Use cases: regular ingestion / partial column update -->

### 通常の取り込み

次のテーブルを例に説明します。

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` varchar(65533) NOT NULL,
    `value` int(11) NOT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

#### シナリオ 1：自動採番列を指定しない INSERT INTO

`insert into` 文で自動採番列 `id` を指定せずにデータを取り込むと、Doris は生成した値を `id` 列に自動的に設定します。

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

#### シナリオ 2：自動採番列を指定しない Stream Load

同様に、Stream Load でファイル `test.csv` を取り込む際に自動採番列 `id` を指定しないと、Doris は生成した値を `id` 列に自動的に設定します。

`test.csv` の内容：

```text
Tom,40
John,50
```

取り込みコマンドを実行します。

```shell
curl --location-trusted -u user:passwd \
    -H "columns:name,value" \
    -H "column_separator:," \
    -T ./test.csv \
    http://{host}:{port}/api/{db}/tbl/_stream_load
```

結果を確認します。

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

#### シナリオ 3：自動採番列に NULL 値を指定する INSERT INTO

自動採番列 `id` を指定して `insert into` を実行した場合、その列の `null` 値は生成された値に置き換えられます。

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

### 列の部分更新

自動採番列を持つ Merge-on-Write 方式の Unique テーブルで列の部分更新を行う場合、その動作は自動採番列がキー列かどうかによって異なります。

| 自動採番列の位置 | 更新時の動作 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **キー列** | ユーザーがキー列を明示的に指定する必要があり、部分更新の対象列には自動採番列を含める必要があります。取り込み時の動作は通常の列の部分更新と同じです。 |
| **非キー列** | 自動採番列を指定しない場合、その値にはテーブル内の既存行の値が設定されます。指定した場合は、`null` 値が生成値に置き換えられ、非 `null` 値は保持されます。その後、列の部分更新のセマンティクスに従ってデータが挿入されます。 |

#### 例 1：自動採番列がキー列の場合

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

#### 例 2：自動採番列が非キー列の場合

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

## 代表的なユースケース

<!-- Use cases: dictionary encoding / efficient pagination -->

### ユースケース 1：辞書エンコーディング

**適用する業務**：ビットマップを使ってコホート分析を行うユーザープロファイリングでは、各ユーザーを一意の整数の辞書値に対応付けるユーザー辞書が必要です。辞書値が高密度であるほど、ビットマップの性能が向上します。

以下では、オフラインでの UV/PV 分析を例に手順を説明します。

#### ステップ 1：ユーザー行動の明細テーブルを作成する

次のユーザー行動テーブルに明細データが格納されているとします。

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

#### ステップ 2：自動採番列を使用して辞書テーブルを作成する

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

#### ステップ 3：データを取り込んでエンコーディングの対応付けを作成する

既存データの `user_id` 値を辞書テーブルに取り込み、`user_id` と整数値の対応付けを作成します。

```sql
insert into dictionary_tbl(user_id)
select user_id from dwd_dup_tbl group by user_id;
```

また、次の方法を使うと、増分データの `user_id` 値だけを辞書テーブルに取り込めます。

```sql
insert into dictionary_tbl(user_id)
select dwd_dup_tbl.user_id from dwd_dup_tbl left join dictionary_tbl
on dwd_dup_tbl.user_id = dictionary_tbl.user_id
where dwd_dup_tbl.visit_time > '2023-12-10' and dictionary_tbl.user_id is NULL;
```

:::tip
実際の運用では、Flink Connector を使って Doris にデータを書き込むこともできます。
:::

#### ステップ 4：集計結果テーブルを作成する

`dim1`、`dim3`、`dim5` を集計対象のディメンションとします。集計結果を格納するため、次の集計テーブルを作成します。

```sql
CREATE TABLE `demo`.`dws_agg_tbl` (
    `dim1` varchar(50) NOT NULL,
    `dim3` varchar(50) NOT NULL,
    `dim5` varchar(50) NOT NULL,
    `user_id_bitmap` BITMAP BITMAP_UNION NOT NULL,
    `pv` BIGINT SUM NOT NULL
) ENGINE=OLAP
AGGREGATE KEY(`dim1`,`dim3`,`dim5`)
DISTRIBUTED BY HASH(`dim1`) BUCKETS 32
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

#### ステップ 5：データを集計してクエリを実行する

データを集計して、その結果を集計結果テーブルに格納します。

```sql
insert into dws_agg_tbl
select dwd_dup_tbl.dim1, dwd_dup_tbl.dim3, dwd_dup_tbl.dim5, BITMAP_UNION(TO_BITMAP(dictionary_tbl.aid)), COUNT(1)
from dwd_dup_tbl INNER JOIN dictionary_tbl on dwd_dup_tbl.user_id = dictionary_tbl.user_id
group by dwd_dup_tbl.dim1, dwd_dup_tbl.dim3, dwd_dup_tbl.dim5;
```

UV と PV のクエリを実行します。

```sql
select dim1, dim3, dim5, bitmap_count(user_id_bitmap) as uv, pv from dws_agg_tbl;
```

### ユースケース 2：効率的なページネーション

**背景**：ページ上にデータを表示する際は、ページネーションが必要になることがあります。従来のページネーションでは、SQL の `limit`、`offset`、`order by` を使うのが一般的です。しかし、深いページネーション（offset が非常に大きい場合）では、実際に必要な行が少数でも、すべてのデータをメモリに読み込んで全件をソートしたうえで処理を続けるため、効率が低下します。

**最適化の考え方**：自動採番列を使って各行に一意の値を与えます。クエリ時には、前ページで返された最大値 `max_value`（`unique_value` 列の値）を記録し、`where unique_value > max_value limit rows_per_page` を使用します。述語プッシュダウンによって大量のデータを早期に除外できるため、ページネーションを効率化できます。

#### 従来のページネーション（効率が低い）

次の業務テーブルでページネーションを行うとします。

```sql
CREATE TABLE `demo`.`records_tbl` (
    `user_id` int(11) NOT NULL COMMENT "",
    `name` varchar(26) NOT NULL COMMENT "",
    `address` varchar(41) NOT NULL COMMENT "",
    `city` varchar(11) NOT NULL COMMENT "",
    `nation` varchar(16) NOT NULL COMMENT "",
    `region` varchar(13) NOT NULL COMMENT "",
    `phone` varchar(16) NOT NULL COMMENT "",
    `mktsegment` varchar(11) NOT NULL COMMENT ""
) DUPLICATE KEY (`user_id`, `name`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

各ページに 100 行を表示するとします。

- 1 ページ目を取得：

    ```sql
    select * from records_tbl order by user_id, name limit 100;
    ```

- 2 ページ目を取得：

    ```sql
    select * from records_tbl order by user_id, name limit 100 offset 100;
    ```

#### 自動採番列を使ったページネーション（効率が高い）

各行に一意の識別子を付けるため、テーブルに自動採番列を追加します。

```sql
CREATE TABLE `demo`.`records_tbl2` (
    `user_id` int(11) NOT NULL COMMENT "",
    `name` varchar(26) NOT NULL COMMENT "",
    `address` varchar(41) NOT NULL COMMENT "",
    `city` varchar(11) NOT NULL COMMENT "",
    `nation` varchar(16) NOT NULL COMMENT "",
    `region` varchar(13) NOT NULL COMMENT "",
    `phone` varchar(16) NOT NULL COMMENT "",
    `mktsegment` varchar(11) NOT NULL COMMENT "",
    `unique_value` BIGINT NOT NULL AUTO_INCREMENT
) DUPLICATE KEY (`user_id`, `name`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

各ページに 100 行を表示します。

- **1 ページ目のクエリ**：

    ```sql
    select * from records_tbl2 order by unique_value limit 100;
    ```

- **2 ページ目のクエリ**：プログラムで前回のクエリから返された `unique_value` の最大値を記録し（ここでは 99 と仮定）、次のクエリを実行します。

    ```sql
    select * from records_tbl2 where unique_value > 99 order by unique_value limit 100;
    ```

- **後のページに直接移動**：後のページを直接取得する場合、前ページの `unique_value` の最大値を得るのは容易ではありません。たとえば、101 ページ目を直接取得するには、次のクエリを実行します。

    ```sql
    select user_id, name, address, city, nation, region, phone, mktsegment
    from records_tbl2, (select unique_value as max_value from records_tbl2 order by unique_value limit 1 offset 9999) as previous_data
    where records_tbl2.unique_value > previous_data.max_value
    order by unique_value limit 100;
    ```
