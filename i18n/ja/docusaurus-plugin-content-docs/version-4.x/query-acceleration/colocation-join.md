---
title: コロケーション Join
language: ja
description: コロケーション Join はローカル Join によってノード間のデータ転送を減らし、バケット列での等価 Join クエリを高速化します。このドキュメントでは、その仕組みと使い方を説明します。
keywords:
    - コロケーション Join
    - Doris の Join 最適化
    - ローカル Join
    - コロケーション Group
    - バケット Join
    - データの局所性
---

<!-- Knowledge type: Feature introduction / Operation steps / Configuration parameters -->
<!-- Applicable scenario: Performance tuning of multi-table Join queries -->

コロケーション Join は、Doris が提供する Join 最適化機能です。複数のテーブルを同じルールに従って同じ BE ノードに配置することで、バケット列を使う Join をローカルで実行できます。これにより、ノード間のデータ転送を避け、クエリを高速化します。

このドキュメントでは、コロケーション Join の仕組み、実装、使い方、注意点を説明します。

## 適用条件のチェックリスト

<!-- Knowledge type: Prerequisite check -->
<!-- Applicable scenario: Determine whether a query can benefit from Colocation Join -->

コロケーション Join を使用する前に、次の点を確認してください。

-   Join に参加する二つ以上のテーブルが、同じ Colocation Group に追加されていること。
-   Join キーがバケット列（分散キー）と一致していること。
-   テーブルのレプリカ数とバケット数が同じで、データ配置が安定していること（`IsStable = true`）。
-   大きなテーブル間の Join による Shuffle が、クエリの明らかな性能上のボトルネックになっていること。

## 用語

| 用語 | 略語 | 説明 |
| --- | --- | --- |
| Colocation Group | CG | 一つ以上のテーブルを含むグループ。同じ Group 内のテーブルは、同じ Colocation Group Schema と同じデータシャード配置を共有します。 |
| Colocation Group Schema | CGS | CG 内のテーブルで共通となるコロケーション関連のスキーマ情報です。バケット列の型、バケット数、レプリカ数が含まれます。 |

## 仕組み

<!-- Knowledge type: Architecture principles -->

![Colocation Group のデータ配置](/images/next/query-acceleration/colocation-group.jpg)

コロケーション Join は、同じ CGS を共有するテーブル群を一つの CG にまとめ、対応するデータシャードを同じ BE ノードに配置します。そのため、CG 内のテーブルをバケット列で Join すると、データをローカルで直接結合でき、ノード間のデータ転送時間を減らせます。

### バケットと BucketsSequence

テーブルのデータは、バケット列の値をハッシュ化し、バケット数で割った余りに基づいてバケットに配置されます。テーブルに 8 個のバケットがある場合、バケットは `[0, 1, 2, 3, 4, 5, 6, 7]` の 8 個です。この並びを `BucketsSequence` と呼びます。各バケットには、一つ以上のデータシャード（Tablet）が含まれます。

- 単一パーティションのテーブルでは、各バケットに含まれる Tablet は一つだけです。
- 複数パーティションのテーブルでは、各バケットに複数の Tablet が含まれます。

### 同じ CG に属するテーブルの制約

同じデータ配置を共有するために、同じ CG 内のテーブルでは次の属性を一致させる必要があります。

1. **バケット列とバケット数**

    バケット列は、テーブル作成文の `DISTRIBUTED BY HASH(col1, col2, ...)` で指定する列です。バケット列の値をハッシュ化し、テーブルのデータをどの Tablet に分割するかを決めます。同じ CG 内のテーブルでは、バケット列の型と列数、およびバケット数を完全に一致させる必要があります。これにより、複数のテーブルのデータシャードを一対一に対応させて配置できます。

2. **レプリカ数**

    同じ CG 内のすべてのテーブルの全パーティションで、レプリカ数を一致させる必要があります。一致しない場合、ある Tablet のレプリカに対応する別のテーブルのシャードレプリカが、同じ BE 上に存在しない可能性があります。

:::tip 注記
同じ CG 内のテーブルで、パーティション数、パーティション範囲、パーティション列の型を一致させる必要はありません。
:::

### データ配置の例

バケット列とバケット数が決まると、同じ CG 内のテーブルは同じ BucketsSequence を共有します。レプリカ数によって、各バケット内の Tablet の複数のレプリカをどの BE に保存するかが決まります。

BucketsSequence を `[0, 1, 2, 3, 4, 5, 6, 7]`、BE ノードを `[A, B, C, D]` の 4 台とすると、データ配置の一例は次のとおりです。

