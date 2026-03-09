---
{
  "title": "コロケーション結合",
  "language": "ja",
  "description": "Colocation Joinは、一部のJoinクエリに対してローカル最適化を提供し、ノード間のデータ転送時間を削減してクエリ実行を高速化します。"
}
---
# Colocation Join

Colocation Joinは、一部のJoinクエリに対してローカル最適化を提供し、ノード間のデータ転送時間を削減し、クエリ実行を高速化します。

注意: このプロパティはCCRによって同期されません。このテーブルがCCRによってコピーされている場合、つまりPROPERTIESに `is_being_synced = true`が含まれている場合、このプロパティはこのテーブルから削除されます。

## 用語の解釈

* FE: Frontend、Dorisのフロントエンドノードです。メタデータ管理とリクエストアクセスを担当します。
* BE: Backend、Dorisのバックエンドノードです。クエリ実行とデータ保存を担当します。
* Colocation Group (CG): CGは1つ以上のテーブルを含みます。同じグループ内のテーブルは、同じColocation Group Schemaと同じデータ断片化分散を持ちます。
* Colocation Group Schema (CGS): CG内のテーブルとColocationに関連する一般的なスキーマ情報を記述するために使用されます。bucket列タイプ、bucket数、およびコピー数を含みます。

## 原理

Colocation Join機能は、同じCGSを持つテーブルのセットのCGを作成することです。これらのテーブルの対応するデータ断片が同じBEノード上に配置されることを保証します。CG内のテーブルがbucket列でJoin操作を実行するとき、ローカルデータJoinを直接実行でき、ノード間のデータ転送時間を削減できます。

テーブルのデータは、最終的にbucket列値のHashとbucket数のモデルに従ってバレルに配置されます。テーブルのbucket数が8であると仮定すると、8つのbuckets `[0, 1, 2, 3, 4, 5, 6, 7] `Buckets'があります。このようなシーケンスを`Buckets Sequence`と呼びます。各Bucketには1つまたは複数のTabletがあります。テーブルが単一パーティションテーブルの場合、Bucket内にはTabletが1つだけあります。マルチパーティションテーブルの場合は、複数存在します。

テーブルが同じデータ分散を持つために、同じCG内のテーブルは以下の属性が同じであることを保証しなければなりません：

1. Bucket列とbucket数

  Bucket列、つまりテーブル作成文の`DISTRIBUTED BY HASH (col1, col2,...)`で指定された列です。Bucket列は、テーブルからのデータを異なるTabletにHashするために使用される列値を決定します。同じCG内のテーブルは、バレル列のタイプと数が同一であり、バレル数が同一であることを保証しなければならず、これにより複数のテーブルのデータ断片化を一対一で制御できます。

2. コピー数

  同じCG内のすべてのテーブルのすべてのパーティションのコピー数は同じでなければなりません。一致しない場合、Tabletのコピーがあっても、同じBE上に他のテーブル断片の対応するコピーが存在しない可能性があります。

同じCG内のテーブルは、パーティション列の数、範囲、およびタイプの一貫性は必要ありません。

bucket列とbucket数を固定した後、同じCG内のテーブルは同じBuckets Sequenceを持ちます。レプリカ数は、各bucket内のTabletのレプリカ数と、それらがどのBEに保存されるかを決定します。Buckets Sequenceが`[0, 1, 2, 3, 4, 5, 6, 7] `であり、BEノードが`[A, B, C, D] `4つあるとします。データ分散の可能な例は以下のようになります：

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
CG内のすべてのテーブルのデータは上記のルールに従って均等に分散され、これにより同じバレル列値を持つデータが同じBEノード上に配置され、ローカルデータJoinを実行できることが保証されます。

## 使用方法

### テーブルの作成

テーブル作成時に、`PROPERTIES`で`"colocate_with"="group_name"`属性を指定できます。これは、そのテーブルがColocation Joinテーブルであり、指定されたColocation Groupに属することを意味します。

例：

```
CREATE TABLE tbl (k1 int, v1 int sum)
DISTRIBUTED BY HASH(k1)
BUCKETS 8
PROPERTIES(
  "colocate_with" = "group1"
);
```
指定されたグループが存在しない場合、Dorisは現在のテーブルのみを含むグループを自動的に作成します。Groupが既に存在する場合、Dorisは現在のテーブルがColocation Group Schemaを満たしているかどうかを確認します。満たしている場合、テーブルは作成されてGroupに追加されます。同時に、テーブルはGroups内の既存のデータ配布ルールに基づいてフラグメントとレプリカを作成します。
GroupはデータベースAに属し、その名前はデータベース内で一意です。内部ストレージはGroupの完全名 `dbId_groupName` ですが、ユーザーはgroupNameのみを認識します。



