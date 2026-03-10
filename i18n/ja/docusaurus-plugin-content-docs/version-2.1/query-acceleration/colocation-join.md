---
{
  "title": "コロケーション結合",
  "language": "ja",
  "description": "Colocation Joinは、一部のJoinクエリに対してローカル最適化を提供し、ノード間のデータ転送時間を削減してクエリ実行を高速化します。"
}
---
# Colocation Join

Colocation Joinは、一部のJoinクエリに対してローカル最適化を提供し、ノード間のデータ転送時間を短縮してクエリ実行を高速化します。

注意：このプロパティはCCRによって同期されません。このテーブルがCCRによってコピーされた場合、つまりPROPERTIESに`is_being_synced = true`が含まれている場合、このプロパティはこのテーブルから削除されます。

## 用語の説明

* FE: Frontend、Dorisのフロントエンドノード。メタデータ管理とリクエストアクセスを担当。
* BE: Backend、Dorisのバックエンドノード。クエリ実行とデータストレージを担当。
* Colocation Group (CG): CGは1つ以上のテーブルを含みます。同じグループ内のテーブルは、同じColocation Group Schemaと同じデータフラグメント分散を持ちます。
* Colocation Group Schema (CGS): CG内のテーブルとColocationに関連する一般的なスキーマ情報を記述するために使用されます。バケットカラムタイプ、バケット数、コピー数を含みます。

## 原理

Colocation Join機能は、同じCGSを持つテーブルのセットでCGを作成することです。これらのテーブルの対応するデータフラグメントが同じBEノードに配置されることを保証します。CG内のテーブルがバケットカラムでJoin操作を実行する際、ローカルデータJoinを直接実行してノード間のデータ転送時間を短縮できます。

テーブルのデータは、最終的にバケットカラム値のHashとバケット数をモデル化することにより、バケットに分散されます。テーブルのバケット数が8であると仮定すると、8つのバケット`[0, 1, 2, 3, 4, 5, 6, 7]`があります。このようなシーケンスを`Buckets Sequence`と呼びます。各Bucketには1つ以上のTabletがあります。テーブルが単一パーティションテーブルの場合、Bucket内にはTabletが1つだけあります。マルチパーティションテーブルの場合は、複数のTabletがあります。

テーブルが同じデータ分散を持つために、同じCG内のテーブルは以下の属性が同じであることを保証する必要があります：

1. バケットカラムとバケット数

  バケットカラムは、テーブル作成文の`DISTRIBUTED BY HASH (col1, col2,...)`で指定されるカラムです。バケットカラムは、テーブルからのデータを異なるTabletにHashするためにどのカラム値を使用するかを決定します。同じCG内のテーブルは、バケットカラムのタイプと数が同一で、バケット数も同一であることを保証する必要があります。これにより、複数テーブルのデータフラグメントを一対一で制御できます。

2. コピー数

  同じCG内のすべてのテーブルのすべてのパーティションのコピー数は同じでなければなりません。一致しない場合、Tabletのコピーが存在する一方で、同じBE上に他のテーブルフラグメントの対応するコピーが存在しない可能性があります。

同じCG内のテーブルは、パーティションカラムの数、範囲、タイプにおいて一致している必要はありません。

バケットカラムとバケット数を固定した後、同じCG内のテーブルは同じBuckets Sequenceを持ちます。レプリカ数は各バケット内のTabletのレプリカ数と、それらがどのBEに格納されるかを決定します。Buckets Sequenceが`[0, 1, 2, 3, 4, 5, 6, 7]`で、BEノードが`[A, B, C, D]`の4つであると仮定します。データ分散の可能性の一つは以下のようになります：

