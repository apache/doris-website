---
{
    "title": "Workload Group：Doris のプロセス内リソース分離ガイド",
    "sidebar_label": "Workload Group",
    "language": "ja",
    "description": "Workload Group を使用して、Doris の BE プロセス内で CPU、メモリ、IO リソースを細かく分離し、高負荷のクエリがオンライン業務に影響しないようにする方法を説明します。",
    "keywords": ["Workload Group", "resource isolation", "CPU limit", "memory limit", "IO limit", "CGroup", "query queueing", "workload management", "workload group configuration", "doris resource management"]
}
---

<!-- Knowledge type: Architecture decision -->

Workload Group は、Doris プロセス内の論理的なリソース分離機構です。BE プロセス内の CPU、メモリ、IO リソースを細かく分割し、異なる業務のワークロードが互いに干渉しないようにします。

![Workload Group](/images/workload_group_arch.png)

現在、次のリソース分離に対応しています。

- **CPU リソース**：CPU のソフト制限（最低保証）とハード制限（上限）に対応
- **メモリリソース**：メモリのソフト制限とハード制限に対応
- **IO リソース**：ローカルファイルおよびリモートファイルの読み取りで発生する IO 帯域幅を制限

:::tip プロセス内分離とプロセス間分離

Workload Group が提供するプロセス内のリソース分離は、Resource Group や Compute Group などのプロセス間分離とは根本的に異なります。

1. **プロセス内分離**では、共有キャッシュや RPC スレッドプールなど、分離できない共有コンポーネントがあります。制御がない場合と比べて影響は大幅に軽減されますが、高負荷のタスクが低負荷のタスクのレイテンシーに影響する可能性は残ります。
2. **選択の目安**：ある程度のレイテンシーを許容でき、コストを抑えたい場合は Workload Group を選択します。完全な分離が必要で、より高いコストを許容できる場合は、優先度の高いワークロードを専用の BE ノードに割り当てる Resource Group または Compute Group を選択します。

:::

## バージョン別の注意事項 {#version-notes}

<!-- Knowledge type: Configuration parameters -->

| バージョン | 説明 |
|---------|-------------|
| Doris 2.0 | Workload Group 機能を導入。CGroup への依存なし |
| Doris 2.1 | Workload Group に CGroup が必要。システムが削除できない `normal` グループを自動作成 |
| Doris 4.0 | CPU のソフト制限とハード制限の概念を `min_cpu_percent` / `max_cpu_percent` に、メモリのソフト制限とハード制限の概念を `min_memory_percent` / `max_memory_percent` に統一 |

**アップグレード時の注意事項**：

- **1.2 → 2.0**：クラスタ全体のアップグレードが完了してから Workload Group 機能を有効にすることを推奨します。一部の follower FE ノードだけをアップグレードすると、未アップグレードのノードにメタデータがなく、クエリが失敗する可能性があります。
- **2.0 → 2.1**：先に CGroup 環境を設定してから、バージョン 2.1 にアップグレードします。

## 主なプロパティ {#core-properties}

<!-- Knowledge type: Configuration parameters -->

### CPU リソースのパラメータ {#cpu-resource-parameters}

| パラメータ | 値の範囲 | 説明 |
|-----------|-------------|-------------|
| `MIN_CPU_PERCENT` | [0%, 100%] | この Workload Group に確保する CPU 帯域幅の最小値。CPU の競合時、他のグループはこの帯域幅を奪えません。リソースに余裕がある場合は、この値を超えて使用できます。 |
| `MAX_CPU_PERCENT` | [0%, 100%] | この Workload Group の CPU 帯域幅の上限。現在の CPU 使用状況にかかわらず、このグループの CPU 使用量はこの値を超えません。 |

制約：すべての Workload Group の `MIN_CPU_PERCENT` の合計は 100% を超えられず、`MIN_CPU_PERCENT` は `MAX_CPU_PERCENT` を超えられません。

