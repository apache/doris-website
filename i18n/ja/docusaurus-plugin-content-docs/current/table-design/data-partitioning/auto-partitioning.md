---
{
    "title": "自動パーティショニング",
    "language": "ja",
    "description": "Doris の自動パーティショニング（AUTO PARTITION）は、データ取り込み時にパーティション列の値に基づいて RANGE または LIST パーティションを自動作成します。離散的なデータや大量のパーティションについて、必要なパーティションを事前に定義できない問題を解決します。"
}
---

<!-- Knowledge type: Feature / Procedure -->
<!-- Use cases: Partitioned table design / Large-scale partition management / Data lifecycle management -->

自動パーティショニング（AUTO PARTITION）は、データ取り込み時にパーティション列の値に基づいて、Doris がパーティションを自動作成する機能です。次の問題に対応します。

- パーティション列の値が分散していて予測しにくく、テーブル作成時に必要なパーティションを正確に列挙できない。
- パーティション数が多すぎて、手動では作成できない。
- パーティション列がシステム時刻と無関係で、動的パーティショニングでは対応できない。

Doris は、次の二種類の自動パーティショニングをサポートします。

| 種類 | パーティショニング方法 | パーティション関数 | サポートされるパーティション列の型 |
| --- | --- | --- | --- |
| AUTO **RANGE** PARTITION | 範囲に基づいて自動作成 | `date_trunc` | `DATE`, `DATETIME`, `TIMESTAMP_NS` |
| AUTO **LIST** PARTITION | 列挙値に基づいて自動作成 | 関数呼び出しはサポートされない | `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `DATE`, `DATETIME`, `TIMESTAMP_NS`, `CHAR`, `VARCHAR` |

## ユースケース

時刻型のパーティション列を例に説明します。

- 動的パーティショニングでは、Doris は一定の時間間隔で新しいパーティションを自動作成し、リアルタイムデータを格納できます。リアルタイムのユーザー行動ログなどでは、通常この機能で要件を満たせます。
- 一方、非リアルタイムデータの処理など、より複雑なケースでは、パーティション列が現在のシステム時刻と無関係で、多くの離散値を含みます。この列でパーティショニングしたくても、必要なパーティションを事前に把握できない場合や、その数が多すぎる場合があります。

このような場合、動的パーティショニングでも手動パーティショニングでも要件を満たせませんが、自動パーティショニングで対応できます。

### シナリオ例：取引履歴テーブル

取引日でパーティショニングされた取引履歴テーブルがあるとします。手動でパーティショニングする場合、通常は次のような DDL を使用します。

```sql
CREATE TABLE `DAILY_TRADE_VALUE`
(
    `TRADE_DATE`              datev2 NOT NULL COMMENT 'Trade date',
    `TRADE_ID`                varchar(40) NOT NULL COMMENT 'Trade ID',
    ......
)
UNIQUE KEY(`TRADE_DATE`, `TRADE_ID`)
PARTITION BY RANGE(`TRADE_DATE`)
(
    PARTITION p_2000 VALUES [('2000-01-01'), ('2001-01-01')),
    PARTITION p_2001 VALUES [('2001-01-01'), ('2002-01-01')),
    PARTITION p_2002 VALUES [('2002-01-01'), ('2003-01-01')),
    PARTITION p_2003 VALUES [('2003-01-01'), ('2004-01-01')),
    PARTITION p_2004 VALUES [('2004-01-01'), ('2005-01-01')),
    PARTITION p_2005 VALUES [('2005-01-01'), ('2006-01-01')),
    PARTITION p_2006 VALUES [('2006-01-01'), ('2007-01-01')),
    PARTITION p_2007 VALUES [('2007-01-01'), ('2008-01-01')),
    PARTITION p_2008 VALUES [('2008-01-01'), ('2009-01-01')),
    PARTITION p_2009 VALUES [('2009-01-01'), ('2010-01-01')),
    PARTITION p_2010 VALUES [('2010-01-01'), ('2011-01-01')),
    PARTITION p_2011 VALUES [('2011-01-01'), ('2012-01-01')),
    PARTITION p_2012 VALUES [('2012-01-01'), ('2013-01-01')),
    PARTITION p_2013 VALUES [('2013-01-01'), ('2014-01-01')),
    PARTITION p_2014 VALUES [('2014-01-01'), ('2015-01-01')),
    PARTITION p_2015 VALUES [('2015-01-01'), ('2016-01-01')),
    PARTITION p_2016 VALUES [('2016-01-01'), ('2017-01-01')),
    PARTITION p_2017 VALUES [('2017-01-01'), ('2018-01-01')),
    PARTITION p_2018 VALUES [('2018-01-01'), ('2019-01-01')),
    PARTITION p_2019 VALUES [('2019-01-01'), ('2020-01-01')),
    PARTITION p_2020 VALUES [('2020-01-01'), ('2021-01-01')),
    PARTITION p_2021 VALUES [('2021-01-01'), ('2022-01-01'))
)
DISTRIBUTED BY HASH(`TRADE_DATE`) BUCKETS 10
PROPERTIES (
  "replication_num" = "1"
);
```

この方法には、次の問題があります。

1. テーブル作成時にすべてのパーティションを手動で列挙する必要がある。
2. パーティション列の値の範囲が変わると（たとえば 2022 年のデータを追加する場合）、[ALTER-TABLE-PARTITION](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PARTITION) でパーティションを変更する必要があり、手間がかかる。
3. パーティションの変更や粒度の細分化が必要になった場合、変更のコストが高い。

AUTO PARTITION を使用すると、DDL を次のように簡略化できます。

```sql
CREATE TABLE `DAILY_TRADE_VALUE`
(
    `TRADE_DATE`              datev2 NOT NULL,
    `TRADE_ID`                varchar(40) NOT NULL,
    ......
)
UNIQUE KEY(`TRADE_DATE`, `TRADE_ID`)
AUTO PARTITION BY RANGE (date_trunc(`TRADE_DATE`, 'year'))
(
)
DISTRIBUTED BY HASH(`TRADE_DATE`) BUCKETS 10
PROPERTIES (
  "replication_num" = "1"
);
```

作成直後のテーブルには、デフォルトのパーティションはありません。

```sql
show partitions from `DAILY_TRADE_VALUE`;
Empty set (0.12 sec)
```

データを挿入すると、対応するパーティションが自動作成されます。

```sql
insert into `DAILY_TRADE_VALUE` values ('2012-12-13', 1), ('2008-02-03', 2), ('2014-11-11', 3);

