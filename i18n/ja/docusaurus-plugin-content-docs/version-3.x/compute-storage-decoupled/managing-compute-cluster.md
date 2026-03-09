---
{
  "title": "コンピュートグループの管理",
  "language": "ja",
  "description": "コンピュート・ストレージ分離アーキテクチャにおいて、1つ以上のコンピュートノード（BE）をCompute Groupにグループ化することができます。"
}
---
コンピュート・ストレージ分離アーキテクチャでは、1つまたは複数のコンピュートノード（BE）をCompute Groupにグループ化できます。このドキュメントでは、以下のような操作を含むcompute groupsの使用方法について説明します：

- 全compute groupsの表示
- compute groupアクセスの許可
- ユーザーレベルでのcompute groupsのバインディング（`default_compute_group`）によるユーザーレベル分離

*注意*
バージョン3.0.2より前では、これはCompute Clusterと呼ばれていました。

## Compute Group使用シナリオ

マルチcompute groupアーキテクチャでは、1つまたは複数のステートレスBEノードをcompute clustersにグループ化できます。compute cluster指定文（use @<compute_group_name>）を使用することで、特定のワークロードを特定のcompute clustersに割り当て、複数のインポートおよびクエリワークロードの物理的分離を実現できます。

2つのcompute clusters（C1とC2）があると仮定します。

- **Read-Read分離**: 2つの大きなクエリを開始する前に、それぞれ`use @c1`と`use @c2`を使用して、クエリが異なるコンピュートノードで実行されるようにします。これにより、同じデータセットにアクセスする際のリソース競合（CPU、メモリなど）を防ぎます。

- **Read-Write分離**: Dorisデータインポートは大量のリソースを消費し、特に大容量データと高頻度インポートのシナリオで顕著です。クエリとインポート間のリソース競合を回避するために、`use @c1`と`use @c2`を使用してクエリをC1で、インポートをC2で実行するよう指定できます。さらに、C1 compute clusterはC2 compute clusterで新しくインポートされたデータにアクセスできます。

- **Write-Write分離**: read-write分離と同様に、インポート同士も分離できます。例えば、システムに高頻度小規模インポートと大容量バッチインポートの両方がある場合、バッチインポートは通常時間がかかり再試行コストが高く、高頻度小規模インポートは迅速で再試行コストが低くなります。小規模インポートがバッチインポートを妨害することを防ぐために、`use @c1`と`use @c2`を使用して小規模インポートをC1で、バッチインポートをC2で実行するよう指定できます。

## デフォルトCompute Group選択メカニズム

ユーザーが明示的に[デフォルトcompute groupを設定](#setting-default-compute-group)していない場合、システムは自動的にユーザーが使用権限を持つActive BEを含むcompute groupを選択します。特定のセッションでデフォルトcompute groupが決定されると、ユーザーが明示的にデフォルト設定を変更しない限り、そのセッション中は変更されません。

異なるセッションで、以下の状況が発生した場合、システムはユーザーのデフォルトcompute groupを自動的に変更する可能性があります：

- ユーザーが前回のセッションで選択されたデフォルトcompute groupの使用権限を失った
- compute groupが追加または削除された
- 以前に選択されたデフォルトcompute groupにAlive BEがなくなった

状況1と2は、自動選択されるデフォルトcompute groupの変更に確実につながり、状況3は変更につながる可能性があります。

## 全Compute Groupsの表示

`SHOW COMPUTE GROUPS`コマンドを使用して、現在のリポジトリ内の全compute groupsを表示します。返される結果は、ユーザーの権限レベルに基づいて異なる内容が表示されます：

- `ADMIN`権限を持つユーザーは全compute groupsを表示できます
- 一般ユーザーは使用権限（USAGE_PRIV）を持つcompute groupsのみ表示できます
- ユーザーがどのcompute groupsに対しても使用権限を持たない場合、空の結果が返されます

```sql
SHOW COMPUTE GROUPS;
```
## Compute Groupの追加

compute groupを管理するには`OPERATOR`権限が必要です。この権限はノード管理の権限を制御します。詳細については、[Privilege Management](../sql-manual/sql-statements/account-management/GRANT-TO)を参照してください。デフォルトでは、rootアカウントのみが`OPERATOR`権限を持っていますが、`GRANT`コマンドを使用して他のアカウントに付与することができます。
BEを追加してcompute groupに割り当てるには、[Add BE](../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND)コマンドを使用します。例：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```
上記のsqlは`host:9050`をcompute group `new_group`に追加します。PROPERTIES文を省略した場合、BEはcompute group `default_compute_group`に追加されます。例えば：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```
## Compute Group アクセスの許可

前提条件: 現在の操作ユーザーが 'ADMIN' 権限を持っているか、現在のユーザーが admin ロールに属している。

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user}
```
## Compute Group アクセスの取り消し

前提条件：現在の操作ユーザーが 'ADMIN' 権限を持っているか、現在のユーザーが admin ロールに属している。

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user}
```
## デフォルトCompute Groupの設定