```
+---+ +---+ +---+ +---+ +---+ +---+ +---+ +---+
| 0 | | 1 | | 2 | | 3 | | 4 | | 5 | | 6 | | 7 |
+---+ +---+ +---+ +---+ +---+ +---+ +---+ +---+
| A | | B | | C | | D | | A | | B | | C | | D |
|   | |   | |   | |   | |   | |   | |   | |   |
| B | | C | | D | | A | | B | | C | | D | | A |
|   | |   | |   | |   | |   | |   | |   | |   |
| C | | D | | A | | B | | C | | D | | A | | B |
+---+ +---+ +---+ +---+ +---+ +---+ +---+ +---+
```
CGのすべてのテーブルのデータは上記のルールに従って均一に分散され、これにより同じbucketカラム値を持つデータが同一のBEノード上に配置され、ローカルデータJoinを実行できるようになります。

## 使用方法

### テーブルの作成

テーブル作成時に、`PROPERTIES`で`"colocate_with"="group_name"`属性を指定することができます。これは、そのテーブルがColocation Joinテーブルであり、指定されたColocation Groupに属することを意味します。

例：

```
CREATE TABLE tbl (k1 int, v1 int sum)
DISTRIBUTED BY HASH(k1)
BUCKETS 8
PROPERTIES(
  "colocate_with" = "group1"
);
```
指定されたグループが存在しない場合、Dorisは現在のテーブルのみを含むグループを自動的に作成します。Groupが既に存在する場合、DorisはColocation Group Schemaを現在のテーブルが満たすかどうかをチェックします。満たす場合、テーブルが作成されGroupに追加されます。同時に、テーブルはGroups内の既存のデータ分散ルールに基づいてフラグメントとレプリカを作成します。
GroupはデータベースにA属し、その名前はデータベース内で一意です。内部ストレージはGroupの完全名`dbId_groupName`ですが、ユーザーはgroupNameのみを認識します。



バージョン2.0では、Dorisはクロス-Database Groupをサポートします。テーブルを作成する際は、Group名のプレフィックスとして`__global__`キーワードを使用する必要があります。例：

```
CREATE TABLE tbl (k1 int, v1 int sum)
DISTRIBUTED BY HASH(k1)
BUCKETS 8
PROPERTIES(
     "colocate_with" = "__global__group1"
);
```
`__global__`で始まるGroupはDatabaseに属さなくなり、その名前もグローバルに一意になります。

Global Groupを作成することで、Cross-Database Colocate Joinを実現できます。



### テーブルの削除

Group内の最後のテーブルが完全に削除されたとき（完全削除とはゴミ箱からの削除を意味します）。通常、テーブルが`DROP TABLE`コマンドで削除された場合、デフォルトの1日間ゴミ箱に保管された後に削除され、グループは自動的に削除されます。

### Groupの表示

以下のコマンドでクラスタ内の既存のGroup情報を表示できます。

```
SHOW PROC '/colocation_group';

+-------------+--------------+--------------+------------+----------------+----------+----------+
| GroupId     | GroupName    | TableIds     | BucketsNum | ReplicationNum | DistCols | IsStable |
+-------------+--------------+--------------+------------+----------------+----------+----------+
| 10005.10008 | 10005_group1 | 10007, 10040 | 10         | 3              | int(11)  | true     |
+-------------+--------------+--------------+------------+----------------+----------+----------+
```
* GroupId: グループのクラスター全体の一意識別子で、前半にDB ID、後半にgroup IDが含まれます。
* GroupName: Groupの完全名。
* TabletIds: グループが含むTablesのIDのリスト。
* Buckets Num: バケット数。
* Replication Num: コピー数。
* DistCols: 分散カラム。
* IsStable: グループが安定しているかどうか（安定性の定義については、`Collocation replica balancing and repair`のセクションを参照）。

以下のコマンドでグループのデータ分散をさらに詳しく確認できます：

```
SHOW PROC '/colocation_group/10005.10008';

+-------------+---------------------+
| BucketIndex | BackendIds          |
+-------------+---------------------+
| 0           | 10004, 10002, 10001 |
| 1           | 10003, 10002, 10004 |
| 2           | 10002, 10004, 10001 |
| 3           | 10003, 10002, 10004 |
| 4           | 10002, 10004, 10003 |
| 5           | 10003, 10002, 10001 |
| 6           | 10003, 10004, 10001 |
| 7           | 10003, 10004, 10002 |
+-------------+---------------------+
```
* BucketIndex: バケットシーケンスへの添字。
* Backend Ids: バケット内にデータフラグメントが配置されているBEノードIDのリスト。

