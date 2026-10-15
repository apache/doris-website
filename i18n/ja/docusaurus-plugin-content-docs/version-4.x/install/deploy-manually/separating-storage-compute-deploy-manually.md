---
{
    "title": "ストレージとコンピュートを分離したクラスターの手動デプロイ",
    "language": "ja",
    "description": "FoundationDB、S3/HDFS、Meta Service、FE/BE のデプロイ手順と FAQ を含む、Linux 上での Doris ストレージとコンピュートを分離したクラスターの手動デプロイガイドです。",
    "keywords": [
        "Doris のストレージとコンピュートの分離デプロイ",
        "ストレージとコンピュートを分離したクラスターのインストール",
        "FoundationDB のデプロイ",
        "Doris クラウドデプロイ",
        "S3 ストレージの設定",
        "Meta Service のデプロイ"
    ]
}
---

ストレージとコンピュートを分離したクラスターのデプロイには、次の八つの手順があります。

1. **FoundationDB クラスターを準備する**: 既存の FoundationDB クラスターを使用するか、新しく作成します。

2. **S3 または HDFS サービスをデプロイする**: 既存の共有ストレージを使用するか、新しく構築します。

3. **Meta Service をデプロイする**: Doris クラスター用の Meta Service をデプロイします。

4. **データリサイクラープロセスをデプロイする**: Doris クラスター用の独立したデータリサイクラープロセスをデプロイします。この手順は任意です。

5. **FE Master ノードを起動する**: 最初の FE ノードを Master FE ノードとして起動します。

6. **FE Master クラスターを構築する**: FE Follower/Observer ノードを追加して FE クラスターを構成します。

7. **BE ノードを追加する**: BE ノードをクラスターに追加して登録します。

8. **Storage Vault を追加する**: 共有ストレージを使用して一つ以上の Storage Vault を作成します。