**シナリオ例**：ある会社の営業部門（CPU 負荷が高く、優先度が高い）とマーケティング部門（CPU 負荷が高く、優先度が低い）が同じ Doris インスタンスを共有しているとします。営業部門の Workload Group に `min_cpu_percent` を 40%、マーケティング部門の Workload Group に `max_cpu_percent` を 30% 設定すると、営業部門の業務に安定した CPU リソースを確保できます。

### メモリリソースのパラメータ {#memory-resource-parameters}

| パラメータ | 値の範囲 | 説明 |
|-----------|-------------|-------------|
| `MIN_MEMORY_PERCENT` | [0%, 100%] | この Workload Group に確保するメモリの最小量。メモリ不足時、システムはこの値に従ってメモリを割り当てます。必要に応じて一部のクエリを強制終了してメモリを解放し、他のグループが十分な空きメモリを使えるようにします。 |
| `MAX_MEMORY_PERCENT` | [0%, 100%] | この Workload Group のメモリ使用量の上限。クエリのメモリ使用量がこの値を超えると、ディスクへの退避が行われるか、クエリが強制終了されます。 |

制約：すべての Workload Group の `MIN_MEMORY_PERCENT` の合計は 100% を超えられず、`MIN_MEMORY_PERCENT` は `MAX_MEMORY_PERCENT` を超えられません。

### その他のプロパティ {#other-properties}

| プロパティ名 | データ型 | デフォルト値 | 値の範囲 | 説明 |
|---------------|-----------|---------------|-------------|-------------|
| `max_concurrency` | 整数 | 2147483647 | [0, 2147483647] | クエリの最大同時実行数。デフォルトでは無制限です。実行中のクエリ数が上限に達すると、新しいクエリはキューイング処理に入ります。 |
| `max_queue_size` | 整数 | 0 | [0, 2147483647] | クエリキューの長さ。デフォルトの 0 はキューイングしないことを意味し、キューが満杯になると新しいクエリは直ちに失敗します。 |
| `queue_timeout` | 整数 | 0 | [0, 2147483647] | キュー内でクエリが待機できる最大時間（ミリ秒）。デフォルトの 0 はキューイングしないことを意味し、クエリはキューに入ると直ちに失敗を返します。 |
| `scan_thread_num` | 整数 | -1 | [1, 2147483647] | 現在の Workload Group がスキャンに使用するスレッド数。-1 に設定すると、BE 設定の `doris_scanner_thread_pool_thread_num` の値が使用されます。 |
| `max_remote_scan_thread_num` | 整数 | -1 | [1, 2147483647] | 外部データソースを読み取るスキャンスレッドプールの最大スレッド数。-1 に設定すると、BE が自動的に決定します（通常はコア数に関連します）。 |
| `min_remote_scan_thread_num` | 整数 | -1 | [1, 2147483647] | 外部データソースを読み取るスキャンスレッドプールの最小スレッド数。-1 に設定すると、BE が自動的に決定します（通常はコア数に関連します）。 |
| `read_bytes_per_second` | 整数 | -1 | [1, 9223372036854775807] | Doris の内部テーブルを読み取る際の最大 IO スループット（バイト/秒）。デフォルトの -1 は無制限を意味します。この値はディスクではなくフォルダに適用され、退避ファイルのディレクトリもこの制限の対象です。 |
| `remote_read_bytes_per_second` | 整数 | -1 | [1, 9223372036854775807] | Doris の外部テーブルを読み取る際の最大 IO スループット（バイト/秒）。デフォルトの -1 は無制限を意味します。 |

## Workload Group の設定 {#configure-workload-group}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Pre-deployment check / Environment acceptance -->

### 手順 1：CGroup 環境を設定する {#step-1-configure-the-cgroup-environment}

Workload Group の CPU 管理は CGroup コンポーネントに依存します。メモリと IO リソースだけを管理する場合は、この手順を省略できます。

**1. CGroup のバージョンを確認する**