show partitions from `DAILY_TRADE_VALUE`;
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
| PartitionId | PartitionName   | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize | IsInMemory | ReplicaAllocation       | IsMutable |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
| 180060      | p20080101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2008-01-01]; ..types: [DATEV2]; keys: [2009-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
| 180039      | p20120101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2012-01-01]; ..types: [DATEV2]; keys: [2013-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
| 180018      | p20140101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2014-01-01]; ..types: [DATEV2]; keys: [2015-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
```

自動パーティショニングで作成されたパーティションは、手動で作成されたパーティションと機能上の違いはありません。

## 構文

`partitions_definition` 部分では、[CREATE-TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE) の次の構文を使用します。

### AUTO RANGE PARTITION

```sql
[AUTO] PARTITION BY RANGE(<partition_expr>)
<origin_partitions_definition>
```

ここで、次のように定義します。

```sql
partition_expr ::= date_trunc(<partition_column>, '<interval>')
```

:::tip
AUTO RANGE PARTITION では、`AUTO` キーワードを省略しても自動パーティショニングとして扱われます。
:::

例：

```sql
CREATE TABLE `date_table` (
    `TIME_STAMP` datev2 NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`TIME_STAMP`)
AUTO PARTITION BY RANGE (date_trunc(`TIME_STAMP`, 'month'))
(
)
DISTRIBUTED BY HASH(`TIME_STAMP`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### AUTO LIST PARTITION

```sql
AUTO PARTITION BY LIST(`partition_col1` [, `partition_col2`, ...])
<origin_partitions_definition>
```

LIST 自動パーティショニングは、通常の LIST パーティションと同じ構文 `AUTO PARTITION BY LIST(`col1`, `col2`, ...)` で複数列のパーティショニングをサポートします。パーティション列に対応するパーティションがまだ存在しない値ごとに、独立した新しいパーティションが作成されます。

例：

```sql
CREATE TABLE `str_table` (
    `str` varchar not null
) ENGINE=OLAP
DUPLICATE KEY(`str`)
AUTO PARTITION BY LIST (`str`)
()
DISTRIBUTED BY HASH(`str`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 制約の比較

| 制約 | AUTO RANGE PARTITION | AUTO LIST PARTITION |
| --- | --- | --- |
| サポートされるパーティション関数 | `date_trunc` のみ | 関数呼び出しはサポートされない |
| サポートされるパーティション列の型 | `DATE`, `DATETIME`, `TIMESTAMP_NS` | `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `DATE`, `DATETIME`, `TIMESTAMP_NS`, `CHAR`, `VARCHAR` |
| 複数列によるパーティショニング | 不可 | 可 |
| パーティション名の長さ制限 | - | 50 を超えてはならない（パーティション列の内容を連結、エスケープして生成されるため、実際に使用できる長さはさらに短い場合がある） |
| パーティション値の規則 | `date_trunc` で切り詰めた時間範囲ごとに分割 | 既存のパーティションに対応しない列挙値ごとに、独立した新しいパーティションを作成 |

## NULL 値のパーティショニング

セッション変数 `allow_partition_column_nullable` を有効にした場合、NULLABLE 列のサポートは自動パーティショニングの種類によって異なります。

| 自動パーティショニングの種類 | NULLABLE パーティション列のサポート |
| --- | --- |
| AUTO LIST PARTITION | サポートされる。NULL を書き込むと、通常どおり NULL パーティションが作成される。 |
| AUTO RANGE PARTITION | サポートされない |

### AUTO LIST PARTITION：NULLABLE 列をサポート

```sql
create table auto_null_list(
    k0 varchar null
)
auto partition by list (k0)
(
)
DISTRIBUTED BY HASH(`k0`) BUCKETS 1
properties("replication_num" = "1");

insert into auto_null_list values (null);

select * from auto_null_list;
+------+
| k0   |
+------+
| NULL |
+------+

select * from auto_null_list partition(pX);
+------+
| k0   |
+------+
| NULL |
+------+
```

### AUTO RANGE PARTITION：NULLABLE 列をサポートしない

```sql
CREATE TABLE `range_table_nullable` (
    `k1` INT,
    `k2` DATETIMEV2(3),
    `k3` DATETIMEV2(6)
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
AUTO PARTITION BY RANGE (date_trunc(`k2`, 'day'))
()
DISTRIBUTED BY HASH(`k1`) BUCKETS 16
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

ERROR 1105 (HY000): errCode = 2, detailMessage = AUTO RANGE PARTITION doesn't support NULL column
```

## ライフサイクル管理

:::info
Doris では、自動パーティショニングと動的パーティショニングを併用してライフサイクルを管理できますが、現在この組み合わせは推奨されません。
:::

AUTO RANGE PARTITION テーブルでは、`partition.retention_count` プロパティで過去のパーティションのライフサイクルを管理できます。このプロパティには正の整数 `N` を指定します。**パーティション値が大きい方から `N` 個の過去のパーティションだけを保持する**という意味で、現在および将来のパーティションはすべて保持されます。

使用上の制限：

- このプロパティを設定できるのは AUTO RANGE PARTITION テーブルのみです。それ以外では、`Only AUTO RANGE PARTITION table could set partition.retention_count` というエラーでステートメントが失敗します。
- **すでに有効な動的パーティショニングとは併用できません**（`dynamic_partition.enable = true`）。併用すると、`Can not use partition.retention_count and dynamic_partition properties at the same time` というエラーでステートメントが失敗します。動的パーティショニングによるパーティション作成と、保持数に基づくパーティションのリサイクルは、相互に排他的なスケジューリング方式です。この制限はバージョン 4.1.4 以降、コンピュートとストレージが結合したモード、分離したモードの両方に適用されます。
- バージョン 4.1.4 以降、コンピュートとストレージが分離したモードでも、`ALTER TABLE ... SET ("partition.retention_count" = "N")` を使用してこのプロパティを変更できます。4.1.4 より前は、このモードでの `ALTER` が拒否されるか、効果がありませんでした。

### 用語の定義

- **過去のパーティション**：上限が現在時刻以下のパーティション。
- **現在および将来のパーティション**：下限が現在時刻以上のパーティション。
- **パーティション値の比較**：RANGE パーティションは重複しないため、「パーティション A の値がパーティション B の値より大きい」は、「A の下限が B の上限より大きい」および「A の上限が B の上限より大きい」と同じ意味です。

### 例

```sql
create table auto_recycle(
    k0 datetime(6) not null
)
AUTO PARTITION BY RANGE (date_trunc(k0, 'day')) ()
DISTRIBUTED BY HASH(`k0`) BUCKETS 1
properties(
    "partition.retention_count" = "3"
);
```

この設定では、日付値が大きい方から 3 個の過去のパーティションだけを保持します。現在の日付を `2025-10-21` とし、`2025-10-16` から `2025-10-23` までの各日のデータを挿入したとします。リサイクルを一回実行すると、次に示すように 6 個のパーティションが残ります。

![リサイクル](/images/blogs/auto-partition-lifetime1.png)

残るパーティションの一覧：

- p20251018000000
- p20251019000000
- p20251020000000（このパーティションまで：過去のパーティションは三個だけ保持される）
- p20251021000000（このパーティション以降：現在および将来のパーティションは影響を受けない）
- p20251022000000
- p20251023000000

## 自動バケット化との併用

[自動バケット化](./data-bucketing.md#2-automatically-set-the-number-of-buckets)機能と併用できるのは、AUTO RANGE PARTITION のみです。

この組み合わせを使用する場合、Doris はデータが時系列順にテーブルへ増分ロードされ、各ロードが一つのパーティションにしか関係しないと想定します。そのため、**この組み合わせは、バッチ単位で増分ロードするテーブルにのみ推奨されます**。

:::warning 注意
ロードのパターンが上記の前提に従わない状態で自動パーティショニングと自動バケット化を併用すると、新しいパーティションのバケット数が極端に不適切になり、クエリ性能に大きく影響する可能性があります。
:::

## パーティション管理

自動パーティショニングを有効にすると、次の二つの方法でパーティションを正確に特定できます。

- `auto_partition_name` 関数：パーティション列の値をパーティション名に対応付けます。
- `partitions` テーブル関数：パーティション名からパーティションの詳細を取得します。

`DAILY_TRADE_VALUE` テーブルの例を続けます。データの挿入後、特定のレコードが属するパーティションを照会します。

```sql
select * from partitions("catalog"="internal","database"="optest","table"="DAILY_TRADE_VALUE") where PartitionName = auto_partition_name('range', 'year', '2008-02-03');
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName   | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
|      127095 | p20080101000000 |              2 | 2024-11-14 17:29:02 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2008-01-01]; ..types: [DATEV2]; keys: [2009-01-01]; ) | TRADE_DATE      |      10 |              1 | HDD           | 9999-12-31 23:59:59 |                     | \N                       | 985.000 B |          0 | tag.location.default: 1 |         1 |                  1 | \N           |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```

これにより、パーティションごとの後続操作（たとえば `insert overwrite partition`）に使用する各パーティションの ID と値を正確に特定できます。

構文の詳細：

- [auto_partition_name 関数のリファレンス](../../sql-manual/sql-functions/scalar-functions/string-functions/auto-partition-name)
- [partitions テーブル関数のリファレンス](../../sql-manual/sql-functions/table-valued-functions/partitions)

## 注意事項

| 注意事項 | 説明 |
| --- | --- |
| 複数列によるパーティショニング | AUTO LIST PARTITION は、通常の LIST パーティションと同じ構文で複数列によるパーティショニングをサポートします。 |
| 失敗したロードで作成されたパーティションは自動削除されない | データの挿入やロード中にパーティションが作成されても、ロード全体が完了せず失敗またはキャンセルされた場合、作成済みのパーティションは自動的には削除されません。 |
| 通常のパーティションと同じ使用方法 | AUTO PARTITION を使用するテーブルでは、パーティションの作成方法だけが手動から自動に変わります。テーブルとパーティションのその他の使用方法は、AUTO PARTITION を使用しないテーブルと同じです。 |
| パーティション数の上限 | テーブルあたりの最大パーティション数は `max_auto_partition_num` で制御します。設定方法は [FE の設定](../../admin-manual/config/fe-config)を参照してください。誤ってパーティションを作りすぎないよう、必要に応じて調整してください。 |
| データ送信のポーリング間隔 | AUTO PARTITION テーブルへのロード時、Coordinator がデータを送信するポーリング間隔は、通常のテーブルとは異なります。`olap_table_sink_send_interval_auto_partition_factor` で制御します。設定方法は [BE の設定](../../admin-manual/config/be-config)を参照してください。シンクノードの memtable を有効にした後（`enable_memtable_on_sink_node = true`）、この変数は効果がありません。 |
| INSERT OVERWRITE の動作 | AUTO PARTITION テーブルで [insert-overwrite](../../sql-manual/sql-statements/data-modification/DML/INSERT-OVERWRITE) を使用してデータを挿入する際の具体的な動作については、INSERT OVERWRITE のドキュメントを参照してください。 |
| メタデータの競合によってロードが失敗する場合がある | ロードによってパーティションを作成する際、テーブルでほかのメタデータ操作（Schema Change や Rebalance など）が進行していると、ロードが失敗する場合があります。 |