現在のユーザーのデフォルトcompute groupを設定するには（この操作には、現在のユーザーが既にcomputing groupを使用する権限を持っている必要があります）：

```sql
SET PROPERTY 'default_compute_group' = '{clusterName}';
```
他のユーザーのデフォルトcompute groupを設定するには（この操作にはAdmin権限が必要です）：

```sql
SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';
```
現在のユーザーのデフォルトコンピュートグループを表示するには、返された結果の`default_compute_group`の値がデフォルトコンピュートグループです：

```sql
SHOW PROPERTY;
```
他のユーザーのデフォルトcompute groupを表示するには、この操作は現在のユーザーがadmin権限を持つ必要があり、返された結果の`default_compute_group`の値がデフォルトcompute groupになります：

```sql
SHOW PROPERTY FOR {user};
```
現在のリポジトリで利用可能なすべてのcompute groupsを表示するには：

```sql
SHOW COMPUTE GROUPS;
```
:::info 注意

- 現在のユーザーがAdmin roleを持つ場合、例：`CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`の場合：
  - 自分および他のユーザーのデフォルトcompute groupを設定できます。
  - 自分および他のユーザーの`PROPERTY`を表示できます。
- 現在のユーザーがAdmin roleを持たない場合、例：`CREATE USER jack1 IDENTIFIED BY '123456'`の場合：
  - 自分のデフォルトcompute groupを設定できます。
  - 自分の`PROPERTY`を表示できます。
  - すべてのcompute groupを表示できません。この操作は`GRANT ADMIN`権限が必要です。
- 現在のユーザーがデフォルトcompute groupを設定していない場合、既存のシステムはデータの読み取り/書き込み操作を実行する際にエラーを発生させます。この問題を解決するには、ユーザーは`use @cluster`コマンドを実行して現在のコンテキストで使用するcompute groupを指定するか、`SET PROPERTY`文を使用してデフォルトcompute groupを設定できます。
- 現在のユーザーがデフォルトcompute groupを設定しているが、そのclusterがその後削除された場合、データの読み取り/書き込み操作中にもエラーが発生します。ユーザーは`use @cluster`コマンドを実行して現在のコンテキストで使用するcompute groupを再指定するか、`SET PROPERTY`文を使用してデフォルトcluster設定を更新できます。

:::


## Compute Groupの切り替え

ユーザーは、compute-storage分離アーキテクチャでデータベースと使用するcompute groupを指定できます。

**構文**

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```
データベースまたはcompute groupの名前に予約キーワードが含まれている場合、対応する名前をバッククォート```で囲む必要があります。

## Compute Groupのスケーリング

`ALTER SYSTEM ADD BACKEND`と`ALTER SYSTEM DECOMMISION BACKEND`を使用してBEを追加または削除することで、compute groupをスケールできます。
