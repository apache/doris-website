---
{
    "title": "コンピュートグループの管理：作成、権限付与、切り替え、スケーリングの操作ガイド",
    "sidebar_label": "コンピュートグループの管理",
    "language": "ja",
    "description": "ストレージとコンピュートの分離アーキテクチャにおけるコンピュートグループの管理操作を説明します。作成、権限付与、デフォルトグループの設定、切り替え、スケーリングを扱います。",
    "keywords": ["コンピュートグループ", "Compute Group", "ストレージとコンピュートの分離", "コンピュートグループの権限付与", "コンピュートグループのスケーリング", "読み書きの分離", "負荷分散"]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Cluster management / Resource isolation / Load distribution -->

ストレージとコンピュートの分離アーキテクチャでは、1 つ以上のコンピュートノード（BE）を **コンピュートグループ** にまとめることができます。このドキュメントでは、コンピュートグループの表示、追加、権限付与、デフォルトグループの設定、切り替え、スケーリングを含む一連の管理操作を説明します。

:::note Version Note
3.0.2 より前のバージョンでは、コンピュートグループを **コンピュートクラスター** と呼んでいました。
:::

## コンピュートグループのユースケース

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Multi-tenant isolation / Read-write separation / Load isolation -->

複数のコンピュートグループを使用する構成では、`USE @<compute_group_name>` ステートメントで特定のワークロードを指定したコンピュートグループに振り分け、異なる種類のワークロード間で物理的な分離を実現できます。

以下のシナリオでは、C1 と C2 という 2 つのコンピュートグループを想定します。

| シナリオ | 説明 | 操作方法 |
| :--- | :--- | :--- |
| **読み取り同士の分離** | 2 つの大規模なクエリを別々のコンピュートノードで実行し、CPU やメモリのリソース競合を回避します | クエリ 1 では `USE @c1`、クエリ 2 では `USE @c2` を使用します |
| **読み書きの分離** | データ取り込みとクエリの間のリソース競合を回避します。C1 は C2 で新たに取り込んだデータにアクセスできます | クエリでは `USE @c1`、データ取り込みでは `USE @c2` を使用します |
| **書き込み同士の分離** | 高頻度の小規模なデータ取り込みと大規模なバッチ取り込みを分けて実行し、相互の干渉を回避します | 小規模なデータ取り込みでは `USE @c1`、バッチ取り込みでは `USE @c2` を使用します |

:::caution Note

上記の分離は、CPU やメモリなどのコンピュートリソースを対象とします。[ピアキャッシュ読み取り](./file-cache/file-cache-peer-read)はデフォルトで有効です。そのため、あるコンピュートグループのクエリでローカルキャッシュミスが発生すると、別のコンピュートグループの BE の File Cache を読み取る場合があります。グループ間のキャッシュ充填を設定している場合は、そのグループに代わってオブジェクトストレージからデータを取得させることもあります。これにより、コンピュートグループ間のネットワーク、ディスク、キャッシュの分離は弱まります。厳密な分離が必要な場合は、BE でピアキャッシュ読み取りを無効にしてください。

:::

## デフォルトコンピュートグループの選択方法

<!-- Knowledge type: System behavior description -->

ユーザーが[デフォルトコンピュートグループを明示的に設定](#set-the-default-compute-group)していない場合、システムは次の条件を満たすコンピュートグループを自動的に選択します。

- コンピュートグループに稼働中のコンピュートノードが 1 つ以上あること。
- 現在のユーザーがそのコンピュートグループに対する USAGE_PRIV 権限を持っていること。

同じセッション内では、ユーザーが明示的に変更しない限り、デフォルトコンピュートグループは変わりません。セッションをまたぐと、次のいずれかの条件が発生した場合に、システムがデフォルトコンピュートグループを自動的に切り替えることがあります。

| 発生条件 | 必ず切り替わるか |
| :--- | :---: |
| ユーザーが、以前選択されたコンピュートグループの USAGE_PRIV 権限を失った場合 | はい |
| コンピュートグループが追加または削除された場合 | はい |
| 以前選択されたコンピュートグループに稼働中のコンピュートノードがなくなった場合 | 切り替わる可能性があります |

## すべてのコンピュートグループを表示する

<!-- Knowledge type: Operational steps -->

**目的**：現在のリポジトリ内のすべてのコンピュートグループを表示します。

**コマンド**：

```sql
SHOW COMPUTE GROUPS;
```

**説明**：返される結果は、ユーザーの権限レベルによって異なります。

- `ADMIN` 権限を持つユーザーは、すべてのコンピュートグループを表示できます。
- 一般ユーザーは、自分が `USAGE_PRIV` 権限を持つコンピュートグループのみを表示できます。
- どのコンピュートグループに対しても USAGE_PRIV 権限を持たないユーザーには、空の結果が返されます。

## コンピュートグループを追加する

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Cluster initialization / Adding compute resources -->

**前提条件**：`OPERATOR` 権限（ノード管理権限）が必要です。デフォルトでは、root アカウントのみがこの権限を持ちます。`GRANT` コマンドを使用して、ほかのアカウントにも付与できます。詳細は[権限管理](../sql-manual/sql-statements/account-management/GRANT-TO)を参照してください。

**目的**：BE ノードを追加し、コンピュートグループに割り当てます。

**コマンド（コンピュートグループを指定する場合）**：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```

**コマンド（デフォルトコンピュートグループを使用する場合）**：コンピュートグループを指定しないと、ノードはデフォルトで `default_compute_group` に参加します。

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```

詳細は [ADD BACKEND SQL リファレンス](../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND)を参照してください。

## コンピュートグループへのアクセス権を付与する

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Multi-user permission management -->

**前提条件**：現在のユーザーが `ADMIN` 権限を持つか、admin ロールに属している必要があります。

**目的**：指定したユーザーに、コンピュートグループに対する USAGE_PRIV 権限を付与します。

**コマンド**：

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user};
```

## コンピュートグループへのアクセス権を取り消す

<!-- Knowledge type: Operational steps -->

**前提条件**：現在のユーザーが `ADMIN` 権限を持つか、admin ロールに属している必要があります。

**目的**：指定したユーザーから、コンピュートグループに対する USAGE_PRIV 権限を取り消します。

**コマンド**：

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user};
```

## デフォルトコンピュートグループを設定する {#set-the-default-compute-group}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: User-level resource isolation -->

### 現在のユーザーに設定する

**前提条件**：現在のユーザーが、対象のコンピュートグループに対する USAGE_PRIV 権限をすでに持っている必要があります。

```sql
SET PROPERTY 'default_compute_group' = '{clusterName}';
```

### 別のユーザーに設定する

**前提条件**：現在のユーザーが Admin 権限を持っている必要があります。

```sql
SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';
```

### デフォルトコンピュートグループを確認する

現在のユーザーのデフォルトコンピュートグループを確認します。結果に含まれる `default_compute_group` の値が、デフォルトコンピュートグループです。

```sql
SHOW PROPERTY;
```

別のユーザーのデフォルトコンピュートグループを確認します（admin 権限が必要です）。

```sql
SHOW PROPERTY FOR {user};
```

### 権限について

| ユーザーロール | 操作可能な範囲 |
| :--- | :--- |
| 管理者ユーザー（例：`CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`） | 自分とほかのユーザーのデフォルトコンピュートグループを設定できます。また、自分とほかのユーザーの `PROPERTY` を表示できます |
| 一般ユーザー（例：`CREATE USER jack1 IDENTIFIED BY '123456'`） | 自分のデフォルトコンピュートグループのみを設定でき、自分の `PROPERTY` のみを表示できます。すべてのコンピュートグループの表示はできません（`GRANT ADMIN` 権限が必要です） |

:::caution Note

- 現在のユーザーにデフォルトコンピュートグループが設定されていない場合、データの読み取りまたは書き込み操作時にエラーが発生します。`USE @cluster` コマンドで現在のセッションのコンピュートグループを指定するか、`SET PROPERTY` ステートメントでデフォルトコンピュートグループを設定してください。
- 現在のユーザーにデフォルトコンピュートグループが設定されていても、そのグループが後から削除された場合は、データの読み取りまたは書き込み操作時にエラーが発生します。`USE @cluster` コマンドでコンピュートグループを再指定するか、`SET PROPERTY` でデフォルトコンピュートグループの設定を更新してください。

:::

## コンピュートグループを切り替える

<!-- Knowledge type: Operational steps -->

**目的**：ストレージとコンピュートの分離アーキテクチャで、現在のセッションに使用するデータベースとコンピュートグループを指定します。

**構文**：

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```

**説明**：データベース名またはコンピュートグループ名に予約語が含まれる場合は、該当する名前をバッククォート（`` ` ``）で囲みます。

## コンピュートグループをスケーリングする

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Elastic scaling / Capacity planning -->

次のコマンドで BE ノードを追加または削除し、コンピュートグループをスケーリングします。

- **スケールアウト**：`ALTER SYSTEM ADD BACKEND`
- **スケールイン**：`ALTER SYSTEM DECOMMISSION BACKEND`

### スケーリング後の負荷の再分散

Cloud Rebalance は、Doris のストレージとコンピュートの分離アーキテクチャにおける負荷分散の仕組みです。コンピュートグループの BE ノードを増減すると（長時間オフラインのノードはスケールインとみなされます）、システムはクラスター全体の読み取りと書き込みのトラフィック分布を自動的に再調整します。

#### バランス戦略の種類

<!-- Knowledge type: Configuration parameters -->

:::caution Version Support

`balance_type` 機能は **Doris 3.1.3** および **Doris 4.0.2** 以降でサポートされます。それ以前のバージョンでは、リバランス中にウォームアップタスクを実行するかどうかを制御するために、FE のグローバル設定 `enable_cloud_warm_up_for_rebalance` のみを使用できました。

:::

次の表では、スケールアウト時を例に 4 種類の戦略を説明します。

| 戦略の種類 | 新しいノードが利用可能になるまでの時間 | パフォーマンスへの影響 | 技術的な仕組み | 適用シナリオ |
| :--- | :---: | :---: | :--- | :--- |
| `without_warmup` | 最短 | 最大 | FE が shard のマッピングを直接更新します。初回の読み取りと書き込みではファイルキャッシュがないため、S3 からデータを取得する必要があります | 新しいノードをすばやく利用可能にする必要があり、パフォーマンスの変動を許容できる場合 |
| `async_warmup` | 短い | キャッシュミスが発生する可能性があります | ウォームアップタスクを発行し、タスクの成功またはタイムアウト後にマッピングを更新します。マッピングの切り替え時にファイルキャッシュへのデータの取り込みを試みますが、初回の読み取りの一部でキャッシュミスが発生する可能性があります | 一般的な用途で、一定のパフォーマンスへの影響を許容できる場合 |
| `sync_warmup` | 長い | キャッシュミスはほぼ発生しません | ウォームアップタスクを発行し、完了を確認してから FE がマッピングを変更するため、キャッシュの移行が完了した状態になります | スケーリング後に高いパフォーマンスが必要で、新しいノードのファイルキャッシュを事前に準備する必要がある場合 |
| `peer_read_async_warmup` | 最短 | 小さい | FE が shard のマッピングを直接変更し、ベストエフォートでウォームアップタスクを発行します。新しいノードでの初回の読み取りは、[ピアキャッシュ読み取り](./file-cache/file-cache-peer-read)を通じて元の BE のファイルキャッシュからデータを取得します。これには、BE で `enable_cache_read_from_peer` を有効（デフォルト）にしておく必要があります | 新しいノードをすばやく利用可能にし、S3 から直接読み取ることを避けたい場合で、元の BE が追加の読み取り負荷に対応できる場合 |

#### 設定

##### グローバルデフォルトのバランス戦略

FE の設定ファイル（`fe.conf`）でグローバルのデフォルト値を設定します。

```
cloud_warm_up_for_rebalance_type = "async_warmup"
```

##### コンピュートグループ単位の設定

コンピュートグループごとにバランス戦略を個別に設定できます。

```sql
ALTER COMPUTE GROUP cg1 PROPERTIES("balance_type"="async_warmup");
```

##### 設定の優先順位

1. コンピュートグループに `balance_type` が設定されていない場合、グローバルのデフォルト値 `async_warmup` が使用されます。
2. コンピュートグループに `balance_type` が設定されている場合、リバランスの実行時にはそのグループの設定が優先されます。

## コンピュートグループの名前を変更する

<!-- Knowledge type: Operational steps -->

**目的**：既存のコンピュートグループを新しい名前に変更します。

**コマンド**：

```sql
ALTER SYSTEM RENAME COMPUTE GROUP <old_name> <new_name>;
```

:::caution Note

名前の変更後、元のコンピュートグループ名（`old_name`）に紐付くユーザー権限とデフォルトコンピュートグループの設定は、新しい名前（`new_name`）に**自動では更新されません**。管理者権限を持つアカウントが、権限を手動で再付与する必要があります。この動作は MySQL の権限システムと同じです。

:::

## よくある質問

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting / Permission issues / Performance tuning -->

### グローバルのリバランス戦略を確認・変更するには？

- **確認**：
    ```sql
    ADMIN SHOW FRONTEND CONFIG LIKE "cloud_warm_up_for_rebalance_type";
    ```
- **変更**（FE の再起動なしで反映されます）：
    ```sql
    ADMIN SET FRONTEND CONFIG ("cloud_warm_up_for_rebalance_type" = "without_warmup");
    ```

### コンピュートグループのバランス戦略を確認するには？

`SHOW COMPUTE GROUPS;` を実行します。結果の `properties` 列には各コンピュートグループの属性が含まれ、`balance_type` の設定を確認できます。

### クラスターの Tablet の状態が安定しているか確認するには？

**方法 1：`SHOW BACKENDS` で確認する**

BE ノード間の Tablet 数がおおむね均等かどうかを確認します。目安となる範囲は次のとおりです。

```
(total tablets in cluster / number of BEs in Compute Group) × 0.95
~
(total tablets in cluster / number of BEs in Compute Group) × 1.05
```

ここで、0.05 は FE の設定項目 `cloud_rebalance_percent_threshold` のデフォルト値です。BE ノード間の Tablet 分布をより均等にするには、この設定値を小さくします。

**方法 2：FE のメトリクスで確認する**

FE のメトリクスにある `doris_fe_cloud_.*_balance_num` 系列を確認します。値が長時間変わらない場合、コンピュートグループはバランスの取れた状態に達しています。継続的に監視できるよう、これらのメトリクスを監視ダッシュボードに設定することを推奨します。

```bash
curl "http://feip:fe_http_port/metrics" | grep '_balance_num'
```

### データの読み書き中に「No Default Compute Group Configured」エラーが発生した場合は？

次のいずれかの方法で対処します。

1. `USE @cluster` コマンドで、現在のセッションのコンピュートグループを一時的に指定します。
2. `SET PROPERTY 'default_compute_group' = '{clusterName}'` で、デフォルトコンピュートグループを永続的に設定します。

### デフォルトコンピュートグループの削除後にエラーが発生した場合は？

コンピュートグループが削除されると、そのグループに依存するユーザーの読み書き操作でエラーが発生します。次のいずれかの方法で対処します。

1. `USE @cluster` コマンドで、現在のセッションのコンピュートグループを再指定します。
2. `SET PROPERTY` で、デフォルトコンピュートグループを別の有効なグループに更新します。