バージョン2.0において、DorisはクロスDatabaseGroupをサポートします。テーブルを作成する際は、Group名のプレフィックスとしてキーワード `__global__` を使用する必要があります。例えば：

```
CREATE TABLE tbl (k1 int, v1 int sum)
DISTRIBUTED BY HASH(k1)
BUCKETS 8
PROPERTIES(
     "colocate_with" = "__global__group1"
);
```
`__global__` で始まるGroupは、もはやDatabaseに属さず、その名前もグローバルに一意です。

Global Groupを作成することで、Cross-Database Colocate Joinを実現できます。



### テーブルの削除

Group内の最後のテーブルが完全に削除された場合（完全に削除するとは、ごみ箱から削除することを意味します）。通常、テーブルが `DROP TABLE` コマンドで削除されると、デフォルトの1日間ごみ箱に保持された後に削除され、groupも自動的に削除されます。

### Groupの表示

以下のコマンドにより、クラスタ内の既存のGroup情報を表示できます。

```
SHOW PROC '/colocation_group';

+-------------+--------------+--------------+------------+----------------+----------+----------+
| GroupId     | GroupName    | TableIds     | BucketsNum | ReplicationNum | DistCols | IsStable |
+-------------+--------------+--------------+------------+----------------+----------+----------+
| 10005.10008 | 10005_group1 | 10007, 10040 | 10         | 3              | int(11)  | true     |
+-------------+--------------+--------------+------------+----------------+----------+----------+
```
* GroupId: グループのクラスター全体の一意識別子で、前半がDB ID、後半がgroup IDです。
* GroupName: グループのフルネームです。
* TabletIds: グループに含まれるTablesのIDのリストです。
* Buckets Num: バケット数です。
* Replication Num: レプリカ数です。
* DistCols: 分散カラムです。
* IsStable: グループが安定しているかどうかです（安定性の定義については、セクション `Collocation replica balancing and repair` を参照してください）。

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

> 上記のコマンドはADMIN権限が必要です。通常のユーザービューは現時点ではサポートされていません。

### Colocate Groupの変更

作成済みのテーブルのColocation Groupプロパティを変更することができます。例：

`ALTER TABLE tbl SET ("colocate_with" = "group2");`

* テーブルが以前にGroupを指定していない場合、コマンドはSchemaをチェックし、テーブルをGroupに追加します（Groupが存在しない場合は作成されます）。
* テーブルで以前に他のグループが指定されている場合、コマンドはまずテーブルを元のグループから削除し、新しいグループを追加します（グループが存在しない場合は作成されます）。

以下のコマンドでテーブルのColocation属性を削除することもできます：

`ALTER TABLE tbl SET ("colocate_with" = "");`

### その他の関連操作

Colocation属性を持つテーブルにADD PARTITIONが追加され、コピー数が変更される場合、Dorisはその変更がColocation Group Schemaに違反するかどうかをチェックし、違反する場合は拒否します。

## Colocation重複のバランシングと修復

Colocationテーブルのコピー分散はGroupで指定された分散に従う必要があるため、レプリカ修復とバランシングにおいて一般的なフラグメンテーションとは異なります。

Group自体にはStable属性があり、Stableがtrueの場合、現在のGroup内のテーブルのすべてのフラグメントが変更されていないことを示し、Colocation機能を正常に使用できます。Stableがfalseの場合、Group内の一部のテーブルが修復または移行中であることを示します。この時、関連テーブルのColocation Joinは通常のJoinに退化します。

### レプリカ修復

コピーは指定されたBEノードにのみ格納できます。そのため、BEが利用できない状態（ダウンタイム、Decommissionなど）になった場合、それを置き換える新しいBEが必要になります。Dorisはまず最も負荷の低いBEを探してそれを置き換えます。置き換え後、Bucket内の古いBE上のすべてのデータフラグメントが修復されます。移行プロセス中、GroupはUnstableとしてマークされます。

### レプリカバランシング

