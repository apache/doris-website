---
{
  "title": "コロケーション結合",
  "description": "Colocation Joinは、一部のJoinクエリに対してローカル最適化を提供し、ノード間のデータ転送時間を削減してクエリ実行を高速化します。",
  "language": "ja"
}
---
# Colocation Join

Colocation Joinは、一部のJoinクエリに対してローカル最適化を提供し、ノード間のデータ転送時間を削減してクエリ実行を高速化します。

注意: このプロパティはCCRによって同期されません。このtableがCCRによってコピーされる場合、つまりPROPERTIESに`is_being_synced = true`が含まれている場合、このプロパティはこのtableから削除されます。

## 用語の説明

* FE: Frontend、Dorisのフロントエンドノード。メタデータ管理とリクエストアクセスを担当します。
* BE: Backend、Dorisのバックエンドノード。クエリ実行とデータストレージを担当します。
* Colocation Group (CG): CGは1つまたは複数のtableを含みます。同じグループ内のtableは同じColocation Group Schemaと同じデータ断片化分散を持ちます。
* Colocation Group Schema (CGS): CG内のtableとColocationに関連する一般的なスキーマ情報を記述するために使用されます。バケット列の型、バケット数、コピー数を含みます。

## 原理

Colocation Join機能は、同じCGSを持つtableのセットのCGを作成することです。これらのtableの対応するデータ断片が同じBEノードに配置されることを保証します。CG内のtableがバケット列でJoin操作を実行する場合、ローカルデータJoinを直接実行してノード間のデータ転送時間を削減できます。

tableのデータは最終的に、バケット列の値のHashとバケット数のモデル化に従ってバケットに配置されます。table内のバケット数が8であると仮定すると、`[0, 1, 2, 3, 4, 5, 6, 7]`の8つのバケット「Buckets」があります。このようなシーケンスを`Buckets Sequence`と呼びます。各バケットには1つまたは複数のTabletがあります。tableが単一パーティションtableの場合、バケットにはTabletが1つだけあります。複数パーティションtableの場合、複数存在します。

tableが同じデータ分散を持つために、同じCG内のtableは以下の属性が同じであることを保証する必要があります：

1. バケット列とバケット数

  バケット列、つまりtable作成文の`DISTRIBUTED BY HASH (col1, col2,...)`で指定される列です。バケット列は、tableのデータを異なるTabletにHashするためにどの列の値を使用するかを決定します。同じCG内のtableは、バケット列の型と数が同一であり、バケット数が同一であることを保証する必要があります。これにより、複数のtableのデータ断片化を1対1で制御できます。

2. コピー数

  同じCG内のすべてのtableのすべてのパーティションのコピー数は同じでなければなりません。一致しない場合、Tabletのコピーが存在し、同じBE上に他のtable断片の対応するコピーが存在しない可能性があります。

同じCG内のtableは、パーティション列の数、範囲、型の一貫性を必要としません。

バケット列とバケット数を固定した後、同じCG内のtableは同じBuckets Sequenceを持ちます。レプリカ数は各バケット内のTabletのレプリカ数と、それらがどのBEに格納されるかを決定します。Buckets Sequenceが`[0, 1, 2, 3, 4, 5, 6, 7]`で、BEノードが`[A, B, C, D]`の4つであると仮定します。可能なデータ分散は以下の通りです：

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
CGの全Tableのデータは上記のルールに従って均一に分散され、同じbarrel column値を持つデータが同じBEノード上に配置されることが保証され、ローカルデータJoinを実行できます。

## 使用方法

### Tableの作成

Table作成時に、`PROPERTIES`で`"colocate_with"="group_name"`属性を指定できます。これは、そのTableがColocation JoinTableであり、指定されたColocation Groupに属することを意味します。

例:

```
CREATE TABLE tbl (k1 int, v1 int sum)
DISTRIBUTED BY HASH(k1)
BUCKETS 8
PROPERTIES(
  "colocate_with" = "group1"
);
```
指定されたグループが存在しない場合、Dorisは現在のTableのみを含むグループを自動的に作成します。Groupが既に存在する場合、Dorisは現在のTableがColocation Group Schemaを満たしているかどうかを確認します。満たしている場合、Tableが作成されてGroupに追加されます。同時に、TableはGroup内の既存のデータ分散ルールに基づいてフラグメントとレプリカを作成します。
GroupはDBに属し、その名前はDB内で一意です。内部ストレージはGroupの完全名`dbId_groupName`ですが、ユーザーはgroupNameのみを認識します。