```text
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

CG 内のすべてのテーブルのデータは、上記のルールに従って均等に配置されます。その結果、バケット列の値が同じデータは同じ BE ノードに配置され、ローカル Join が可能になります。

## 使い方

<!-- Knowledge type: Operation steps -->

### テーブル作成時に Colocation Group を指定する

**目的**：新しく作成するテーブルを、指定した Colocation Group に追加します。

**コマンド**：`"colocate_with" = "group_name"` を `PROPERTIES` に指定します。

**例**：

```sql
CREATE TABLE tbl (k1 int, v1 int sum)
DISTRIBUTED BY HASH(k1)
BUCKETS 8
PROPERTIES(
    "colocate_with" = "group1"
);
```

**説明**：

- 指定した Group が存在しない場合、Doris は現在のテーブルのみを含む Group を自動的に作成します。
- Group がすでに存在する場合、Doris は現在のテーブルが Colocation Group Schema を満たすか確認します。満たしていればテーブルを作成して Group に追加します。また、既存の Group のデータ配置ルールに従って、シャードとレプリカを作成します。
- Group は Database に属し、その名前は Database 内で一意です。内部では Group の完全な名前を `dbId_groupName` として保存しますが、ユーザーには `groupName` のみが表示されます。

### データベースをまたぐグローバル Group を作成する

:::tip ヒント
Doris はバージョン 2.0 から、データベースをまたぐ Group をサポートします。
:::

**目的**：データベースをまたぐ Colocate Join を実行します。

**コマンド**：テーブルを作成するとき、Group 名の先頭に `__global__` を付けます。

**例**：

```sql
CREATE TABLE tbl (k1 int, v1 int sum)
DISTRIBUTED BY HASH(k1)
BUCKETS 8
PROPERTIES(
    "colocate_with" = "__global__group1"
);
```

**説明**：`__global__` プレフィックスを持つ Group は Database に属さず、その名前は全体で一意です。グローバル Group を作成すると、データベースをまたぐ Colocate Join を実行できます。

### テーブルを削除する

Group 内の最後のテーブルが完全に削除されると、Group も自動的に削除されます。

:::info 注記
「完全に削除」とは、ごみ箱から削除されることを意味します。通常、`DROP TABLE` コマンドで削除したテーブルは、既定では一日間ごみ箱に残り、その後削除されます。
:::

### Group を表示する

**目的**：クラスター内の既存の Colocation Group と、そのデータ配置に関する情報を表示します。

**1. クラスター内のすべての Group を表示する**

```sql
SHOW PROC '/colocation_group';

+-------------+--------------+--------------+------------+----------------+----------+----------+
| GroupId     | GroupName    | TableIds     | BucketsNum | ReplicationNum | DistCols | IsStable |
+-------------+--------------+--------------+------------+----------------+----------+----------+
| 10005.10008 | 10005_group1 | 10007, 10040 | 10         | 3              | int(11)  | true     |
+-------------+--------------+--------------+------------+----------------+----------+----------+
```

各フィールドの説明：

| フィールド | 説明 |
| --- | --- |
| GroupId | クラスター全体で一意の Group 識別子。前半が db id、後半が group id です。 |
| GroupName | Group の完全な名前です。 |
| TableIds | Group に含まれるテーブル ID の一覧です。 |
| BucketsNum | バケット数です。 |
| ReplicationNum | レプリカ数です。 |
| DistCols | 分散列、すなわちバケット列の型です。 |
| IsStable | Group が安定しているかどうかを示します。安定状態の定義については、[コロケーションレプリカのバランシングと修復](#colocation-replica-balancing-and-repair)を参照してください。 |

**2. 特定の Group のデータ配置を表示する**

```sql
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

各フィールドの説明：

| フィールド | 説明 |
| --- | --- |
| BucketIndex | バケットシーケンス内のインデックスです。 |
| BackendIds | そのバケットのデータシャードが配置されている BE ノード ID の一覧です。 |

:::info 注記
上記のコマンドには ADMIN 権限が必要です。一般ユーザーは使用できません。
:::

### テーブルの Colocate Group プロパティを変更する

**目的**：既存のテーブルを Colocation Group に追加する、別の Group に移す、または Group から削除します。

**1. Group を設定または変更する**

```sql
ALTER TABLE tbl SET ("colocate_with" = "group2");
```

動作：

- テーブルがこれまでどの Group にも属していなかった場合、コマンドはスキーマを確認してテーブルを Group に追加します。Group が存在しなければ作成します。
- テーブルが別の Group に属していた場合、まず元の Group からテーブルを削除し、次に新しい Group に追加します。新しい Group が存在しなければ作成します。

**2. コロケーションプロパティを削除する**

```sql
ALTER TABLE tbl SET ("colocate_with" = "");
```

### その他の関連操作

コロケーションプロパティを持つテーブルにパーティションを追加（`ADD PARTITION`）する場合や、レプリカ数を変更する場合、Doris は変更が Colocation Group Schema に違反しないか確認します。違反する変更は拒否されます。