```shell
cat /proc/filesystems | grep cgroup
nodev	cgroup
nodev	cgroup2
nodev	cgroupfs
```

出力の `cgroup` は CGroup V1 がインストールされていること、`cgroup2` は CGroup V2 がインストールされていることを示します。

**2. 現在有効なバージョンを確認する**

```shell
# If this path exists, the currently effective version is CGroup V1
/sys/fs/cgroup/cpu/

# If this path exists, the currently effective version is CGroup V2
/sys/fs/cgroup/cgroup.controllers
```

**3. CGroup パスの下に doris ディレクトリを作成する**

```shell
# CGroup V1: create under the cpu directory
mkdir /sys/fs/cgroup/cpu/doris

# CGroup V2: create under the cgroup directory
mkdir /sys/fs/cgroup/doris
```

**4. BE プロセスに読み取り・書き込み・実行権限を付与する**

```shell
# CGroup V1
chmod 770 /sys/fs/cgroup/cpu/doris
chown -R doris:doris /sys/fs/cgroup/cpu/doris

# CGroup V2
chmod 770 /sys/fs/cgroup/doris
chown -R doris:doris /sys/fs/cgroup/doris
```

**5. CGroup V2 で追加の操作を行う（V1 では省略）**

プロセスを CGroup ディレクトリ間で移動できるように、ルートディレクトリにある `cgroup.procs` ファイルの権限を変更します。

```shell
chmod a+w /sys/fs/cgroup/cgroup.procs
```

doris ディレクトリで cpu コントローラーが有効になっていることを確認します。`doris/cgroup.controllers` に `cpu` が含まれていない場合は、次のコマンドを実行して有効にします。

```shell
# After successful execution, a cpu.max file appears under the doris directory, and the output of cgroup.controllers includes cpu
# If it fails, the parent directory has not enabled the cpu controller either; enable it for the parent directory first
echo +cpu > ../cgroup.subtree_control
```

**6. BE 設定を変更して CGroup パスを指定する**

```shell
# CGroup V1
doris_cgroup_cpu_path = /sys/fs/cgroup/cpu/doris

# CGroup V2
doris_cgroup_cpu_path = /sys/fs/cgroup/doris
```

**7. BE を再起動する**

再起動後、`be.INFO` ログに `add thread xxx to group` が表示されれば、設定は成功です。

:::tip CGroup を使用する際の注意事項

1. マシンごとに BE インスタンスを配置することを推奨します。現在の Workload Group 機能は、マシンに複数の BE を配置する構成をサポートしていません。
2. マシンを再起動すると、CGroup パス下の設定は消去されます。設定を永続化するには、systemd を使用してディレクトリの作成と権限付与をシステムサービスに設定し、再起動のたびに自動実行します。
3. コンテナ内で CGroup を使用する場合、コンテナにはホストを操作する権限が必要です。

:::

#### コンテナで Workload Group を使用する {#using-workload-group-in-containers}

<!-- Knowledge type: Operational steps -->

Workload Group の CPU 管理は CGroup に基づいて実装されています。コンテナで使用する場合は、Doris プロセスがホストの CGroup ファイルを読み書きできるよう、特権モードでコンテナを起動します。

コンテナ内の CPU リソースは、コンテナに割り当てられたリソースをさらに分割したものです。たとえば、ホストに 64 コアがあり、コンテナに 8 コアが割り当てられ、Workload Group の CPU ハード制限を 50% に設定した場合、実際に使用できるコア数は 4（8 コア × 50%）です。

Workload Group のメモリ管理と IO 管理は Doris の内部で実装されており、外部コンポーネントには依存しません。コンテナ内でも物理マシン上でも、使用方法に違いはありません。Kubernetes 上で Doris を使用する場合は、基盤となる権限設定の詳細を抽象化する Doris Operator でのデプロイを推奨します。

### 手順 2：Workload Group を作成する {#step-2-create-a-workload-group}

<!-- Knowledge type: Operational steps -->