> 上記のコマンドはADMIN権限が必要です。通常のユーザービューは現在サポートされていません。

### Colocate Groupの変更

作成済みのテーブルのColocation Groupプロパティを変更できます。例：

`ALTER TABLE tbl SET ("colocate_with" = "group2");`

* テーブルが以前にGroupを指定していない場合、コマンドはSchemaをチェックし、テーブルをGroupに追加します（Groupが存在しない場合は作成されます）。
* テーブルに他のグループが以前に指定されている場合、コマンドは最初にテーブルを元のグループから削除し、新しいグループを追加します（グループが存在しない場合は作成されます）。

以下のコマンドでテーブルのColocation属性を削除することもできます：

`ALTER TABLE tbl SET ("colocate_with" = "");`

### その他の関連操作

Colocation属性を持つテーブルにADD PARTITIONが追加され、コピー数が変更された場合、Dorisはその変更がColocation Group Schemaに違反していないかチェックし、違反している場合は拒否します。

## Colocation Duplicate BalancingとRepair

ColocationテーブルのCopy distributionはGroupで指定された分散に従う必要があるため、レプリカ修復とバランシングにおいて一般的なフラグメンテーションとは異なります。

Group自体にはStable属性があり、Stableがtrueの場合、現在のGroup内のテーブルのすべてのフラグメントが変更されておらず、Colocation機能を正常に使用できることを示します。Stableがfalseの場合、Group内の一部のテーブルが修復または移行中であることを示します。この時、関連テーブルのColocation Joinは通常のJoinに退化します。

### Replica Repair

コピーは指定されたBEノードにのみ保存できます。そのため、BEが利用できない場合（ダウンタイム、Decommissionなど）、それを置き換える新しいBEが必要です。Dorisは最初に最も負荷の低いBEを探して置き換えます。置き換え後、Bucket内の古いBE上のすべてのデータフラグメントが修復されます。移行プロセス中、GroupはUnstableとしてマークされます。

### Replica Balancing

DorisはCollocationテーブルのフラグメントをすべてのBEノード間で均等に分散しようとします。一般的なテーブルのレプリカバランシングでは、粒度は単一レプリカです。つまり、各レプリカについて個別により低い負荷のBEノードを見つければ十分です。ColocationテーブルのバランシングはBucketレベルで行われ、Bucket内のすべてのレプリカが一緒に移行されます。私たちはシンプルなバランシングアルゴリズムを採用し、レプリカの実際のサイズに関係なく、レプリカ数のみに基づいてBuckets SequenceをすべてのBEに均等に分散します。具体的なアルゴリズムについては、`ColocateTableBalancer.java`のコードコメントを参照してください。

> 注1: 現在のColocationレプリカバランシングと修復アルゴリズムは、異機種展開されたDorisクラスターでは適切に動作しない可能性があります。いわゆる異機種展開とは、BEノードのディスク容量、数、ディスクタイプ（SSDとHDD）が一致しない展開です。異機種展開の場合、小さなBEノードと大きなBEノードが同じ数のレプリカを保存する可能性があります。
>
> 注2: グループがUnstable状態にある場合、その中のテーブルのJoinは通常のJoinに退化します。この時、クラスターのクエリパフォーマンスが大幅に低下する可能性があります。システムに自動バランシングをさせたくない場合は、FE設定項目`disable_colocate_balance`を設定して自動バランシングを禁止できます。その後、適切なタイミングで開くことができます。（詳細は`Advanced Operations`セクションを参照してください）

## Query

Colocationテーブルは通常のテーブルと同じ方法でクエリされ、ユーザーはColocation属性を認識する必要がありません。Colocationテーブルが配置されているGroupがUnstable状態にある場合、自動的に通常のJoinに退化します。

例を挙げて説明します：

Table 1:

```
CREATE TABLE `tbl1` (
    `k1` date NOT NULL COMMENT "",
    `k2` int(11) NOT NULL COMMENT "",
    `v1` int(11) SUM NOT NULL COMMENT ""
) ENGINE=OLAP
AGGREGATE KEY(`k1`, `k2`)
PARTITION BY RANGE(`k1`)
(
    PARTITION p1 VALUES LESS THAN ('2019-05-31'),
    PARTITION p2 VALUES LESS THAN ('2019-06-30')
)
DISTRIBUTED BY HASH(`k2`) BUCKETS 8
PROPERTIES (
    "colocate_with" = "group1"
);
```
表 2:

```
CREATE TABLE `tbl2` (
    `k1` datetime NOT NULL COMMENT "",
    `k2` int(11) NOT NULL COMMENT "",
    `v1` double SUM NOT NULL COMMENT ""
) ENGINE=OLAP
AGGREGATE KEY(`k1`, `k2`)
DISTRIBUTED BY HASH(`k2`) BUCKETS 8
PROPERTIES (
    "colocate_with" = "group1"
);
```
クエリプランを表示する：

```
DESC SELECT * FROM tbl1 INNER JOIN tbl2 ON (tbl1.k2 = tbl2.k2);

+----------------------------------------------------+
| Explain String                                     |
+----------------------------------------------------+
| PLAN FRAGMENT 0                                    |
|  OUTPUT EXPRS:`tbl1`.`k1` |                        |
|   PARTITION: RANDOM                                |
|                                                    |
|   RESULT SINK                                      |
|                                                    |
|   2:HASH JOIN                                      |
|   |  join op: INNER JOIN                           |
|   |  hash predicates:                              |
|   |  colocate: true                                |
|   |    `tbl1`.`k2` = `tbl2`.`k2`                   |
|   |  tuple ids: 0 1                                |
|   |                                                |
|   |----1:OlapScanNode                              |
|   |       TABLE: tbl2                              |
|   |       PREAGGREGATION: OFF. Reason: null        |
|   |       partitions=0/1                           |
|   |       rollup: null                             |
|   |       buckets=0/0                              |
|   |       cardinality=-1                           |
|   |       avgRowSize=0.0                           |
|   |       numNodes=0                               |
|   |       tuple ids: 1                             |
|   |                                                |
|   0:OlapScanNode                                   |
|      TABLE: tbl1                                   |
|      PREAGGREGATION: OFF. Reason: No AggregateInfo |
|      partitions=0/2                                |
|      rollup: null                                  |
|      buckets=0/0                                   |
|      cardinality=-1                                |
|      avgRowSize=0.0                                |
|      numNodes=0                                    |
|      tuple ids: 0                                  |
+----------------------------------------------------+
```
Colocation Joinが機能する場合、Hash Join Nodeは`colocate: true`を表示します。

そうでない場合、クエリプランは以下のようになります：

```
+----------------------------------------------------+
| Explain String                                     |
+----------------------------------------------------+
| PLAN FRAGMENT 0                                    |
|  OUTPUT EXPRS:`tbl1`.`k1` |                        |
|   PARTITION: RANDOM                                |
|                                                    |
|   RESULT SINK                                      |
|                                                    |
|   2:HASH JOIN                                      |
|   |  join op: INNER JOIN (BROADCAST)               |
|   |  hash predicates:                              |
|   |  colocate: false, reason: group is not stable  |
|   |    `tbl1`.`k2` = `tbl2`.`k2`                   |
|   |  tuple ids: 0 1                                |
|   |                                                |
|   |----3:EXCHANGE                                  |
|   |       tuple ids: 1                             |
|   |                                                |
|   0:OlapScanNode                                   |
|      TABLE: tbl1                                   |
|      PREAGGREGATION: OFF. Reason: No AggregateInfo |
|      partitions=0/2                                |
|      rollup: null                                  |
|      buckets=0/0                                   |
|      cardinality=-1                                |
|      avgRowSize=0.0                                |
|      numNodes=0                                    |
|      tuple ids: 0                                  |
|                                                    |
| PLAN FRAGMENT 1                                    |
|  OUTPUT EXPRS:                                     |
|   PARTITION: RANDOM                                |
|                                                    |
|   STREAM DATA SINK                                 |
|     EXCHANGE ID: 03                                |
|     UNPARTITIONED                                  |
|                                                    |
|   1:OlapScanNode                                   |
|      TABLE: tbl2                                   |
|      PREAGGREGATION: OFF. Reason: null             |
|      partitions=0/1                                |
|      rollup: null                                  |
|      buckets=0/0                                   |
|      cardinality=-1                                |
|      avgRowSize=0.0                                |
|      numNodes=0                                    |
|      tuple ids: 1                                  |
+----------------------------------------------------+
```
HASH JOINノードは対応する理由を表示します：`colocate: false, reason: group is not stable`。同時に、EXCHANGEノードが生成されます。