## コロケーションレプリカのバランシングと修復 {#colocation-replica-balancing-and-repair}

<!-- Knowledge type: Architecture principles / Operations description -->

コロケーションテーブルのレプリカ配置は Group で指定された配置に従う必要があります。そのため、レプリカの修復とバランシングは通常のシャードとは異なります。

### Group の安定状態

Group には Stable プロパティがあります。

| 状態 | 意味 | クエリへの影響 |
| --- | --- | --- |
| Stable (true) | Group 内のテーブルのシャードは、いずれも現在変更中ではありません。 | コロケーション機能が正常に動作します。 |
| Unstable (false) | Group 内のテーブルの一部のシャードを修復中、または移行中です。 | 対象テーブルのコロケーション Join は通常の Join に切り替わります。 |

### レプリカの修復

レプリカは指定された BE ノードにのみ保存できます。そのため、BE がクラッシュや Decommission などで使用できなくなった場合、代わりの BE が必要です。Doris は負荷が最も低い BE を優先します。切り替え後は、元の BE にあったバケット内のすべてのデータシャードを修復する必要があります。移行中、Group は Unstable とマークされます。

### レプリカのバランシング

Doris は、コロケーションテーブルのシャードをすべての BE ノードに均等に配置しようとします。通常のテーブルとコロケーションテーブルのバランシングには、次の違いがあります。

| 種類 | バランシングの単位 | 説明 |
| --- | --- | --- |
| 通常のテーブル | 単一のレプリカ | レプリカごとに、負荷が低い BE を探します。 |
| コロケーションテーブル | バケット | バケット内のすべてのレプリカをまとめて移行します。 |

単純なバランシングアルゴリズムを使用します。レプリカの実際のサイズは考慮せず、レプリカ数だけを使って BucketsSequence をすべての BE に均等に配置します。具体的なアルゴリズムについては、`ColocateTableBalancer.java` 内のコードコメントを参照してください。