```sql
CREATE WORKLOAD GROUP IF NOT EXISTS g1
PROPERTIES (
    "min_cpu_percent" = "10%"
);
```

この例では、CPU リソースの最小割合を 10% に設定します。バージョン 2.1 以降、システムは `normal` という名前のグループを自動作成します。このグループは削除できません。

:::caution クラウドモードでは Compute Group の明示的な指定が必要
このドキュメントにある CREATE / ALTER / DROP WORKLOAD GROUP の例では、いずれも `FOR <compute_group>` 句を省略しています。そのまま実行できるのは、デフォルトの Resource Group に適用される**非クラウドモード（ストレージとコンピューティングが結合されたモード）**のみです。

**クラウドモード（ストレージとコンピューティングが分離されたモード）では、`FOR <compute_group>` 句を明示的に指定する必要があります**。指定しない場合、`Must specify compute group via 'FOR <compute_group>' in cloud mode.` というエラーでステートメントが失敗します。詳細は [Workload Group を Compute Group に関連付ける](./workload-group-bind-compute-group) を参照してください。
:::

完全な構文については、[CREATE-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-GROUP) を参照してください。

### 手順 3：ユーザーに権限を付与し、Workload Group を関連付ける {#step-3-grant-permissions-to-a-user-and-bind-the-workload-group}

<!-- Knowledge type: Operational steps -->

**ユーザー権限を確認する**

`information_schema.workload_groups` システムテーブルをクエリし、現在のユーザーが使用できる Workload Group を取得します。

```sql
SELECT name FROM information_schema.workload_groups;
+--------+
| name   |
+--------+
| normal |
| g1     |
+--------+
```

**権限を付与する**

対象の Workload Group がユーザーに表示されない場合は、管理者アカウントで GRANT ステートメントを実行します。

```sql
GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'user_1'@'%';
```

その他の権限付与操作については、[GRANT-TO](../../sql-manual/sql-statements/account-management/GRANT-TO) を参照してください。

**関連付け方法**

次の関連付け方法に対応しています。セッション変数はユーザープロパティより優先されます。

| 関連付け方法 | コマンド | 説明 |
|----------------|---------|-------------|
| ユーザープロパティ（永続） | `SET PROPERTY 'default_workload_group' = 'g1';` | ユーザーが使用するデフォルトの Workload Group。空にはできません |
| セッション変数（一時的） | `SET workload_group = 'g1';` | 現在のセッションでのみ有効。デフォルトでは空です |

## Workload Group の管理 {#manage-workload-group}

<!-- Knowledge type: Operational steps -->

### Workload Group を表示する {#view-workload-group}

**方法 1：SHOW ステートメント**

```sql
SHOW WORKLOAD GROUPS;
```

参照：[SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS)

**方法 2：システムテーブルへのクエリ**

```sql
SELECT name, min_cpu_percent FROM information_schema.workload_groups WHERE name = 'g1';
+------+-----------------+
| name | min_cpu_percent |
+------+-----------------+
| g1   | 10%             |
+------+-----------------+
```

### Workload Group を変更する {#modify-workload-group}

```sql
ALTER WORKLOAD GROUP g1 PROPERTIES('min_cpu_percent' = '20%');

SELECT min_cpu_percent FROM information_schema.workload_groups WHERE name = 'g1';
+-----------------+
| min_cpu_percent |
+-----------------+
| 20%             |
+-----------------+
```

参照：[ALTER-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP)

### Workload Group を削除する {#drop-workload-group}

```sql
DROP WORKLOAD GROUP g1;
```

参照：[DROP-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-GROUP)

## 効果の検証 {#effect-verification}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

以下のテストはすべて、ClickBench データセットを使用し、FE 1 台と BE 1 台（96 コア、メモリ 375 GB）の環境で実施しました。

### メモリのハード制限の効果を検証する {#verify-the-memory-hard-limit-effect}

