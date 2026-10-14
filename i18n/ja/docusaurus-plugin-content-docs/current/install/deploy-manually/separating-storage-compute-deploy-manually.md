---
{
    "title": "ストレージ・コンピュート分離型クラスターの手動デプロイ",
    "language": "ja",
    "description": "FoundationDB、S3/HDFS、Meta Service、FE/BE のデプロイ手順と FAQ を含む、Linux 上での Doris ストレージ・コンピュート分離型クラスターの手動デプロイガイドです。",
    "keywords": [
        "Doris ストレージ・コンピュート分離型デプロイ",
        "ストレージ・コンピュート分離型クラスターのインストール",
        "FoundationDB のデプロイ",
        "Doris クラウドデプロイ",
        "S3 ストレージの設定",
        "Meta Service のデプロイ"
    ]
}
---

ストレージ・コンピュート分離型クラスターのデプロイは、次の八ステップで行います。

1. **FoundationDB クラスターを準備する**：既存の FoundationDB クラスターを使用するか、新しく作成します。

2. **S3 または HDFS サービスをデプロイする**：既存の共有ストレージを使用するか、新しく構築します。

3. **Meta Service をデプロイする**：Doris クラスター用の Meta Service をデプロイします。

4. **データリサイクラープロセスをデプロイする**：Doris クラスター用に独立したデータリサイクラープロセスをデプロイします。このステップは任意です。

5. **FE Master ノードを起動する**：最初の FE ノードを Master FE ノードとして起動します。

6. **FE Master クラスターを構築する**：FE Follower/Observer ノードを追加して FE クラスターを構成します。

7. **BE ノードを追加する**：BE ノードをクラスターに追加して登録します。

8. **ストレージボールトを追加する**：共有ストレージを使用して、一つ以上のストレージボールトを作成します。