:::caution 注記
- **注記 1**：現在のコロケーションレプリカのバランシングと修復のアルゴリズムは、構成が不均一な Doris クラスターでは十分に機能しない場合があります。構成が不均一とは、BE ノード間でディスク容量、ディスク数、またはディスクの種類（SSD と HDD）が異なることです。このような構成では、容量の小さい BE と大きい BE に同じ数のレプリカが配置される可能性があります。
- **注記 2**：Group が Unstable の場合、そのテーブルを使う Join は通常の Join に切り替わります。クラスターのクエリ性能が大きく低下する可能性があります。自動バランシングを行いたくない場合は、FE 設定 `disable_colocate_balance` で無効にし、適切なタイミングで再度有効にできます。詳しくは[高度な操作](#advanced-operations)を参照してください。
:::

## クエリ

<!-- Knowledge type: Usage description -->

コロケーションテーブルへのクエリは通常のテーブルと同じです。ユーザーがコロケーションプロパティを意識する必要はありません。コロケーションテーブルの Group が Unstable の場合、クエリは自動的に通常の Join に切り替わります。

次の例では、コロケーション Join が有効になっているか確認する方法を示します。

### サンプルテーブル

**テーブル 1**：

```sql
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

**テーブル 2**：

```sql
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

### クエリプランを表示する

```sql
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

コロケーション Join が有効な場合、Hash Join ノードに `colocate: true` が表示されます。

有効でない場合、クエリプランは次のようになります。

```sql
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

HASH JOIN ノードに `colocate: false, reason: group is not stable` という理由が表示され、EXCHANGE ノードが生成されます。

### Join の種類の比較

クエリがコロケーション Join を使用しているか判断できるように、Doris でよく使われる Join の種類を次の表で比較します。

| Join の種類 | Shuffle するデータ | 適用条件 |
| :---------------------- | :------------------ | :------------------------------------------------------------- |
| Colocate Join | なし | テーブルが同じ Colocate Group に属し、`IsStable=true` です。 |
| Bucket Shuffle Join | 一部（片側） | Join キーが左側のテーブルのバケット列と一致します。 |
| Shuffle Join | あり（両側） | 上記の条件をいずれも満たさない場合の既定の動作です。 |
| Broadcast Join | あり（小さいテーブル） | 右側のテーブルが小さい場合です。 |

## 高度な操作 {#advanced-operations}

<!-- Knowledge type: Configuration parameters / Operations -->

### FE 設定項目

| 設定項目 | 既定値 | 説明 |
| --- | --- | --- |
| `disable_colocate_relocate` | false | Doris によるコロケーションレプリカの自動修復を無効にするかどうか。既定値は false（無効にしない）です。このパラメータはコロケーションテーブルのレプリカ修復にのみ影響し、通常のテーブルには影響しません。 |
| `disable_colocate_balance` | false | Doris によるコロケーションレプリカの自動バランシングを無効にするかどうか。既定値は false（無効にしない）です。このパラメータはコロケーションテーブルのレプリカのバランシングにのみ影響し、通常のテーブルには影響しません。 |
| `disable_colocate_join` | 説明を参照 | コロケーション Join 機能を無効にするかどうか。バージョン 0.10 以前の既定値は true（無効）です。それより後のバージョンでは、既定値が false（有効）になる予定です。 |
| `use_new_tablet_scheduler` | 説明を参照 | バージョン 0.10 以前では、新しいレプリカスケジューリングの仕組みはコロケーション Join 機能と互換性がありません。そのため、バージョン 0.10 以前で `disable_colocate_join = false` にする場合は、`use_new_tablet_scheduler = false` に設定して新しいレプリカスケジューラを無効にする必要があります。それより後のバージョンでは、`use_new_tablet_scheduler` は常に true です。 |

:::tip ヒント
上記の `disable_colocate_relocate` と `disable_colocate_balance` は動的に変更できます。詳しくは `HELP SHOW CONFIG;` と `HELP SET CONFIG;` を参照してください。
:::

### HTTP RESTful API

Doris は、Colocation Group の表示と変更に使用する、コロケーション Join 関連の HTTP RESTful API を提供します。

これらの API は FE 側に実装されており、`fe_host:fe_http_port` 経由でアクセスします。ADMIN 権限が必要です。

#### 1. クラスター内のすべてのコロケーション情報を表示する

```text
GET /api/colocate

Returns the internal Colocation information in JSON format.

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

#### 2. Group を Stable または Unstable に設定する

- **Stable に設定**

    ```text
    DELETE /api/colocate/group_stable?db_id=10005&group_id=10008

    Returns: 200
    ```

- **Unstable に設定**

    ```text
    POST /api/colocate/group_stable?db_id=10005&group_id=10008

    Returns: 200
    ```

#### 3. Group のデータ配置を設定する

このエンドポイントを使用すると、Group のデータ配置を強制的に設定できます。

```text
POST /api/colocate/bucketseq?db_id=10005&group_id=10008

Body:
[[10004,10002],[10003,10002],[10002,10004],[10003,10002],[10002,10004],[10003,10002],[10003,10004],[10003,10004],[10003,10004],[10002,10004]]

Returns 200
```

Body は、BucketsSequence と各バケット内のシャードが配置される BE ID を表す入れ子の配列です。

:::caution 注記
このコマンドを使用するときは、FE 設定の `disable_colocate_relocate` と `disable_colocate_balance` を true にして、システムによるコロケーションレプリカの自動修復とバランシングを無効にする必要がある場合があります。無効にしないと、変更がシステムによって自動的に元に戻される可能性があります。
:::

## FAQ

<!-- Knowledge type: Troubleshooting -->

### クエリプランに `colocate: false, reason: group is not stable` が表示される

Group が現在 Unstable であることを示します。レプリカの修復やバランシングが進行中の可能性があります。この場合、Join は通常の Join に切り替わります。Group が Stable に戻ると、コロケーション Join を再び使用できます。`IsStable` フィールドの状態は `SHOW PROC '/colocation_group';` で確認できます。

### Colocation Group が現在利用可能か確認する方法

`SHOW PROC "/colocation_group";` を実行し、`IsStable` フィールドを確認します。`true` なら利用可能で、Join は Colocate プランを使用できます。`false` なら、Doris がデータをバランシングしている間、一時的に利用できません。

### `IsStable=false` はどのくらい続くか

データ移行の規模とクラスターの負荷によって異なります。Doris による Tablet のバランシングが完了すると、自動的に Stable に戻ります。`false` の状態が長く続く場合は、以下の項目を参考に調査してください。

### テーブル作成時に指定した Group に参加できないエラーが発生する

次の条件をすべて満たしているか確認してください。

- バケット列の型と列数が、Group 内の既存のテーブルと完全に一致すること。
- バケット数が同じであること。
- すべてのパーティションのレプリカ数が同じであること。

いずれかが一致しない場合、テーブルは Group に参加できません。

### Group が Unstable のまま長時間続く

考えられる原因は次のとおりです。

- クラスター内の BE がクラッシュしたか Decommission され、レプリカの修復がまだ進行中である。
- クラスターの構成が不均一で、バランシングが収束しにくい。
- 自動バランシングが無効になっておらず、データ移行が繰り返し発生している。

`disable_colocate_balance = true` に設定して自動バランシングを一時的に無効にし、クラスターが安定した後で再度有効にできます。

### 異なるデータベースの二つのテーブルでコロケーション Join を実行できるか

はい。バージョン 2.0 以降では、`__global__` プレフィックス付きのグローバル Group 名を使用してテーブルを作成できます。