## 高度な操作

### FE設定項目

* disable\_colocate\_relocate

DorisのColocationレプリカ自動修復を無効にするかどうか。デフォルトはfalseで、無効にしません。このパラメータはColocationテーブルのレプリカ修復のみに影響し、通常のテーブルには影響しません。

* disable\_colocate\_balance

DorisのColocationレプリカ自動バランシングを無効にするかどうか。デフォルトはfalseで、無効にしません。このパラメータはCollocationテーブルのレプリカバランスのみに影響し、通常のテーブルには影響しません。

ユーザーは実行時にこれらの設定を行うことができます。`HELP ADMIN SHOW CONFIG;`と`HELP ADMIN SET CONFIG;`を参照してください。

* disable\_colocate\_join

Colocation Join機能を無効にするかどうか。0.10以前のバージョンでは、デフォルトはtrueで、無効になっています。それ以降のバージョンでは、デフォルトはfalseで、有効になります。

* use\_new\_tablet\_scheduler

0.10以前のバージョンでは、新しいレプリカスケジューリングロジックはColocation Join機能と互換性がないため、0.10以前のバージョンで`disable_colocate_join = false`の場合、`use_new_tablet_scheduler = false`に設定して新しいレプリカスケジューラを無効にする必要があります。それ以降のバージョンでは、`use_new_tablet_scheduler`はtrueになります。

### HTTP RESTful API

DorisはColocation Groupの表示と変更のためのColocation Joinに関連するHTTP RESTful APIをいくつか提供しています。

APIはFE側で実装され、`fe_host: fe_http_port`を使用してアクセスします。ADMIN権限が必要です。

1. クラスターのすべてのColocation情報を表示

    ```
    GET /api/colocate
    
    Return the internal Colocation info in JSON format:
    
    {
        "msg": "success",
      "code": 0,
      "data": {
        "infos": [
          ["10003.12002", "10003_group1", "10037, 10043", "1", "1", "int(11)", "true"]
        ],
        "unstableGroupIds": [],
        "allGroupIds": [{
          "dbId": 10003,
          "grpId": 12002
        }]
      },
      "count": 0 
    }
    ```
2. グループを安定版または不安定版としてマークする

  * 安定版としてマーク

        ```
        DELETE /api/colocate/group_stable?db_id=10005&group_id=10008
        
        Returns: 200
        ```
* 不安定としてマークする

        ```
        POST /api/colocate/group_stable?db_id=10005&group_id=10008
        
        Returns: 200
        ```
3. グループのデータ分散の設定

  インターフェースは、グループのバケットシーケンス分散を強制することができます。

    ```
    POST /api/colocate/bucketseq?db_id=10005&group_id=10008
    
    Body:
    [[10004,10002],[10003,10002],[10002,10004],[10003,10002],[10002,10004],[10003,10002],[10003,10004],[10003,10004],[10003,10004],[10002,10004]]
    
    Returns: 200
    ```
Body は Buckets Sequence であり、ネストした配列と、各 Bucket で fragment が分散されている BE の ID で表現されます。

  このコマンドを使用する際は、FE 設定の `disable_colocate_relocate` と `disable_colocate_balance` を true に設定する必要がある場合があることに注意してください。これにより、システムが Colocation replica を自動的に修復またはバランシングすることを防げます。そうしないと、変更後にシステムによって自動的にリセットされる可能性があります。