デプロイを始める前に、適切なバージョンの Doris を[ダウンロード](https://doris.apache.org/download)してください。

## 前提条件

<!-- Knowledge type: Hardware and software requirements -->
<!-- Applicable scenario: Pre-deployment checks -->

| 種類 | 要件 |
|------|------|
| **オペレーティングシステム** | Linux（CentOS 7 以降、Ubuntu 20.04 以降） |
| **JDK** | OpenJDK 17（JAVA_HOME の設定が必要） |
| **FoundationDB** | バージョン 7.1.x 系 |
| **ネットワーク** | ノード間でポートに到達できること（デフォルト：FE 8030、BE 9050、Meta Service 5000） |
| **ディスク** | SSD を推奨（特に FDB のデータディレクトリ用） |

## ステップ 1：FoundationDB を準備する

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

このセクションでは、`fdb_vars.sh` と `fdb_ctl.sh` スクリプトを使用して FDB（FoundationDB）サービスを設定、デプロイ、起動する手順を説明します。[Doris ツール](http://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-3.0.2-tools.tar.gz)をダウンロードすると、`fdb_vars.sh` と `fdb_ctl.sh` を `fdb` ディレクトリから取得できます。

:::tip
Doris はデフォルトで FDB 7.1.x 系に依存します。FDB がすでにインストールされている場合は、バージョンが 7.1.x 系であることを確認してください。異なる場合、Meta Service は起動に失敗します。
:::

### マシン要件

通常、二重レプリカと単一マシンの障害耐性を備えた FoundationDB クラスターを構成するには、SSD を搭載したマシンが少なくとも三台必要です。テスト環境や開発環境では、一台のマシンでも FoundationDB を構築できます。

### fdb_vars.sh スクリプトの設定

`fdb_vars.sh` スクリプトを設定する際は、次のパラメータを指定する必要があります。

   | パラメータ         | 説明                                  | 型                                       | 例                                                      | 注意事項                                                        |
   | ---------------- | -------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
   | DATA_DIRS        | FoundationDB が使用するデータディレクトリ    | 絶対パスのカンマ区切りリスト   | /mnt/foundationdb/data1,/mnt/foundationdb/data2,/mnt/foundationdb/data3 | スクリプトを実行する前に、ディレクトリが存在することを確認してください。本番環境では、SSD と専用ディレクトリを推奨します。 |
   | FDB_CLUSTER_IPS  | クラスターの IP アドレス                              | IP アドレスをカンマで区切った文字列   | 172.200.0.2,172.200.0.3,172.200.0.4                          | 本番クラスターには少なくとも 3 つの IP アドレスを設定してください。最初の IP アドレスがコーディネーターとして使用されます。高可用性のため、マシンを異なるラックに配置してください。 |
   | FDB_HOME         | FoundationDB のホームディレクトリ              | 絶対パス                           | /fdbhome                                                     | デフォルトのパスは /fdbhome です。絶対パスを指定してください。 |
   | FDB_CLUSTER_ID   | クラスター ID                               | 文字列                                   | SAQESzbh                                                     | クラスターごとに一意の ID が必要です。mktemp -u XXXXXXXX を使用して生成できます。 |
   | FDB_CLUSTER_DESC | FDB クラスターの説明           | 文字列                                   | dorisfdb                                                     | デプロイ内容がわかる名前に変更することを推奨します。 |


   次のカスタムパラメータは任意で指定できます。

   | パラメータ        | 説明                                          | 型    | 例            | 注意事項                                                                       |
   | --------------- | ---------------------------------------------------- | ------- | ------------------ | --------------------------------------------------------------------------- |
   | MEMORY_LIMIT_GB | FDB プロセスのメモリ上限（GB）          | 整数 | MEMORY_LIMIT_GB=16 | 利用可能なメモリと FDB プロセスの要件に応じて調整してください。 |
   | CPU_CORES_LIMIT | FDB プロセスの CPU コア数の上限               | 整数 | CPU_CORES_LIMIT=8  | 利用可能な CPU コア数と FDB プロセスの要件に応じて設定してください。 |

### FDB クラスターのデプロイ

`fdb_vars.sh` で環境を設定した後、各ノードで `fdb_ctl.sh` スクリプトを使用して FDB クラスターをデプロイします。

```bash
./fdb_ctl.sh deploy
```

### FDB サービスの起動

FDB クラスターのデプロイ後、`fdb_ctl.sh` スクリプトを使用して FDB サービスを起動します。

   ```bash
   ./fdb_ctl.sh start
   ```

   上記のコマンドは FDB サービスを起動してクラスターをオンラインにし、FDB クラスターの接続文字列を取得します。この文字列は後で Meta Service の設定に使用できます。

   :::warning
   fdb_ctl.sh スクリプトの clean コマンドは FDB のメタデータをすべて削除し、データ損失につながる可能性があります。本番環境では絶対に使用しないでください。
   :::

## ステップ 2：S3 または HDFS サービスをインストールする（任意）

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

Doris のストレージ・コンピュート分離モードでは、データの保存に S3 または HDFS サービスを使用します。これらのサービスがすでにある場合は、そのまま使用できます。
ない場合は、以下の MinIO の簡単なデプロイ手順を参照してください。

1. MinIO の[ダウンロードページ](https://min.io/download?license=agpl&platform=linux)で、適切なバージョンとオペレーティングシステムを選び、対応する Server と Client のバイナリまたはインストールパッケージをダウンロードします。
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

## ステップ 3：Meta Service をデプロイする

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Deployment and installation -->

1. 設定

   `./conf/doris_cloud.conf` ファイルでは、主に次の二つのパラメータを変更する必要があります。

   - `brpc_listen_port`：Meta Service の待ち受けポート。デフォルトは 5000 です。
   - `fdb_cluster`：FoundationDB クラスターの接続情報。FoundationDB のデプロイ時に取得します。（Doris が提供する `fdb_ctl.sh` スクリプトで FDB をデプロイした場合、この値は `$FDB_HOME/conf/fdb.cluster` ファイルで確認できます。）

   設定例：

   ```shell
   brpc_listen_port = 5000
   fdb_cluster = xxx:yyy@127.0.0.1:4500
   ```

   注意：`fdb_cluster` の値は、FoundationDB マシン上の `/etc/foundationdb/fdb.cluster` ファイルの内容と一致させてください。（Doris が提供する `fdb_ctl.sh` スクリプトで FDB をデプロイした場合、この値は `$FDB_HOME/conf/fdb.cluster` ファイルで確認できます。）

   次の例では、ファイルの最終行が `fdb_cluster` フィールドに指定する値です。このフィールドは `doris_cloud.conf` にあります。

   ```shell
   cat /etc/foundationdb/fdb.cluster
   
   DO NOT EDIT!
   This file is auto-generated, it is not to be edited by hand.
   cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
   ```

2. 起動と停止

   起動する前に、`JAVA_HOME` 環境変数が正しく設定され、OpenJDK 17 を指していることを確認します。その後、`ms` ディレクトリに移動します。

   起動コマンドは次のとおりです。

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --daemon
   ```

   起動スクリプトの戻り値が 0 なら起動成功、それ以外なら起動失敗です。起動に成功すると、標準出力の最終行に「doris_cloud start successfully」と表示されます。

   停止コマンドは次のとおりです。

   ```shell
   bin/stop.sh
   ```

   本番環境では、Meta Service ノードを少なくとも 3 つ用意してください。

3. 複数の設定ファイルの使用（任意、4.0.8 以降）

   バージョン 4.0.8 以降、`bin/start.sh` は `CONF_FILES` 環境変数によって複数の設定ファイルを受け付けます。これにより、共通設定とノード固有の設定を分離しやすくなります。

   ```shell
   export CONF_FILES="common.conf,doris_cloud.conf"
   bin/start.sh --daemon
   ```

   適用ルールは次のとおりです。

   - 複数のファイルはカンマで区切ります。**左から右**の順に読み込まれます。
   - 相対パスは `${DORIS_HOME}/conf/` を基準に解決されます。絶対パスも使用できます。ワイルドカードにも対応します（例：`conf.d/*.conf`）。
   - 同じ変数が複数回定義された場合は、**最初**の定義が優先されます。後続のファイルで上書きされません。
   - シェルですでにエクスポートされている環境変数は最優先され、設定ファイルによって上書きされません。
   - 存在しないファイルはスキップされ、起動失敗の原因にはなりません。
   - `CONF_FILES` を指定しない場合は、以前のバージョンと同様に `doris_cloud.conf` のみが読み込まれます。

   :::info Note

   この仕組みが扱うのは、設定ファイル内で `KEY=VALUE` の形式で記述された**大文字の環境変数**（例：`JAVA_HOME`）のみです。Meta Service 自体の設定項目は、引き続き `doris_cloud.conf` から読み込まれます。

   :::



## ステップ 4：データリサイクラーの独立したデプロイ（任意）

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

:::tip

Meta Service 自体には、メタデータ管理とデータリサイクルの両方の機能があります。これらの機能は別々にデプロイできます。データリサイクラーを個別にデプロイする必要がある場合は、次の手順に従ってください。

:::

1. 新しい作業ディレクトリ（例：`recycler`）を作成し、`ms` ディレクトリの内容をコピーします。

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

## ステップ 5：FE Master ノードを起動する

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Deployment and installation -->

1. fe.conf ファイルを設定する

   `fe.conf` ファイルでは、次の主要パラメータを設定する必要があります。

   - `deploy_mode`
     - 説明：Doris の起動モードを指定します。
     - 形式：`cloud` はストレージ・コンピュート分離モード、それ以外の値はストレージ・コンピュート一体型モードを示します。
     - 例：`cloud`
   - `cluster_id`
     - 説明：ストレージ・コンピュート分離型アーキテクチャにおけるクラスターの一意の識別子です。クラスターごとに異なる `cluster_id` の値を使用する必要があります。
     - 形式：int
     - 例：シェルスクリプト `echo $(($((RANDOM << 15)) | $RANDOM))` を使用してランダムな ID を生成できます。
     - 注意：クラスターごとに異なる `cluster_id` の値を使用する必要があります。
   - `meta_service_endpoint`
     - 説明：Meta Service のアドレスとポートです。
     - 形式：`IP:Port`
     - 例：`127.0.0.1:5000`。複数の Meta Service エンドポイントをカンマで区切って設定できます。

2. FE Master ノードを起動する

   起動コマンド：

   ```bash
   bin/start_fe.sh --daemon
   ```

   最初の FE プロセスはクラスターを初期化し、FOLLOWER ロールとして動作します。MySQL クライアントで FE に接続して `show frontends` を実行し、起動した FE が master であることを確認してください。

## ステップ 6：FE Follower/Observer ノードを登録する

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

ほかのノードでは、同じ手順で設定ファイルを変更して起動します。次に、MySQL クライアントで Master ロールの FE に接続し、以下の SQL コマンドで追加の FE ノードを登録します。

```sql
ALTER SYSTEM ADD FOLLOWER "host:port";
```


`host:port` を FE ノードの実際のアドレスと edit-log ポートに置き換えてください。詳細は、[ADD FOLLOWER](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-FOLLOWER) と [ADD OBSERVER](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-OBSERVER) を参照してください。

本番環境では、最初の FE を含め、FOLLOWER ロールの FE ノードの総数を奇数にしてください。通常は三つの FOLLOWER で十分です。Observer ロールの FE ノード数に制限はありません。

## ステップ 7：BE ノードを追加する

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

Backend ノードをクラスターに追加するには、各 Backend で次の手順を実行します。

1. be.conf を設定する

   `be.conf` ファイルでは、次の主要パラメータを設定する必要があります。
    - deploy_mode
      - 説明：Doris の起動モードを指定します。
      - 形式：`cloud` はストレージ・コンピュート分離モード、それ以外の値はストレージ・コンピュート一体型モードを示します。
      - 例：cloud
    - file_cache_path
      - 説明：ファイルキャッシュに使用するディスクパスとその他のパラメータです。ディスクごとに一つの要素を持つ配列で指定します。`path` はディスクパスを指定し、`total_size` はキャッシュサイズを制限します。-1 または 0 はディスク領域全体を使用することを意味します。
      - 形式：[{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
      - 例：[{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
      - デフォルト：[{"path":"${DORIS_HOME}/file_cache"}]

2. BE プロセスを起動する

   次のコマンドで Backend を起動します。

   ```bash
   bin/start_be.sh --daemon
   ```

3. BE をクラスターに追加する

   MySQL クライアントで任意の FE ノードに接続します。

   ```sql
   ALTER SYSTEM ADD BACKEND "<ip>:<heartbeat_service_port>" [PROPERTIES properties];
   ```

   `<ip>` を新しい Backend の IP アドレスに、`<heartbeat_service_port>` を設定したハートビートサービスポート（デフォルトは 9050）に置き換えてください。

   PROPERTIES を使用すると、BE が所属するコンピュートグループを設定できます。

   詳しい使用方法は、[ADD BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) と [REMOVE BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND) を参照してください。

4. BE の状態を確認する

   Backend のログファイル（`be.log`）を確認し、正常に起動してクラスターに参加していることを確かめます。

   次の SQL コマンドでも Backend の状態を確認できます。

   ```sql
   SHOW BACKENDS;
   ```

   クラスター内のすべての Backend と現在の状態が表示されます。

## ステップ 8：ストレージボールトを追加する

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

ストレージボールトは、Doris のストレージ・コンピュート分離型アーキテクチャの重要なコンポーネントです。データを保存する共有ストレージレイヤーを表します。HDFS または S3 互換のオブジェクトストレージを使用して、一つ以上のストレージボールトを作成できます。そのうち 一つをデフォルトのストレージボールトとして設定できます。システムテーブルと、ストレージボールトを指定していないテーブルは、このデフォルトのストレージボールトに保存されます。デフォルトのストレージボールトは削除できません。以下では、Doris クラスター用のストレージボールトを作成する方法を説明します。

1. HDFS ストレージボールトを作成する

   SQL でストレージボールトを作成するには、MySQL クライアントで Doris クラスターに接続します。

   ```sql
   CREATE STORAGE VAULT IF_NOT_EXISTS hdfs_vault
       PROPERTIES (
       "type"="hdfs",
       "fs.defaultFS"="hdfs://127.0.0.1:8020"
   );
   ```

2. S3 ストレージボールトを作成する

   S3 互換のオブジェクトストレージを使用してストレージボールトを作成するには、次の手順に従います。

   - MySQL クライアントで Doris クラスターに接続します。
   - 次の SQL コマンドを実行して S3 ストレージボールトを作成します。

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

   ほかのオブジェクトストレージサービスでストレージボールトを作成する場合は、[ストレージボールトの作成](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)を参照してください。

3. デフォルトのストレージボールトを設定する

   次の SQL ステートメントでデフォルトのストレージボールトを設定します。

   ```sql
   SET <storage_vault_name> AS DEFAULT STORAGE VAULT
   ```

## よくある質問

### Q：Meta Service が「FDB version mismatch」エラーで起動しない場合は？

Doris はデフォルトで FDB 7.1.x 系に依存します。`fdbserver --version` を実行して、インストールされている FoundationDB のバージョンを確認してください。バージョンが一致しない場合は、正しいバージョンの FDB を再インストールします。

### Q：FE ノードが正常に起動して Master になったことを確認するには？

次のコマンドを実行して確認します。
```bash
mysql -h <fe_host> -P 9030 -u root -e "SHOW FRONTENDS;"
```
出力で該当する FE の `Role` 列が `MASTER` であるかを確認します。

### Q：起動後も「Starting」状態のままの BE ノードは、どのように調査すればよいですか？

次の手順で調査します。
1. BE のログ `be.log` にエラーメッセージがないか確認します。
2. `meta_service_endpoint` が正しく設定され、Meta Service に到達できることを確認します。
3. `deploy_mode` が `cloud` に設定されていることを確認します。
4. `SHOW BACKENDS;` を実行して詳細なエラーの説明を確認します。

### Q：ストレージボールトが正常に作成されたことを確認するには？

次の SQL を実行して確認します。
```sql
SHOW STORAGE VAULT;
```
作成したボールトの状態が `OK` であることを確認します。

### Q：BE ノードの追加時に「backend already exists」エラーが返された場合は？

その BE ノードがすでに存在するか、以前のレコードが完全に削除されていない可能性があります。次のコマンドで古いレコードを削除してから、再試行します。
```sql
ALTER SYSTEM DROP BACKEND "<ip>:<port>";
```

## トラブルシューティング

### FE が Meta Service に接続できない

- **症状**：FE のログに「connect to meta service failed」と表示されます。
- **調査手順**：
  1. Meta Service のプロセスが稼働していることを確認します：`ps aux | grep doris_cloud`。
  2. `meta_service_endpoint` の形式が正しいことを確認します（`IP:Port` 形式で指定します）。
  3. ノード間のネットワークが到達可能であることを確認します（デフォルトのポートは 5000）。

### BE が「Too many open files」エラーで起動しない

- **調査手順**：
  1. `ulimit -n` を実行して現在の上限を確認します。
  2. `max_open_files = 65535` を `be.conf` に追加します。
  3. または、`ulimit -n 65535` を実行してから BE を再起動します。

### FDB クラスターが起動しない

- **調査手順**：
  1. `DATA_DIRS`（`fdb_vars.sh` 内）で指定したディレクトリが存在し、適切な権限が設定されていることを確認します。
  2. すべてのノードで `FDB_CLUSTER_IPS` が一貫して設定されていることを確認します。
  3. `/var/log/foundationdb/fdbserver.log` にある FDB のログを確認します。

## 注意事項

- FE と BE の `meta_service_endpoint` の設定先には、メタデータ操作を担当する Meta Service プロセスのみを指定してください。
- データリサイクラープロセスを `meta_service_endpoint` の設定先に指定しないでください。
