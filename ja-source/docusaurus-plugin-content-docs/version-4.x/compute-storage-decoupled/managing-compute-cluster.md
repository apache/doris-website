---
{
  "title": "コンピュートグループの管理",
  "language": "ja",
  "description": "コンピュート・ストレージ分離アーキテクチャにおいて、1つまたは複数のコンピュートノード（BE）をグループ化してCompute Groupにすることができます。"
}
---
コンピュート・ストレージ分離アーキテクチャでは、1つ以上のコンピュートノード（BE）をCompute Groupにグループ化できます。このドキュメントでは、以下のような操作を含む、compute groupの使用方法について説明します：

- すべてのcompute groupの表示
- compute groupアクセスの付与
- ユーザーレベルでのcompute groupのバインディング（`default_compute_group`）によるユーザーレベルの分離

*注意*
バージョン3.0.2より前では、これはCompute クラスターと呼ばれていました。

## Compute Group使用シナリオ

マルチcompute groupアーキテクチャでは、1つ以上のステートレスBEノードをcompute clusterにグループ化できます。compute cluster仕様文（use @<compute_group_name>）を使用することで、特定のワークロードを特定のcompute clusterに割り当て、複数のインポートおよびクエリワークロードの物理的分離を実現できます。

2つのcompute cluster、C1とC2があると仮定します。

- **Read-Read分離**: 2つの大きなクエリを開始する前に、それぞれ`use @c1`と`use @c2`を使用して、クエリが異なるコンピュートノードで実行されるようにします。これにより、同じデータセットにアクセスする際のリソース競合（CPU、メモリなど）を防ぎます。

- **Read-Write分離**: Dorisのデータインポートは大量のリソースを消費します、特に大容量データと高頻度インポートのシナリオでは顕著です。クエリとインポート間のリソース競合を避けるため、`use @c1`と`use @c2`を使用してクエリをC1で実行し、インポートをC2で実行するよう指定できます。さらに、C1 compute clusterはC2 compute clusterで新しくインポートされたデータにアクセスできます。

- **Write-Write分離**: read-write分離と同様に、インポート同士も分離できます。例えば、システムに高頻度の小規模インポートと大規模バッチインポートの両方がある場合、バッチインポートは通常時間が長く再試行コストが高い一方、高頻度の小規模インポートは迅速で再試行コストが低くなります。小規模インポートがバッチインポートを妨害することを防ぐため、`use @c1`と`use @c2`を使用して小規模インポートをC1で実行し、バッチインポートをC2で実行するよう指定できます。

## デフォルトCompute Group選択メカニズム

ユーザーが明示的に[デフォルトcompute groupを設定](#setting-default-compute-group)していない場合、システムは自動的に、ユーザーが使用権限を持つActive BEのあるcompute groupを選択します。特定のセッションでデフォルトcompute groupが決定されると、ユーザーが明示的にデフォルト設定を変更しない限り、そのセッション中は変更されません。

異なるセッションで以下の状況が発生した場合、システムは自動的にユーザーのデフォルトcompute groupを変更する可能性があります：

- ユーザーが前回のセッションで選択されたデフォルトcompute groupに対する使用権限を失った
- compute groupが追加または削除された
- 以前に選択されたデフォルトcompute groupにAlive BEがなくなった

状況1と2は確実に自動選択されるデフォルトcompute groupの変更につながり、状況3は変更につながる可能性があります。

## すべてのCompute Groupの表示

`SHOW COMPUTE GROUPS`コマンドを使用して、現在のリポジトリ内のすべてのcompute groupを表示します。返される結果は、ユーザーの権限レベルに基づいて異なる内容が表示されます：

- `ADMIN`権限を持つユーザーはすべてのcompute groupを表示できます
- 一般ユーザーは使用権限（USAGE_PRIV）を持つcompute groupのみ表示できます
- ユーザーがいずれのcompute groupに対しても使用権限を持たない場合、空の結果が返されます

```sql
SHOW COMPUTE GROUPS;
```
## Compute Groupの追加

Compute Groupの管理には`OPERATOR`権限が必要です。この権限はノード管理の許可を制御します。詳細については、[Privilege Management](../sql-manual/sql-statements/account-management/GRANT-TO)を参照してください。デフォルトでは、rootアカウントのみが`OPERATOR`権限を持っていますが、`GRANT`コマンドを使用して他のアカウントに付与することができます。
BEを追加してcompute groupに割り当てるには、[Add BE](../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND)コマンドを使用します。例：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```
上記のsqlは`host:9050`をcompute group `new_group`に追加します。PROPERTIES文を省略した場合、BEはcompute group `default_compute_group`に追加されます。例えば：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```
## Compute Group アクセス権の付与
前提条件: 現在の操作ユーザーが'ADMIN'権限を持っているか、現在のユーザーが admin ロールに属していること。

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user}
```
## Compute Groupアクセスの取り消し
前提条件：現在の操作ユーザーが'ADMIN'権限を持っている、または現在のユーザーがadminロールに属している。

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user}
```
## デフォルトCompute Groupの設定

