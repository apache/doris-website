---
{
  "title": "コンピュートグループの管理",
  "language": "ja",
  "description": "コンピュート・ストレージ分離アーキテクチャでは、1つまたは複数のコンピュートノード（BE）をCompute Groupにグループ化できます。"
}
---
コンピュート・ストレージ分離アーキテクチャでは、1つまたは複数のコンピュートノード（BE）をCompute Groupにグループ化できます。このドキュメントでは、以下のような操作を含むcompute groupの使用方法について説明します：

- 全compute groupの表示
- compute groupアクセスの許可
- ユーザーレベルでのcompute groupのバインド（`default_compute_group`）によるユーザーレベルの分離

*注意*
バージョン3.0.2以前では、これはCompute Clusterと呼ばれていました。

## Compute Group使用シナリオ

マルチcompute groupアーキテクチャでは、1つまたは複数のステートレスBEノードをcompute clusterにグループ化できます。compute cluster指定文（use @<compute_group_name>）を使用することで、特定のワークロードを特定のcompute clusterに割り当て、複数のインポートおよびクエリワークロードの物理的な分離を実現できます。

C1とC2の2つのcompute clusterがあると仮定します。

- **読み取り-読み取り分離**：2つの大きなクエリを開始する前に、それぞれ`use @c1`と`use @c2`を使用して、クエリが異なるコンピュートノードで実行されることを保証します。これにより、同じデータセットにアクセスする際のリソース競合（CPU、メモリなど）を防止できます。

- **読み取り-書き込み分離**：Dorisデータインポートは大量のリソースを消費し、特に大量データと高頻度インポートのシナリオでは顕著です。クエリとインポート間のリソース競合を回避するため、`use @c1`と`use @c2`を使用して、クエリをC1で実行し、インポートをC2で実行するよう指定できます。さらに、C1 compute clusterはC2 compute clusterの新しくインポートされたデータにアクセスできます。

- **書き込み-書き込み分離**：読み取り-書き込み分離と同様に、インポート同士も分離できます。例えば、システムに高頻度小規模インポートと大規模バッチインポートの両方がある場合、バッチインポートは通常時間がかかり再試行コストが高い一方、高頻度小規模インポートは迅速で再試行コストが低くなります。小規模インポートがバッチインポートに干渉することを防ぐため、`use @c1`と`use @c2`を使用して、小規模インポートをC1で実行し、バッチインポートをC2で実行するよう指定できます。

## デフォルトCompute Group選択メカニズム

ユーザーが明示的に[デフォルトcompute groupを設定](#setting-default-compute-group)していない場合、システムは自動的に、ユーザーが使用権限を持つActive BEを含むcompute groupを選択します。特定のセッションでデフォルトcompute groupが決定されると、ユーザーが明示的にデフォルト設定を変更しない限り、そのセッション中は変更されません。

異なるセッションで以下の状況が発生した場合、システムはユーザーのデフォルトcompute groupを自動的に変更する場合があります：

- ユーザーが前回のセッションで選択されたデフォルトcompute groupの使用権限を失った
- compute groupが追加または削除された
- 以前に選択されたデフォルトcompute groupにAlive BEがなくなった

状況1と2は確実に自動選択されるデフォルトcompute groupの変更につながり、状況3は変更につながる可能性があります。

## 全Compute Groupの表示

`SHOW COMPUTE GROUPS`コマンドを使用して、現在のリポジトリの全compute groupを表示します。返される結果は、ユーザーの権限レベルに基づいて異なる内容が表示されます：

- `ADMIN`権限を持つユーザーは全compute groupを表示できます
- 一般ユーザーは使用権限（USAGE_PRIV）を持つcompute groupのみ表示できます
- ユーザーがいずれのcompute groupに対しても使用権限を持たない場合、空の結果が返されます

```sql
SHOW COMPUTE GROUPS;
```
## Compute Group の追加

compute group を管理するには `OPERATOR` 権限が必要です。この権限はノード管理の許可を制御します。詳細については、[Privilege Management](../sql-manual/sql-statements/account-management/GRANT-TO) を参照してください。デフォルトでは、root アカウントのみが `OPERATOR` 権限を持ちますが、`GRANT` コマンドを使用して他のアカウントに付与することができます。
BE を追加して compute group に割り当てるには、[Add BE](../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) コマンドを使用します。例：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```
上記のsqlは`host:9050`をcompute group `new_group`に追加します。PROPERTIES文を省略した場合、BEはcompute group `default_compute_group`に追加されます。例えば：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```
## Compute Groupアクセスの付与
前提条件: 現在の操作ユーザーが'ADMIN'権限を持っている、または現在のユーザーがadminロールに属している。

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user}
```
## Compute Group アクセスの取り消し
前提条件: 現在の操作ユーザーが'ADMIN'権限を持つか、現在のユーザーがadminロールに属している。

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user}
```
## デフォルトCompute Groupの設定