バージョン2.0では、DorisはDatabase間でのGroupをサポートします。Tableを作成する際は、Group名のプレフィックスとしてキーワード`__global__`を使用する必要があります。例：

```
CREATE TABLE tbl (k1 int, v1 int sum)
DISTRIBUTED BY HASH(k1)
BUCKETS 8
PROPERTIES(
     "colocate_with" = "__global__group1"
);
```
`__global__`プレフィックスが付いたGroupはもうDatabaseに属さず、その名前もグローバルに一意になります。

Global Groupを作成することで、Cross-Database Colocate Joinを実現できます。



### Tableの削除

Group内の最後のTableが完全に削除されたとき（完全な削除とは、ごみ箱から削除することを意味します）。通常、Tableが`DROP TABLE`コマンドで削除される場合、デフォルトの1日間ごみ箱に留まった後に削除され、グループは自動的に削除されます。

### Groupの表示

以下のコマンドでは、クラスター内の既存のGroup情報を表示できます。

```
SHOW PROC '/colocation_group';

+-------------+--------------+--------------+------------+----------------+----------+----------+
| GroupId     | GroupName    | TableIds     | BucketsNum | ReplicationNum | DistCols | IsStable |
+-------------+--------------+--------------+------------+----------------+----------+----------+
| 10005.10008 | 10005_group1 | 10007, 10040 | 10         | 3              | int(11)  | true     |
+-------------+--------------+--------------+------------+----------------+----------+----------+
```
* GroupId: グループのクラスター全体の一意の識別子で、前半にDB ID、後半にgroup IDが含まれます。
* GroupName: Groupのフルネーム。
* TabletIds: グループに含まれるTablesのIDのリスト。
* Buckets Num: バケットの数。
* Replication Num: コピーの数。
* DistCols: 分散列。
* IsStable: グループが安定しているかどうか（安定性の定義については、セクション`Collocation replica balancing and repair`を参照してください）。

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
* Backend Ids: データフラグメントがバケット内に配置されているBEノードIDのリスト。

> 上記のコマンドはADMIN権限が必要です。通常のユーザービューは現時点ではサポートされていません。

### Colocate Groupの変更

作成済みのTableのColocation Groupプロパティを変更できます。例：

`ALTER TABLE tbl SET ("colocate_with" = "group2");`

* Tableが以前にGroupを指定していない場合、コマンドはSchemaをチェックしてTableをGroupに追加します（Groupが存在しない場合は作成されます）。
* Tableに以前に他のGroupが指定されている場合、コマンドはまずTableを元のGroupから削除し、新しいGroupを追加します（Groupが存在しない場合は作成されます）。

以下のコマンドでTableのColocation属性を削除することもできます：

`ALTER TABLE tbl SET ("colocate_with" = "");`

### その他の関連操作

Colocation属性を持つTableにADD PARTITIONを追加し、コピー数を変更する場合、Dorisはその変更がColocation Group Schemaに違反するかどうかをチェックし、違反する場合は拒否します。

## Colocation重複バランシングと修復

ColocationTableのコピー配布はGroupで指定された配布に従う必要があるため、レプリカ修復とバランシングにおいて一般的なフラグメンテーションとは異なります。

Group自体はStable属性を持ち、Stableがtrueの場合、現在のGroup内のTableのすべてのフラグメントが変更されておらず、Colocation機能を正常に使用できることを示します。Stableがfalseの場合、Group内の一部のTableが修復または移行中であることを示します。この時、関連TableのColocation Joinは通常のJoinに退化します。

### レプリカ修復

コピーは指定されたBEノードにのみ保存できます。そのため、BEが利用できない場合（ダウンタイム、Decommissionなど）、それを置き換える新しいBEが必要です。Dorisは最初に最も負荷の低いBEを探してそれを置き換えます。置き換え後、Bucket内の古いBE上のすべてのデータフラグメントが修復されます。移行プロセス中、GroupはUnstableとマークされます。

### レプリカバランシング