現在のユーザーのデフォルトcompute groupを設定するには（この操作には、現在のユーザーが既にcomputing groupを使用する権限を持っている必要があります）：

```sql
SET PROPERTY 'default_compute_group' = '{clusterName}';
```
他のユーザーのデフォルトのcompute groupを設定するには（この操作にはAdmin権限が必要です）：

```sql
SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';
```
現在のユーザーのデフォルトコンピュートグループを表示するには、返された結果の`default_compute_group`の値がデフォルトコンピュートグループです：

```sql
SHOW PROPERTY;
```
他のユーザーのデフォルトcompute groupを表示するには、この操作では現在のユーザーが管理者権限を持つ必要があり、返される結果の`default_compute_group`の値がデフォルトcompute groupです：

```sql
SHOW PROPERTY FOR {user};
```
現在のリポジトリで利用可能なすべてのcompute groupを表示するには：

```sql
SHOW COMPUTE GROUPS;
```
:::info 注意

- 現在のユーザーがAdmin ロールを持っている場合、例えば：`CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`の場合：
  - 自分自身と他のユーザーのデフォルト compute group を設定できます
  - 自分自身と他のユーザーの`PROPERTY`を表示できます
- 現在のユーザーがAdmin ロールを持っていない場合、例えば：`CREATE USER jack1 IDENTIFIED BY '123456'`の場合：
  - 自分自身のデフォルト compute group を設定できます
  - 自分自身の`PROPERTY`を表示できます
  - すべての compute group を表示することはできません。この操作には`GRANT ADMIN`権限が必要です
- 現在のユーザーがデフォルト compute group を設定していない場合、既存のシステムはデータ読み書き操作を実行する際にエラーを発生させます。この問題を解決するには、ユーザーは`use @cluster`コマンドを実行して現在のコンテキストで使用する compute group を指定するか、`SET PROPERTY`文を使用してデフォルト compute group を設定します。
- 現在のユーザーがデフォルト compute group を設定しているが、そのクラスターがその後削除された場合、データ読み書き操作中にもエラーが発生します。ユーザーは`use @cluster`コマンドを実行して現在のコンテキストで使用する compute group を再指定するか、`SET PROPERTY`文を使用してデフォルトクラスター設定を更新できます。

:::


## Compute Group の切り替え

ユーザーは compute-storage decoupled アーキテクチャで使用するデータベースと compute group を指定できます。

**構文**

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```
データベースまたはcompute group名に予約済みキーワードが含まれている場合、対応する名前はバッククォート```で囲む必要があります。

## Compute Groupのスケーリング

`ALTER SYSTEM ADD BACKEND`と`ALTER SYSTEM DECOMMISION BACKEND`を使用してBEを追加または削除することで、compute groupをスケールできます。

## Compute Groupの名前変更

既存のcompute groupの名前を変更するには、`ALTER SYSTEM RENAME COMPUTE GROUP <old_name> <new_name>`コマンドを使用できます。詳細については、[Renaming Compute Groups](../sql-manual/sql-statements/cluster-management/instance-management/ALTER-SYSTEM-RENAME-COMPUTE-GROUP)のSQLマニュアルを参照してください。

注意
compute groupの名前を変更した後、古い名前（old_name）に対する権限を持っていたユーザー、または古い名前をデフォルトcompute group（default_compute_group）として設定していたユーザーの権限は、新しい名前（new_name）に自動的に更新されません。権限は管理者権限を持つアカウントによって再設定する必要があります。これはMySQLデータベースの権限システムと一貫しています。