Adhoc クエリは入力とメモリ使用量を予測しにくく、少数のクエリがメモリを使い尽くすリスクがあります。このようなワークロードを別のグループに割り当て、メモリのハード制限を設定すると、突然の大きなクエリによる OOM や、他のクエリで使えるメモリの枯渇を防げます。この Workload Group のメモリ使用量がハード制限を超えると、クエリを強制終了してメモリを解放します。

**メモリのハード制限を有効にしていない場合**

jmeter を使用して q29 を同時実行数 3 で発行します。ps コマンドによると、プロセスのメモリ使用量は約 7.7 GB です。

```sql
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 7896792
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 7929692
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 8101232
```

システムテーブルをクエリすると、Workload Group のメモリ使用量は約 5.8 GB です。（メタデータや Cache などは Workload Group の統計に含まれないため、プロセスのメモリ使用量は通常、単一の Workload Group の使用量よりかなり大きくなります。）

```sql
SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5797.524360656738 |
+-------------------+
1 row in set (0.01 sec)

SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5840.246627807617 |
+-------------------+
1 row in set (0.02 sec)

SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5878.394917488098 |
+-------------------+
1 row in set (0.02 sec)
```

**メモリのハード制限を有効にした場合**

1. メモリ制限を 1% に設定します。

    ```sql
    ALTER WORKLOAD GROUP g2 PROPERTIES('memory_limit' = '1%');
    ```

2. 同じテストを実行します。システムテーブルでは、メモリ使用量が約 1.5 GB に減っています。

    ```sql
    SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
    +--------------------+
    | wg_mem_used_mb     |
    +--------------------+
    | 1575.3877239227295 |
    +--------------------+
    1 row in set (0.02 sec)

    SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
    +------------------+
    | wg_mem_used_mb   |
    +------------------+
    | 1668.77405834198 |
    +------------------+
    1 row in set (0.01 sec)

    SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
    +--------------------+
    | wg_mem_used_mb     |
    +--------------------+
    | 499.96760272979736 |
    +--------------------+
    1 row in set (0.01 sec)
    ```

3. ps コマンドによると、プロセスのメモリ使用量は約 3.8 GB に減っています。

    ```sql
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4071364
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4059012
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4057068
    ```

4. クライアント側では、メモリ不足によるクエリの失敗が確認できます。

    ```text
    1724074250162,14126,1c_sql,HY000 1105,"java.sql.SQLException: errCode = 2, detailMessage = (127.0.0.1)[MEM_LIMIT_EXCEEDED]GC wg for hard limit, wg id:11201, name:g2, used:1.71 GB, limit:1.69 GB, backend:10.16.10.8. cancel top memory used tracker <Query#Id=4a0689936c444ac8-a0d01a50b944f6e7> consumption 1.71 GB. details:process memory used 3.01 GB exceed soft limit 304.41 GB or sys available memory 101.16 GB less than warning water mark 12.80 GB., Execute again after enough memory, details see be.INFO.",concurrency 1-3,text,false,,444,0,3,3,null,0,0,0
    ```

:::tip 使用時の推奨事項

メモリのハード制限はクエリを強制終了することでメモリを解放するため、極端な場合にはすべてのクエリが失敗する可能性があります。本番環境では、メモリ使用量を制御しながらクエリの成功率も確保できるよう、メモリのハード制限とクエリキューイング機能を併用することを推奨します。

:::

### CPU のハード制限の効果を検証する {#verify-the-cpu-hard-limit-effect}

Doris の代表的なワークロードは次のように分類でき、それぞれ以下の設定を推奨します。

| ワークロードの種類 | 特徴 | 推奨設定 |
|---------------|-----------------|---------------------------|
| 主要なレポート用クエリ | CPU 負荷が高く、可用性の要件が高い | CPU のソフト制限を設定し、優先度を高くする |
| Adhoc クエリ | SQL が不定で、リソース使用量が不明 | CPU のハード制限を低い値に設定する |
| ETL クエリ | SQL が固定で、リソース使用量が時折急増する | CPU のハード制限を設定し、オンライン業務への影響を防ぐ |