Dorisは、ColocationTableのフラグメントをすべてのBEノードに均等に分散しようとします。一般的なTableのレプリカバランシングでは、粒度は単一レプリカであり、つまり各レプリカに対して個別により低い負荷のBEノードを見つければ十分です。ColocationTableの平衡はBucketレベルで行われ、Bucket内のすべてのレプリカが一緒に移行します。私たちは単純な平衡アルゴリズムを採用し、レプリカの実際のサイズに関係なく、レプリカ数のみに基づいてBuckets SequenceをすべてのBEに均等に分散します。具体的なアルゴリズムは`ColocateTableBalancer.java`のコードコメントを参照してください。

> 注意 1: 現在のColocationレプリカバランシングと修復アルゴリズムは、異種展開されたDorisクラスターでは適切に動作しない可能性があります。いわゆる異種展開とは、BEノードのディスク容量、数、ディスクタイプ（SSDとHDD）が一致しない場合です。異種展開の場合、小さなBEノードと大きなBEノードが同じ数のレプリカを保存する可能性があります。
>
> 注意 2: GroupがUnstable状態にある場合、その中のTableのJoinは通常のJoinに退化します。この時、クラスターのクエリ性能が大幅に低下する可能性があります。システムに自動的にバランスを取らせたくない場合は、FE設定項目`disable_colocate_balance`を設定して自動バランシングを禁止できます。その後、適切なタイミングで開くことができます。（詳細は`Advanced 運用`セクションを参照）

## クエリ

ColocationTableは通常のTableと同じ方法でクエリされ、ユーザーはColocation属性を認識する必要がありません。ColocationTableが属するGroupがUnstable状態にある場合、自動的に通常のJoinに退化します。

以下に例を示します：

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
表2:

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
Colocation Joinが動作する場合、Hash Join Nodeは`colocate: true`を表示します。

そうでない場合、クエリプランは以下のとおりです：

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
HASH JOIN ノードは対応する理由を表示します：`colocate: false, reason: group is not stable`。同時に、EXCHANGE ノードが生成されます。


## 高度な操作

### FE 設定項目

* disable\_colocate\_relocate

Doris の自動 Colocation レプリカ修復を無効にするかどうか。デフォルトは false、つまり無効にしない。このパラメータは Colocation Tableのレプリカ修復にのみ影響し、通常のTableには影響しません。

* disable\_colocate\_balance

Doris の自動 Colocation レプリカバランシングを無効にするかどうか。デフォルトは false、つまり無効にしない。このパラメータは Collocation Tableのレプリカバランスにのみ影響し、通常のTableには影響しません。

ユーザーは実行時にこれらの設定を行うことができます。`HELP ADMIN SHOW CONFIG;` と `HELP ADMIN SET CONFIG;` を参照してください。

* disable\_colocate\_join

Colocation Join 機能を無効にするかどうか。0.10 以前のバージョンでは、デフォルトは true、つまり無効。後のバージョンでは、デフォルトは false、つまり有効になります。

* use\_new\_tablet\_scheduler

0.10 以前のバージョンでは、新しいレプリカスケジューリングロジックは Colocation Join 機能と互換性がないため、0.10 以前のバージョンで `disable_colocate_join = false` の場合、`use_new_tablet_scheduler = false` に設定する必要があります。つまり、新しいレプリカスケジューラを無効にします。後のバージョンでは、`use_new_tablet_scheduler` は true になります。

### HTTP RESTful API

Doris は Colocation Group の表示と変更のための Colocation Join に関連するいくつかの HTTP RESTful API を提供しています。

この API は FE 側で実装され、`fe_host: fe_http_port` を使用してアクセスします。ADMIN 権限が必要です。

1. クラスタのすべての Colocation 情報を表示

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
2. グループを安定または不安定としてマークする

  * 安定としてマーク

        ```
        DELETE /api/colocate/group_stable?db_id=10005&group_id=10008
        
        Returns: 200
        ```
* Unstableとしてマークする

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
Bodyは、ネストした配列で表現されるBuckets Sequenceと、各Bucket内でフラグメントが分散されているBEのIDです。

このコマンドを使用する場合、FE設定の`disable_colocate_relocate`と`disable_colocate_balance`をtrueに設定する必要がある場合があることに注意してください。これにより、システムがColocationレプリカを自動的に修復またはバランシングすることを防ぎます。そうでない場合、変更後にシステムによって自動的にリセットされる可能性があります。