デプロイを開始する前に、適切なバージョンの Doris を[ダウンロード](https://doris.apache.org/download)できます。

## 前提条件

<!-- Knowledge type: Hardware and software requirements -->
<!-- Applicable scenario: Pre-deployment checks -->

| 種類 | 要件 |
|------|------|
| **オペレーティングシステム** | Linux（CentOS 7+、Ubuntu 20.04+） |
| **JDK** | OpenJDK 17（JAVA_HOME の設定が必要） |
| **FoundationDB** | 7.1.x 系 |
| **ネットワーク** | ノード間でポートに到達できること（デフォルト: FE 8030、BE 9050、Meta Service 5000） |
| **ディスク** | SSD を推奨（特に FDB のデータディレクトリ） |

## ステップ 1: FoundationDB を準備する

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

このセクションでは、`fdb_vars.sh` と `fdb_ctl.sh` スクリプトを使用して FDB（FoundationDB）サービスを設定、デプロイ、起動する手順を説明します。[Doris ツール](http://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-3.0.2-tools.tar.gz)をダウンロードすると、`fdb_vars.sh` と `fdb_ctl.sh` を `fdb` ディレクトリから取得できます。

:::tip
Doris はデフォルトで FDB 7.1.x 系に依存します。FDB がすでにインストールされている場合は、バージョンが 7.1.x 系であることを確認してください。一致しない場合、Meta Service は起動に失敗します。
:::

### マシン要件

通常、二重レプリカと単一マシンの障害耐性を備えた FoundationDB クラスターを構成するには、SSD を搭載したマシンが少なくとも三台必要です。テスト環境や開発環境では、一台のマシンでも FoundationDB を構築できます。

### fdb_vars.sh スクリプトの設定

`fdb_vars.sh` スクリプトを設定する際は、次のパラメータを指定する必要があります。

   | パラメータ         | 説明                                  | 型                                       | 例                                                      | 備考                                                        |
   | ---------------- | -------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
   | DATA_DIRS        | FoundationDB が使用するデータディレクトリ    | 絶対パスのカンマ区切りリスト   | /mnt/foundationdb/data1,/mnt/foundationdb/data2,/mnt/foundationdb/data3 | スクリプトの実行前にディレクトリが存在することを確認してください。本番環境では、SSD と専用ディレクトリを推奨します。 |
   | FDB_CLUSTER_IPS  | クラスターの IP アドレス                              | IP アドレスをカンマで区切った文字列   | 172.200.0.2,172.200.0.3,172.200.0.4                          | 本番クラスターには少なくとも 3 つの IP アドレスを指定してください。最初の IP アドレスがコーディネーターとして使用されます。高可用性を確保するため、マシンを異なるラックに配置してください。 |
   | FDB_HOME         | FoundationDB のホームディレクトリ              | 絶対パス                           | /fdbhome                                                     | デフォルトのパスは /fdbhome です。絶対パスを指定してください。 |
   | FDB_CLUSTER_ID   | クラスター ID                               | 文字列                                   | SAQESzbh                                                     | 各クラスターの ID は一意である必要があります。mktemp -u XXXXXXXX で生成できます。 |
   | FDB_CLUSTER_DESC | FDB クラスターの説明           | 文字列                                   | dorisfdb                                                     | デプロイ内容が分かる名前への変更を推奨します。 |


   必要に応じて、次のカスタムパラメータも指定できます。

   | パラメータ        | 説明                                          | 型    | 例            | 備考                                                                       |
   | --------------- | ---------------------------------------------------- | ------- | ------------------ | --------------------------------------------------------------------------- |
   | MEMORY_LIMIT_GB | FDB プロセスのメモリ上限（GB）          | 整数 | MEMORY_LIMIT_GB=16 | 使用可能なメモリと FDB プロセスの要件に応じて調整してください。 |
   | CPU_CORES_LIMIT | FDB プロセスの CPU コア数の上限               | 整数 | CPU_CORES_LIMIT=8  | 使用可能な CPU コア数と FDB プロセスの要件に応じて調整してください。 |

### FDB クラスターのデプロイ

`fdb_vars.sh` で環境を設定した後、各ノードで `fdb_ctl.sh` スクリプトを使用して FDB クラスターをデプロイします。

```bash
./fdb_ctl.sh deploy
```

### FDB サービスの起動

FDB クラスターをデプロイしたら、`fdb_ctl.sh` スクリプトで FDB サービスを起動します。

   ```bash
   ./fdb_ctl.sh start
   ```

   上記のコマンドは FDB サービスを起動し、クラスターを稼働状態にして、FDB クラスターの接続文字列を取得します。この文字列は後で Meta Service の設定に使用できます。

   :::warning
   fdb_ctl.sh スクリプトの clean コマンドは FDB のすべてのメタデータを削除し、データ損失につながる可能性があります。本番環境では絶対に使用しないでください。
   :::

## ステップ 2: S3 または HDFS サービスをインストールする（任意）

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

Doris のストレージとコンピュートを分離したモードでは、データの保存に S3 または HDFS サービスを使用します。すでにサービスがある場合は、そのまま利用できます。
ない場合は、以下の MinIO の簡単なデプロイ手順を参照してください。

1. MinIO の[ダウンロードページ](https://min.io/download?license=agpl&platform=linux)で適切なバージョンとオペレーティングシステムを選択し、対応する Server と Client のバイナリまたはインストールパッケージをダウンロードします。
2. MinIO Server を起動します。

   ```bash
   export MINIO_REGION_NAME=us-east-1
   export MINIO_ROOT_USER=minio # In older versions, this setting is MINIO_ACCESS_KEY=minio
   export MINIO_ROOT_PASSWORD=minioadmin # In older versions, this setting is MINIO_SECRET_KEY=minioadmin
   nohup ./minio server /mnt/data 2>&1 &
   ```

3. MinIO Client を設定します。

   ```bash
   # If you installed the client from an installation package, the client is named mcli. If you downloaded the client binary directly, it is named mc.
   ./mc config host add myminio http://127.0.0.1:9000 minio minioadmin
   ```

4. バケットを作成します。

   ```bash
   ./mc mb myminio/doris
   ```

5. 動作を確認します。

   ```bash
   # Upload a file
   ./mc mv test_file myminio/doris
   # View the file
   ./mc ls myminio/doris
   ```

## ステップ 3: Meta Service をデプロイする

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Deployment and installation -->

1. 設定

   `./conf/doris_cloud.conf` ファイルでは、主に次の二つのパラメータを変更します。

   - `brpc_listen_port`: Meta Service の待ち受けポートです。デフォルトは 5000 です。
   - `fdb_cluster`: FoundationDB クラスターの接続情報で、FoundationDB のデプロイ時に取得します。（Doris が提供する `fdb_ctl.sh` スクリプトで FDB をデプロイした場合、この値は `$FDB_HOME/conf/fdb.cluster` ファイルにあります。）

   設定例:

   ```shell
   brpc_listen_port = 5000
   fdb_cluster = xxx:yyy@127.0.0.1:4500
   ```

   注: `fdb_cluster` の値は、FoundationDB マシン上の `/etc/foundationdb/fdb.cluster` ファイルの内容と一致させてください。（Doris が提供する `fdb_ctl.sh` スクリプトで FDB をデプロイした場合、この値は `$FDB_HOME/conf/fdb.cluster` ファイルにあります。）

   次の例では、ファイルの最後の行が `fdb_cluster` フィールドに設定する値です。このフィールドは `doris_cloud.conf` にあります。

   ```shell
   cat /etc/foundationdb/fdb.cluster
   
   DO NOT EDIT!
   This file is auto-generated, it is not to be edited by hand.
   cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
   ```

2. 起動と停止

   起動前に、環境変数 `JAVA_HOME` が正しく設定され、OpenJDK 17 を指していることを確認してください。その後、`ms` ディレクトリに移動します。

   起動コマンドは次のとおりです。

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --daemon
   ```

   起動スクリプトの戻り値が 0 なら起動成功、それ以外なら起動失敗です。起動に成功すると、標準出力の最後の行に「doris_cloud start successfully」と表示されます。

   停止コマンドは次のとおりです。

   ```shell
   bin/stop.sh
   ```

   本番環境では、Meta Service ノードを少なくとも 3 台配置してください。

3. 複数の設定ファイルの使用（任意、4.0.8+）

   バージョン 4.0.8 以降、`bin/start.sh` は環境変数 `CONF_FILES` を通じて複数の設定ファイルを受け付けます。これにより、共通設定とノード固有の設定を分離しやすくなります。

   ```shell
   export CONF_FILES="common.conf,doris_cloud.conf"
   bin/start.sh --daemon
   ```

   規則は次のとおりです。

   - 複数のファイルはカンマで区切ります。**左から右**の順に読み込まれます。
   - 相対パスは `${DORIS_HOME}/conf/` を基準に解決されます。絶対パスも使用できます。ワイルドカードもサポートされます（例: `conf.d/*.conf`）。
   - 同じ変数が複数回定義されている場合は、**最初**の定義が優先され、後続のファイルでは上書きされません。
   - シェルですでにエクスポートされている環境変数は最優先され、設定ファイルによって上書きされることはありません。
   - 存在しないファイルはスキップされ、起動エラーにはなりません。
   - `CONF_FILES` を指定しない場合、従来のバージョンと同じ動作になり、`doris_cloud.conf` のみを読み込みます。

   :::info 注

   この仕組みが扱うのは、設定ファイルに `KEY=VALUE` 形式で記述された**大文字の環境変数**（例: `JAVA_HOME`）だけです。Meta Service 自体の設定項目は引き続き `doris_cloud.conf` から読み込まれます。

   :::



## ステップ 4: データリサイクラーの独立デプロイ（任意）

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

:::tip

Meta Service 自体は、メタデータ管理とデータのリサイクルの両方の機能を提供します。これらの機能は別々にデプロイできます。データリサイクラーを別途デプロイする場合は、次の手順に従ってください。

:::

1. 新しい作業ディレクトリ（例: `recycler`）を作成し、`ms` ディレクトリの内容をコピーします。

   ```shell
   cp -r ms recycler
   ```

2. 新しいディレクトリの設定ファイルで、BRPC の待ち受けポート `brpc_listen_port` と `fdb_cluster` の値を変更します。

   データリサイクラーを起動します。
   
   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --recycler --daemon
   ```

   メタデータ操作機能のみを起動します。

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --meta-service --daemon
   ```

## ステップ 5: FE Master ノードを起動する

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Deployment and installation -->

1. fe.conf ファイルを設定する

   `fe.conf` ファイルでは、次の主要なパラメータを設定します。

   - `deploy_mode`
     - 説明: Doris の起動モードを指定します。
     - 形式: `cloud` はストレージとコンピュートを分離したモードを示し、それ以外の値はストレージとコンピュートの統合モードを示します。
     - 例: `cloud`
   - `cluster_id`
     - 説明: ストレージとコンピュートを分離したアーキテクチャーにおけるクラスターの一意の識別子です。クラスターごとに異なる `cluster_id` 値を使用する必要があります。
     - 形式: int
     - 例: シェルスクリプト `echo $(($((RANDOM << 15)) | $RANDOM))` を使用してランダムな ID を生成できます。
     - 注: クラスターごとに異なる `cluster_id` 値を使用する必要があります。
   - `meta_service_endpoint`
     - 説明: Meta Service のアドレスとポートです。
     - 形式: `IP:Port`
     - 例: `127.0.0.1:5000`。複数の Meta Service エンドポイントをカンマで区切って設定できます。

2. FE Master ノードを起動する

   起動コマンド:

   ```bash
   bin/start_fe.sh --daemon
   ```

   最初の FE プロセスはクラスターを初期化し、FOLLOWER ロールで動作します。MySQL クライアントで FE に接続して `show frontends` を実行し、起動した FE が Master であることを確認してください。

## ステップ 6: FE Follower/Observer ノードを登録する

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

ほかのノードでは、同じ手順で設定ファイルを変更してから起動します。その後、MySQL クライアントで Master ロールの FE に接続し、次の SQL コマンドで FE ノードを追加します。

```sql
ALTER SYSTEM ADD FOLLOWER "host:port";
```


`host:port` を FE ノードの実際のアドレスと edit-log ポートに置き換えてください。詳細は [ADD FOLLOWER](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-FOLLOWER) と [ADD OBSERVER](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-OBSERVER) を参照してください。

本番環境では、最初の FE を含め、FOLLOWER ロールの FE ノードの総数を奇数にしてください。通常は三台の FOLLOWER で十分です。Observer ロールの FE ノードは任意の台数にできます。

## ステップ 7: BE ノードを追加する

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

クラスターに Backend ノードを追加するには、各 Backend で次の手順を実行します。

1. be.conf を設定する

   `be.conf` ファイルでは、次の主要なパラメータを設定します。
    - deploy_mode
      - 説明: Doris の起動モードを指定します。
      - 形式: `cloud` はストレージとコンピュートを分離したモードを示し、それ以外の値はストレージとコンピュートの統合モードを示します。
      - 例: cloud
    - file_cache_path
      - 説明: ファイルキャッシュに使用するディスクのパスなどのパラメータです。ディスクごとに一つの要素を持つ配列で表します。`path` はディスクのパスを指定し、`total_size` はキャッシュサイズを制限します。-1 または 0 はディスク領域全体を使用することを意味します。
      - 形式: [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
      - 例: [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
      - デフォルト: [{"path":"${DORIS_HOME}/file_cache"}]

2. BE プロセスを起動する

   次のコマンドで Backend を起動します。

   ```bash
   bin/start_be.sh --daemon
   ```

3. BE をクラスターに追加する

   MySQL クライアントでいずれかの FE ノードに接続します。

   ```sql
   ALTER SYSTEM ADD BACKEND "<ip>:<heartbeat_service_port>" [PROPERTIES properties];
   ```

   `<ip>` を新しい Backend の IP アドレスに、`<heartbeat_service_port>` を設定した heartbeat service ポート（デフォルトは 9050）に置き換えてください。

   PROPERTIES を使用して、BE が所属するコンピュートグループを設定できます。

   詳しい使用方法については、[ADD BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) と [REMOVE BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND) を参照してください。

4. BE の状態を確認する

   Backend のログファイル（`be.log`）を調べ、正常に起動してクラスターに参加したことを確認します。

   次の SQL コマンドでも Backend の状態を確認できます。

   ```sql
   SHOW BACKENDS;
   ```

   クラスター内のすべての Backend と現在の状態が表示されます。

## ステップ 8: Storage Vault を追加する

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

Storage Vault は、Doris のストレージとコンピュートを分離したアーキテクチャーの重要なコンポーネントです。データを保存する共有ストレージ層を表します。HDFS または S3 互換のオブジェクトストレージを使用して、一つ以上の Storage Vault を作成できます。Storage Vault の一つをデフォルトに設定できます。システムテーブルと Storage Vault を指定しないテーブルは、このデフォルトの Storage Vault に保存されます。デフォルトの Storage Vault は削除できません。Doris クラスター用の Storage Vault を作成する方法を以下に示します。

1. HDFS Storage Vault を作成する

   SQL を使用して Storage Vault を作成するには、MySQL クライアントで Doris クラスターに接続します。

   ```sql
   CREATE STORAGE VAULT IF_NOT_EXISTS hdfs_vault
       PROPERTIES (
       "type"="hdfs",
       "fs.defaultFS"="hdfs://127.0.0.1:8020"
   );
   ```

2. S3 Storage Vault を作成する

   S3 互換のオブジェクトストレージを使用して Storage Vault を作成するには、次の手順に従います。

   - MySQL クライアントで Doris クラスターに接続します。
   - 次の SQL コマンドを実行して S3 Storage Vault を作成します。

   ```sql
   CREATE STORAGE VAULT IF_NOT_EXISTS s3_vault
       PROPERTIES (
       "type"="S3",
       "s3.endpoint"="https://s3.us-east-1.amazonaws.com",
       "s3.access_key" = "ak",
       "s3.secret_key" = "sk",
       "s3.region" = "us-east-1",
       "s3.root.path" = "ssb_sf1_p2_s3",
       "s3.bucket" = "doris-build-1308700295",
       "provider" = "S3"
   );
   ```

   ほかのオブジェクトストレージサービスで Storage Vault を作成する場合は、[Storage Vault の作成](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)を参照してください。

3. デフォルトの Storage Vault を設定する

   次の SQL 文でデフォルトの Storage Vault を設定します。

   ```sql
   SET <storage_vault_name> AS DEFAULT STORAGE VAULT
   ```

## FAQ

### Q: 「FDB version mismatch」エラーで Meta Service が起動しない場合は？

Doris はデフォルトで FDB 7.1.x 系に依存します。`fdbserver --version` を実行して、インストールされている FoundationDB のバージョンを確認してください。バージョンが一致しない場合は、正しいバージョンの FDB を再インストールしてください。

### Q: FE ノードが正常に起動して Master になったことを確認するには？

次のコマンドを実行して確認します。
```bash
mysql -h <fe_host> -P 9030 -u root -e "SHOW FRONTENDS;"
```
出力で該当する FE の `Role` 列が `MASTER` であることを確認してください。

### Q: 起動後に BE ノードが「Starting」状態のままになる場合は、どう調査しますか？

次の手順で調査してください。
1. BE のログ `be.log` でエラーメッセージを確認します。
2. `meta_service_endpoint` が正しく設定され、Meta Service に到達できることを確認します。
3. `deploy_mode` が `cloud` に設定されていることを確認します。
4. `SHOW BACKENDS;` を実行して、詳細なエラーの説明を確認します。

### Q: Storage Vault が正常に作成されたことを確認するには？

次の SQL で確認します。
```sql
SHOW STORAGE VAULT;
```
作成した Vault の状態が `OK` であることを確認してください。

### Q: BE ノードを追加すると「backend already exists」エラーが返される場合は？

BE ノードがすでに存在するか、以前のレコードが完全に削除されていない可能性があります。次のコマンドで古いレコードを削除してから、再試行してください。
```sql
ALTER SYSTEM DROP BACKEND "<ip>:<port>";
```

## トラブルシューティング

### FE が Meta Service に接続できない

- **症状**: FE のログに「connect to meta service failed」と表示されます。
- **調査手順**:
  1. Meta Service プロセスが稼働していることを確認します: `ps aux | grep doris_cloud`。
  2. `meta_service_endpoint` の形式が正しいことを確認します（`IP:Port` である必要があります）。
  3. ノード間でネットワーク接続が可能であることを確認します（デフォルトのポートは 5000）。

### 「Too many open files」エラーで BE が起動しない

- **調査手順**:
  1. `ulimit -n` を実行して現在の上限を確認します。
  2. `max_open_files = 65535` を `be.conf` に追加します。
  3. または、`ulimit -n 65535` を実行してから BE を再起動します。

### FDB クラスターが起動しない

- **調査手順**:
  1. `DATA_DIRS` で指定したディレクトリが存在し、適切な権限があるか確認します。この項目は `fdb_vars.sh` 内で設定します。
  2. `FDB_CLUSTER_IPS` がすべてのノードで同じように設定されていることを確認します。
  3. `/var/log/foundationdb/fdbserver.log` の FDB ログを確認します。

## 注意事項

- FE と BE の `meta_service_endpoint` には、メタデータ操作を担当する Meta Service プロセスのみを指定してください。
- データリサイクラープロセスを `meta_service_endpoint` に指定しないでください。