BE の CPU が飽和すると、RPC コンポーネントなどの内部コンポーネントが使用できる CPU も減少し、クラスタ全体の可用性が目に見えて低下します。そのため、本番環境ではソフト制限よりも **CPU のハード制限を推奨します**。

**テスト環境**：FE 1 台、BE 1 台、96 コアのマシン。データセットは ClickBench、テスト SQL は q29 です。

1. jmeter を使用して 3 件のクエリを同時に発行し、BE プロセスの CPU 使用率を高めます。（top コマンドでは CPU 使用率が 7600%、つまり約 76 コアと表示されます。）

    ![Workload Group の CPU 使用状況](/images/workload-management/use_wg_cpu_1.png)

2. Workload Group の CPU ハード制限を 10% に変更します。

    ```sql
    ALTER WORKLOAD GROUP g2 PROPERTIES('max_cpu_percent' = '10%');
    ```

3. 負荷テストを再実行します。プロセスが使用できるのは約 9～10 コアとなり、総コア数の 10% に相当します。

    ![Workload Group の CPU 使用状況](/images/workload-management/use_wg_cpu_2.png)

4. システムテーブルで、CPU 使用率が約 10% に制御されていることを確認します。

    ```sql
    SELECT CPU_USAGE_PERCENT FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +-------------------+
    | CPU_USAGE_PERCENT |
    +-------------------+
    |              9.57 |
    +-------------------+
    1 row in set (0.02 sec)
    ```

:::tip 注意事項

1. 低レイテンシーが求められる環境で可用性を確保するには、他のコンポーネント用の余裕を残し、すべての Workload Group の CPU 設定値の合計をちょうど 100% にしないことを推奨します。レイテンシーが問題にならず、リソースを最大限に利用したい場合は、合計を 100% に設定できます。
2. FE が Workload Group のメタデータを BE に同期する間隔は 30 秒です。変更が有効になるまで最大 30 秒かかる場合があります。

:::

:::tip 高スループットのデータ取り込みに関する注意事項

CPU のハード制限を検証するには、クエリのワークロードを使用した方が正確な結果を得られます。高スループットのデータ取り込みでは Compaction が発生し、観測値が Workload Group の設定値を超えることがあります。これは、現在 Compaction のワークロードが Workload Group の管理対象ではないためです。

:::

### ローカル IO のハード制限の効果を検証する {#verify-the-local-io-hard-limit-effect}

OLAP システムで ETL や大規模な Adhoc クエリを実行すると、複数のスレッドで複数のディスクファイルを並列にスキャンするため、大量のディスク IO が発生し、他のオンラインクエリに影響します。オフライン ETL タスクに IO 帯域幅の上限を設定すると、オンラインのレポート作成や分析への影響を抑えられます。

**テスト環境**：FE 1 台、BE 1 台、96 コアのマシン。データセットは ClickBench です。

**IO のハード制限を有効にしていない場合**

1. キャッシュを無効にします。

    ```sql
    -- Clear the operating system cache
    sync; echo 3 > /proc/sys/vm/drop_caches

    -- Disable the BE page cache
    disable_storage_page_cache = true
    ```

2. ClickBench テーブルをフルスキャンします（同時実行数は単一）。

    ```sql
    SET dry_run_query = true;
    SELECT * FROM hits.hits;
    ```

3. システムテーブルをクエリすると、最大スループットは約 3 GB/s です。

    ```sql
    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 1146.6208400726318 |
    +--------------------+
    1 row in set (0.03 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 3496.2762966156006 |
    +--------------------+
    1 row in set (0.04 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 2192.7690029144287 |
    +--------------------+
    1 row in set (0.02 sec)
    ```

4. pidstat コマンドでプロセスの IO を確認します（先頭の列はプロセス ID、次の列は KB/s 単位の読み取り IO スループットです）。制限がない場合、最大スループットは約 2 GB/s です。

    ![Workload Group の IO 使用状況](/images/workload-management/use_wg_io_1.png)