現在のユーザーのデフォルトcompute groupを設定するには（この操作には、現在のユーザーがすでにそのコンピューティンググループを使用する権限を持っている必要があります）：

```sql
SET PROPERTY 'default_compute_group' = '{clusterName}';
```
他のユーザーのデフォルトcompute groupを設定するには（この操作にはAdmin権限が必要です）：

```sql
SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';
```
現在のユーザーのデフォルトcompute groupを表示するには、返された結果の`default_compute_group`の値がデフォルトcompute groupです：

```sql
SHOW PROPERTY;
```
他のユーザーのデフォルトcompute groupを表示するには、この操作では現在のユーザーが管理者権限を持っている必要があり、返される結果の`default_compute_group`の値がデフォルトcompute groupです：

```sql
SHOW PROPERTY FOR {user};
```
現在のリポジトリで利用可能なすべてのcompute groupを表示するには：

```sql
SHOW COMPUTE GROUPS;
```
:::info 注意

- 現在のユーザーがAdmin役割を持つ場合、例：`CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`の場合：
  - 自分自身と他のユーザーのデフォルトcompute groupを設定できます；
  - 自分自身と他のユーザーの`PROPERTY`を表示できます。
- 現在のユーザーがAdmin役割を持たない場合、例：`CREATE USER jack1 IDENTIFIED BY '123456'`の場合：
  - 自分自身のデフォルトcompute groupを設定できます；
  - 自分自身の`PROPERTY`を表示できます；
  - すべてのcompute groupを表示することはできません。この操作には`GRANT ADMIN`権限が必要です。
- 現在のユーザーがデフォルトcompute groupを設定していない場合、既存のシステムはデータ読み取り/書き込み操作を実行する際にエラーをトリガーします。この問題を解決するために、ユーザーは`use @cluster`コマンドを実行して現在のコンテキストで使用するcompute groupを指定するか、`SET PROPERTY`文を使用してデフォルトcompute groupを設定できます。
- 現在のユーザーがデフォルトcompute groupを設定したが、そのclusterがその後削除された場合、データ読み取り/書き込み操作中にもエラーがトリガーされます。ユーザーは`use @cluster`コマンドを実行して現在のコンテキストで使用するcompute groupを再指定するか、`SET PROPERTY`文を使用してデフォルトcluster設定を更新できます。

:::


## Compute Groupの切り替え

ユーザーは、compute-storage分離アーキテクチャで使用するデータベースとcompute groupを指定できます。

**構文**

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```
データベースまたはcompute groupの名前に予約キーワードが含まれている場合、対応する名前はバッククォート ```で囲む必要があります。

## Compute Groupのスケーリング

`ALTER SYSTEM ADD BACKEND`および`ALTER SYSTEM DECOMMISION BACKEND`を使用してBEを追加または削除することで、compute groupをスケールできます。

### スケーリング後の負荷再分散

Cloud rebalanceは、Dorisのcompute-storage分離アーキテクチャにおける負荷分散操作です。異なるCompute Groupのbackendノードのスケーリング（追加または削除）後、compute group全体で読み書きトラフィックを再分散するために使用されます。長時間オフラインになっているノードは削除されたものとみなされます。

#### バランス戦略タイプ

:::caution

`balance_type`機能はDoris 3.1.3およびDoris 4.0.2以降でサポートされています。
これらのバージョン以前では、rebalance中にwarm upタスクを実行するかどうかを制御するためのFEグローバル設定`enable_cloud_warm_up_for_rebalance`のみが利用可能でした。