Dorisは、CollocationテーブルのフラグメントをすべてのBEノードに均等に分散しようとします。一般的なテーブルのレプリカバランシングでは、粒度は単一のレプリカであり、つまり各レプリカに対して個別により低い負荷のBEノードを見つければ十分です。Colocationテーブルの均衡はBucketレベルであり、Bucket内のすべてのレプリカが一緒に移行します。レプリカの実際のサイズに関係なく、レプリカの数のみに基づいてBuckets SequenceをすべてのBEに均等に分散する、シンプルな均等化アルゴリズムを採用しています。具体的なアルゴリズムについては、`ColocateTableBalancer.java`内のコード注釈を参照してください。

> 注意1：現在のColocationレプリカバランシングと修復アルゴリズムは、異種展開されたDorisクラスターではうまく動作しない可能性があります。いわゆる異種展開とは、BEノードのディスク容量、数、ディスクタイプ（SSDとHDD）が一致していないことです。異種展開の場合、小さなBEノードと大きなBEノードが同じ数のレプリカを格納する可能性があります。
>
> 注意2：グループがUnstable状態にある場合、その中のテーブルのJoinは通常のJoinに退化します。この時、クラスターのクエリパフォーマンスが大幅に低下する可能性があります。システムが自動的にバランスを取ることを望まない場合は、FE設定項目`disable_colocate_balance`を設定して自動バランシングを禁止できます。その後、適切な時期に有効にしてください。（詳細については`Advanced Operations`セクションを参照）

## クエリ

Colocationテーブルのクエリは通常のテーブルと同じ方法で行われ、ユーザーはColocation属性を認識する必要はありません。Colocationテーブルが配置されているGroupがUnstable状態にある場合、自動的に通常のJoinに退化します。

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

機能しない場合、クエリプランは以下の通りです：

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
HASH JOINノードは対応する理由を表示します: `colocate: false, reason: group is not stable`。同時に、EXCHANGEノードが生成されます。


## 高度な操作

### FE設定項目

* disable\_colocate\_relocate

DorisのColocationレプリカ自動修復を無効にするかどうか。デフォルトはfalse、つまり無効にしません。このパラメータはColocationテーブルのレプリカ修復にのみ影響し、通常のテーブルには影響しません。

* disable\_colocate\_balance

DorisのColocationレプリカ自動バランシングを無効にするかどうか。デフォルトはfalse、つまり無効にしません。このパラメータはCollocationテーブルのレプリカバランスにのみ影響し、通常のテーブルには影響しません。

ユーザーは実行時にこれらの設定を行うことができます。`HELP ADMIN SHOW CONFIG;`と`HELP ADMIN SET CONFIG;`を参照してください。

* disable\_colocate\_join

Colocation Join機能を無効にするかどうか。0.10以前のバージョンでは、デフォルトはtrue、つまり無効です。後のバージョンでは、デフォルトはfalse、つまり有効になります。

* use\_new\_tablet\_scheduler

0.10以前のバージョンでは、新しいレプリカスケジューリングロジックがColocation Join機能と互換性がないため、0.10以前のバージョンで`disable_colocate_join = false`の場合、`use_new_tablet_scheduler = false`に設定する必要があります。つまり、新しいレプリカスケジューラを無効にします。後のバージョンでは、`use_new_tablet_scheduler`はtrueになります。

### HTTP RESTful API

DorisはColocation Groupをビューおよび変更するためのColocation Joinに関連するいくつかのHTTP RESTful APIを提供します。

APIはFE側で実装され、`fe_host: fe_http_port`を使用してアクセスします。ADMIN権限が必要です。

1. クラスターのすべてのColocation情報をビュー

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
3. グループのデータ配布設定

  インターフェースはグループのバケットシーケンス配布を強制することができます。

    ```
    POST /api/colocate/bucketseq?db_id=10005&group_id=10008
    
    Body:
    [[10004,10002],[10003,10002],[10002,10004],[10003,10002],[10002,10004],[10003,10002],[10003,10004],[10003,10004],[10003,10004],[10002,10004]]
    
    Returns: 200
    ```
BodyはBucketsシーケンスであり、ネストされた配列と、各Bucketでフラグメントが分散されているBEのIDによって表現されます。

このコマンドを使用する場合、FE設定の`disable_colocate_relocate`と`disable_colocate_balance`をtrueに設定する必要があることに注意してください。これにより、システムがColocationレプリカを自動的に修復またはバランシングすることを防ぎます。そうしなければ、変更後にシステムによって自動的にリセットされる可能性があります。