**IO のハード制限を有効にした場合**

1. キャッシュを無効にします。

    ```sql
    -- Clear the operating system cache
    sync; echo 3 > /proc/sys/vm/drop_caches

    -- Disable the BE page cache
    disable_storage_page_cache = true
    ```

2. 最大読み取りスループットを 100 MB/s に制限します。

    ```sql
    ALTER WORKLOAD GROUP g2 PROPERTIES('read_bytes_per_second' = '104857600');
    ```

3. システムテーブルでは、最大 IO スループットが約 98 MB/s に制御されています。

    ```sql
    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 97.94296646118164  |
    +--------------------+
    1 row in set (0.03 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 98.37584781646729  |
    +--------------------+
    1 row in set (0.04 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 98.06641292572021  |
    +--------------------+
    1 row in set (0.02 sec)
    ```

4. pidstat ツールでプロセスの最大 IO スループットを確認すると、約 131 MB/s です。

    ![Workload Group の IO 使用状況](/images/workload-management/use_wg_io_2.png)

:::tip 注意事項

1. システムテーブルの `LOCAL_SCAN_BYTES_PER_SECOND` は、プロセスレベルの集計値です。ファイルパスが 12 個設定されている場合、この値は各パスの IO の最大値です。各ファイルパスの IO スループットを詳しく確認するには、Grafana のモニタリングを参照してください。
2. オペレーティングシステムと Doris Page Cache が存在するため、Linux の IO 監視スクリプトで観測される IO は、通常、システムテーブルの値より小さくなります。

:::

### リモート IO のハード制限の効果を検証する {#verify-the-remote-io-hard-limit-effect}

BrokerLoad と S3Load は、大量データの一括取り込みによく使われます。Doris が複数のスレッドで HDFS/S3 からデータを並列に取得すると、外部ストレージに大きな負荷がかかり、他のジョブの安定性に影響します。リモート IO 帯域幅の上限を設定すると、データ取り込みが他の業務に及ぼす影響を抑えられます。

**テスト環境**：同じマシンに配置した FE 1 台と BE 1 台、16 コア、メモリ 64 GB。テストデータは S3 にアップロードした ClickBench データセットの 1000 万行です。

Schema 情報を表示します。

```sql
DESC FUNCTION s3 (
    "URI" = "https://bucketname/1kw.tsv",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "format" = "csv",
    "use_path_style" = "true"
);
```

**リモート読み取り IO を制限しない場合**

1. 同時実行数が単一のフルテーブルスキャンを実行します。

    ```sql
    -- Set to scan data only, do not return results
    SET dry_run_query = true;

    SELECT * FROM s3(
        "URI" = "https://bucketname/1kw.tsv",
        "s3.access_key" = "ak",
        "s3.secret_key" = "sk",
        "format" = "csv",
        "use_path_style" = "true"
    );
    ```

2. システムテーブルでは、リモート IO スループットは約 837 MB/s です。（実際のスループットは、BE と外部ストレージ間の帯域幅に左右されます。）

    ```sql
    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     837 |
    +---------+
    1 row in set (0.104 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     867 |
    +---------+
    1 row in set (0.070 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     867 |
    +---------+
    1 row in set (0.186 sec)
    ```

3. `sar -n DEV 1 3600` でマシンのネットワーク帯域幅を確認します（先頭の列は KB/s 単位の受信バイト数です）。マシンレベルの最大ネットワーク帯域幅は約 1033 MB/s です。

    ![Workload Group のリモート IO 使用状況](/images/workload-management/use_wg_rio_1.png)

**リモート読み取り IO を制限した場合**

1. リモート読み取り IO スループットを 100 MB/s に制限します。

    ```sql
    ALTER WORKLOAD GROUP normal PROPERTIES('remote_read_bytes_per_second' = '104857600');
    ```

