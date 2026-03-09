---
{
  "title": "コンピュートグループ",
  "language": "ja",
  "description": "Compute Groupは、ストレージ・コンピュート分離アーキテクチャにおいて、異なるワークロード間の物理的分離を実現するメカニズムです。"
}
---
Compute Groupは、ストレージ・コンピュート分離アーキテクチャにおいて、異なるワークロード間の物理的分離を実現するメカニズムです。Compute Groupの基本原理は以下の図で示されています：

![Compute Group workloads management in a storage-compute separation architecture](/images/compute_group_workload_management.png)

- 1つ以上のBEノードでCompute Groupを構成できます。

- BEノードはローカルではステートレスで、データは共有ストレージに格納されます。

- 複数のCompute Groupが共有ストレージを通じてデータにアクセスします。

Resource Groupのような強力な分離の利点を維持しながら、Compute Groupは以下の利点を提供します：

- 低コスト：ストレージ・コンピュート分離アーキテクチャにより、データが共有ストレージに存在するため、Compute Groupの数はレプリカ数による制限を受けません。ユーザーはストレージコストを増加させることなく、必要に応じてCompute Groupを作成できます。

- より高い柔軟性：ストレージ・コンピュート分離アーキテクチャでは、BEノード上のデータはキャッシュされるため、Compute Groupの追加に煩雑なデータ移行プロセスは不要です。新しいCompute Groupはクエリ実行時にキャッシュのウォームアップを行うだけで済みます。

- より優れた分離：データの可用性は共有ストレージ層で処理されるため、いずれかのCompute Group内のBEノードに障害が発生しても、Resource Groupのようなデータロード失敗は発生しません。

:::caution 注意
3.0.2より前では、Compute Clusterと呼ばれていました。
:::


## 全てのCompute Groupの表示

現在のリポジトリ内の全てのcompute groupを表示するには、`SHOW COMPUTE GROUPS`コマンドを使用します。返される結果は、ユーザーの権限レベルに基づいて異なる内容が表示されます：

- `ADMIN`権限を持つユーザーは全てのcompute groupを表示できます
- 一般ユーザーは使用権限（USAGE_PRIV）を持つcompute groupのみ表示できます
- いずれのcompute groupに対しても使用権限を持たないユーザーには、空の結果が返されます

```sql
SHOW COMPUTE GROUPS;
```
## Compute Groupの追加

Compute Groupの管理には、ノード管理権限を制御する`OPERATOR`権限が必要です。詳細については、[Privilege Management](../../sql-manual/sql-statements/account-management/GRANT-TO)を参照してください。デフォルトでは、rootアカウントのみが`OPERATOR`権限を持ちますが、`GRANT`コマンドを使用して他のアカウントに付与することができます。
BEを追加してcompute groupに割り当てるには、[Add BE](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND)コマンドを使用します。例：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```
上記のsqlは`host:9050`をcompute group `new_group`に追加します。PROPERTIES文を省略した場合、BEはcompute group `default_compute_group`に追加されます。例えば：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```
## Compute Group アクセスの許可
前提条件: 現在の操作ユーザーが 'ADMIN' 権限を持っている、または現在のユーザーが admin ロールに属している。

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user}
```
## Compute Groupアクセスの取り消し
前提条件: 現在の操作ユーザーが'ADMIN'権限を持っているか、現在のユーザーがadminロールに属している。

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user}
```
## デフォルトCompute Groupの設定

現在のユーザーのデフォルトcompute groupを設定するには（この操作には、現在のユーザーがすでにcomputing groupを使用する権限を持っている必要があります）：

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
他のユーザーのデフォルトcompute groupを表示するには、この操作では現在のユーザーに管理者権限が必要であり、返される結果の`default_compute_group`の値がデフォルトcompute groupです：

```sql
SHOW PROPERTY FOR {user};
```
現在のリポジトリで利用可能なすべてのcompute groupを表示するには：

```sql
SHOW COMPUTE GROUPS;
```
:::info 注意

- 現在のユーザーがAdmin roleを持っている場合、例：`CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`の場合：
  - 自分自身と他のユーザーのデフォルトcompute groupを設定できます；
  - 自分自身と他のユーザーの`PROPERTY`を表示できます。
- 現在のユーザーがAdmin roleを持っていない場合、例：`CREATE USER jack1 IDENTIFIED BY '123456'`の場合：
  - 自分自身のデフォルトcompute groupを設定できます；
  - 自分自身の`PROPERTY`を表示できます；
  - すべてのcompute groupを表示することはできません。この操作には`GRANT ADMIN`権限が必要です。
- 現在のユーザーがデフォルトのcompute groupを設定していない場合、既存のシステムはデータの読み書き操作を実行する際にエラーを発生させます。この問題を解決するために、ユーザーは`use @cluster`コマンドを実行して現在のコンテキストで使用するcompute groupを指定するか、`SET PROPERTY`文を使用してデフォルトのcompute groupを設定できます。
- 現在のユーザーがデフォルトのcompute groupを設定していても、そのclusterが後で削除された場合、データの読み書き操作中にもエラーが発生します。ユーザーは`use @cluster`コマンドを実行して現在のコンテキストで使用するcompute groupを再指定するか、`SET PROPERTY`文を使用してデフォルトのcluster設定を更新できます。

:::


## Compute Groupの切り替え

ユーザーはcompute-storage decoupled architectureにおいて使用するデータベースとcompute groupを指定できます。

**構文**

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```
データベースまたはcompute group名に予約キーワードが含まれている場合、対応する名前はバッククォート```で囲む必要があります。

## Compute Groupのスケーリング

`ALTER SYSTEM ADD BACKEND`と`ALTER SYSTEM DECOMMISION BACKEND`を使用してBEを追加または削除することで、compute groupをスケールできます。