:::

以下の表は、Compute Groupにノードを追加する例を使用して、3つの戦略タイプを説明しています：

| Type | サービス開始時間 | パフォーマンス変動 | 技術的原理 | 使用例 |
| :--- | :---: | :---: | :-- | :-- |
| `without_warmup` | 最速 | 最大変動 | FEが直接shardマッピングを変更；初回読み書きではファイルキャッシュがなくS3から取得する必要がある | パフォーマンスジッターに対する感度が低く、迅速なノード配置が必要なシナリオ |
| `async_warmup` | より高速 | キャッシュミスの可能性 | warm upタスクを発行し、成功またはタイムアウト後にマッピングを変更；マッピング切り替え中に新しいBEにファイルキャッシュをプルしようとするが、一部シナリオでは初回読み取り時にミスが発生する可能性 | 許容可能なパフォーマンスの一般的なシナリオ |
| `sync_warmup` | より低速 | キャッシュミス最小 | warm upタスクを発行し、FEはタスク完了後のみマッピングを変更し、キャッシュ移行を保証 | スケーリング後に極めて高いパフォーマンス要件があり、新しいノードにファイルキャッシュの存在が必要なシナリオ |

#### ユーザーインターフェース

##### グローバルデフォルトバランスタイプ

FE設定（fe.conf）を通じてグローバルデフォルト値を設定：

```
cloud_default_rebalance_type = "async_warmup"
```
##### Compute Group レベルの設定

各 Compute Group に対して個別にバランスタイプを設定できます：

```sql
ALTER COMPUTE GROUP cg1 PROPERTIES("balance_type"="async_warmup");
```
##### 設定ルール

1. Compute Groupに`balance_type`が設定されていない場合、グローバルデフォルト値`async_warmup`を使用します。
2. Compute Groupに`balance_type`が設定されている場合、rebalance時にその設定が優先されます。

#### FAQ

##### グローバルRebalanceタイプを表示・変更する方法は？

- **表示**: `ADMIN SHOW FRONTEND CONFIG LIKE "cloud_default_rebalance_type";`を実行
- **変更**: `ADMIN SET FRONTEND CONFIG ("cloud_warm_up_for_rebalance_type" = "without_warmup");`を実行（FE再起動なしで有効）

##### Compute Group Balance Typeを照会する方法は？

`SHOW COMPUTE GROUPS;`を実行します。結果の`properties`列には、`balance_type`設定を含むCompute Group属性情報が含まれます。

##### クラスターが安定したTablet状態にあるかどうかを判断する方法は？

1. **`SHOW BACKENDS`による確認**: BE間のtablet数が近いかを確認します。参考計算範囲：

   ```
   (Total tablets in cluster / Compute Group BE count) * 0.95 
   ~ 
   (Total tablets in cluster / Compute Group BE count) * 1.05
   ```  
値0.05は、FE設定`cloud_rebalance_percent_threshold`のデフォルト値です。Compute Group内のBE間でタブレットの分散をより均一にするには、この設定値を小さくすることができます。

2. **FE Metricsを通じた観察**: FE metricsの`doris_fe_cloud_.*_balance_num`シリーズのメトリクスを確認してください。長期間変化がない場合、Compute Groupがバランスの取れた状態に到達していることを示します。継続的な観察と判断のため、これらのメトリクスを監視ダッシュボードに設定することを推奨します。

   ```bash
   curl "http://feip:fe_http_port/metrics" | grep '_balance_num'
   ```
## Compute Groupの名前変更

`ALTER SYSTEM RENAME COMPUTE GROUP <old_name> <new_name>`コマンドを使用して、既存のcompute groupの名前を変更することができます。詳細については、[Compute Groupの名前変更](../sql-manual/sql-statements/cluster-management/instance-management/ALTER-SYSTEM-RENAME-COMPUTE-GROUP)のSQLマニュアルを参照してください。

注意
compute groupの名前変更後、旧名（old_name）に対する権限を持っていたユーザー、または旧名をdefault compute group（default_compute_group）として設定していたユーザーの権限は、新名（new_name）に自動的に更新されません。権限は管理者権限を持つアカウントによって再設定する必要があります。これはMySQLデータベースの権限システムと一致しています。