2. 同時実行数が単一のフルテーブルスキャンを実行します。

    ```sql
    SET dry_run_query = true;

    SELECT * FROM s3(
        "URI" = "https://bucketname/1kw.tsv",
        "s3.access_key" = "ak",
        "s3.secret_key" = "sk",
        "format" = "csv",
        "use_path_style" = "true"
    );
    ```

3. システムテーブルでは、リモート読み取り IO スループットが約 100 MB/s に制御されています。（アルゴリズムの設計上、値は変動します。短時間のピークは正常です。）

    ```sql
    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |      56 |
    +---------+
    1 row in set (0.010 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     131 |
    +---------+
    1 row in set (0.009 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     111 |
    +---------+
    1 row in set (0.009 sec)
    ```

4. `sar -n DEV 1 3600` で NIC の受信トラフィックを確認します（先頭の列は秒間の受信データ量です）。最大値は約 207 MB/s となり、IO 制限が有効になっています。（sar コマンドが示すのはマシンレベルのトラフィックで、通常は Doris の統計値より大きくなります。）

    ![Workload Group のリモート IO 使用状況](/images/workload-management/use_wg_rio_2.png)

## FAQ {#faq}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

### Q：CPU のハード制限を設定しても有効にならない {#q-the-cpu-hard-limit-is-configured-but-does-not-take-effect}
1. **環境の初期化に失敗している**：CGroup V1 パス下の `/sys/fs/cgroup/cpu/doris/query/1/tasks` ファイルに、該当する Workload Group のスレッド ID が含まれているかを確認します（`top -H -b -n 1 -p pid` で取得できます）。また、`cpu.cfs_quota_us` の値が -1 かどうかを確認します（-1 はハード制限が有効でないことを意味します）。
2. **BE プロセスの CPU 使用量が設定値を超える**：Workload Group はクエリスレッドと、データ取り込み時の memtable flush スレッドを管理します。BE 内の他のコンポーネント（Compaction など）も CPU を消費するため、プロセスの CPU 使用量は通常、Workload Group の設定値より高くなります。テスト用の Workload Group を作成し、`information_schema.workload_group_resource_usage` でその Workload Group 自体の CPU 使用量を確認できます（バージョン 2.1.6 以降で対応）。
3. **`cpu_resource_limit` パラメータが設定されている**：`SHOW PROPERTY FOR jack LIKE 'cpu_resource_limit'` と `SHOW VARIABLES LIKE 'cpu_resource_limit'` を実行し、このパラメータが設定されているか確認します（デフォルト値の -1 は未設定を意味します）。このパラメータが設定されている場合、クエリは独立したスレッドプールを使用し、Workload Group の管理対象にはなりません。移行時は、ユーザーの `num_scanner_threads` を 1 に設定し、Workload Group を指定してから、`cpu_resource_limit` を -1 に変更することをバッチ単位で進めることを推奨します。安定するまで観察したうえで、次のバッチの移行を続けます。

### Q：デフォルトで Workload Group の数が 15 に制限されている {#q-the-default-workload-group-count-is-limited-to-15}
Workload Group はマシン単位のリソースを分割します。グループが多すぎると、各グループに割り当てられるリソースが少なくなります。業務上、さらに多くのグループが必要な場合は、クラスタを複数の BE セットに分け、各セットに異なる Workload Group を作成することを検討してください。FE 設定の `workload_group_max_num` を変更して、この制限を一時的に回避することもできます。

### Q：多数の Workload Group を設定すると「Resource temporarily unavailable」エラーが発生する {#q-after-configuring-many-workload-groups-the-error-resource-temporarily-unavailable-appears}
各 Workload Group はそれぞれ独立したスレッドプール群を持ちます。作成しすぎると、BE プロセスが起動しようとするスレッド数が、オペレーティングシステムで許可される上限を超える場合があります。対処するには、BE プロセスがより多くのスレッドを作成できるように、オペレーティングシステムの設定を変更します。
