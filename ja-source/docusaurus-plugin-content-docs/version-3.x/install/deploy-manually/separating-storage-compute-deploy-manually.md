---
{
  "title": "分離ストレージコンピュートクラスタを手動でデプロイする",
  "language": "ja",
  "description": "環境チェック、クラスター計画、オペレーティングシステムチェックなどの前提条件チェックと計画を完了した後、"
}
---
環境チェック、クラスタプランニング、オペレーティングシステムチェックなどの前提条件チェックとプランニングが完了した後、クラスタのデプロイを開始できます。デプロイプロセスは8つのステップで構成されます：

1. FoundationDBクラスタの準備：既存のFoundationDBクラスタを使用するか、新しいものを作成できます；

2. S3またはHDFSサービスのデプロイ：既存の共有ストレージを使用するか、新しい共有ストレージを作成できます；

3. Meta Serviceのデプロイ：DorisクラスタのMeta Serviceをデプロイします；

4. データ回収プロセスのデプロイ：オプションで、Dorisクラスタ用に独立したデータ回収プロセスをデプロイします；

5. FE Masterノードの起動：最初のFEノードをMaster FEノードとして起動します；

6. FE Masterクラスタの作成：FE Follower/ObserverノードをFEクラスタに追加してクラスタを形成します；

7. BEノードの追加：BEノードをクラスタに追加・登録します；

8. Storage Vaultの追加：共有ストレージを使用して1つ以上のStorage Vaultを作成します。

## ステップ1：FoundationDBの準備

このセクションでは、`fdb_vars.sh`と`fdb_ctl.sh`スクリプトを使用してFoundationDB（FDB）サービスを設定、デプロイ、開始するためのステップバイステップの手順を提供します。[doris tools](http://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-3.0.2-tools.tar.gz)をダウンロードし、`fdb`ディレクトリから`fdb_vars.sh`と`fdb_ctl.sh`を取得できます。

:::tip
Dorisは現在、デフォルトでFDBバージョン7.1.xに依存しています。すでにFDBを別途インストールしている場合は、バージョン7.1.xであることを確認してください。そうでなければ、Meta Serviceの起動に失敗します。
:::

1. マシン要件

   通常、二重データレプリカを持つFoundationDBクラスタを形成し、単一マシンの障害に対応するには、SSDを搭載した少なくとも3台のマシンが必要です。テスト/開発環境では、単一のマシンでFoundationDBをセットアップできます。

2. `fdb_vars.sh`スクリプトの設定

   fdb_vars.shスクリプトを設定する際は、以下の設定を必ず指定する必要があります：

   | Parameter         | 詳細                        | タイプ                         | Example                                                      | 注                                                         |
   | ----------------- | ---------------------------------- | ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
   | DATA_DIRS         | FoundationDBデータディレクトリを指定 | 絶対パスのカンマ区切りリスト | /mnt/foundationdb/data1,/mnt/foundationdb/data2,/mnt/foundationdb/data3 | - スクリプト実行前にディレクトリが作成されていることを確認 - プロダクションではSSDと別々のディレクトリを推奨 |
   | FDB_CLUSTER_IPS   | クラスタIPを定義            | 文字列（カンマ区切りのIPアドレス） | 172.200.0.2,172.200.0.3,172.200.0.4                          | - プロダクションクラスタでは少なくとも3つのIPアドレスが必要 - 最初のIPがコーディネーターとして使用される - 高可用性のため、マシンは異なるラックに配置 |
   | FDB_HOME          | FoundationDBホームディレクトリを定義 | 絶対パス                | /fdbhome                                                     | - デフォルトパスは/fdbhome - このパスが絶対パスであることを確認      |
   | FDB_CLUSTER_ID    | クラスタIDを定義             | 文字列                        | SAQESzbh                                                     | - IDは各クラスタで一意である必要がある - `mktemp -u XXXXXXXX`を使用して生成 |
   | FDB_CLUSTER_DESC  | FDBクラスタの説明を定義 | 文字列                        | dorisfdb                                                     | - デプロイに意味のある名前に変更することを推奨 |


   以下のオプションのカスタム設定も指定できます：

   | Parameter         | 詳細                        | タイプ                         | Example                                                      | 注                                                         |
   | ----------------- | ---------------------------------- | ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
   | MEMORY_LIMIT_GB   | FDBメモリ制限を定義       | 整数                       | 32                                                           | - 利用可能なシステムメモリに基づいてメモリ制限を設定    |


3. FDBクラスタのデプロイ

   `fdb_vars.sh`を使用して環境を設定した後、`fdb_ctl.sh`スクリプトを使用して各ノードでFDBクラスタをデプロイできます。

   ```bash
   ./fdb_ctl.sh deploy
   ```
このコマンドはFDBクラスターのデプロイメントプロセスを開始します。

4. FDBサービスの開始

   FDBクラスターがデプロイされた後、`fdb_ctl.sh`スクリプトを使用してFDBサービスを開始できます。

   ```bash
   ./fdb_ctl.sh start
   ```
このコマンドはFDBサービスを開始し、クラスターをオンラインにしてFDBクラスター接続文字列を取得します。この接続文字列はMetaServiceの設定に使用できます。

   :::caution Note
   fdb_ctl.shスクリプトの'clean'コマンドは、すべてのFDBメタデータをクリアするため、データ損失を引き起こす可能性があります。本番環境でこのコマンドを使用することは厳格に禁止されています！
   :::

## ステップ2：S3/HDFSサービスのインストール（オプション）

ストレージ・コンピュート分離モードのApache Dorisは、S3またはHDFSサービス上にデータを保存します。これらのサービスが既にセットアップされている場合は、直接使用できます。
そうでなければ、このドキュメントではMinIOの簡単なデプロイメントガイドを提供します：

1. [MinIO download page](https://min.io/download?license=agpl&platform=linux)にアクセスして、適切なバージョンとオペレーティングシステムを選択し、対応するServerとClientのバイナリまたはインストールパッケージをダウンロードしてください。

2. MinIO Serverを開始

   ```bash
   export MINIO_REGION_NAME=us-east-1
   export MINIO_ROOT_USER=minio # In older versions, this configuration was MINIO_ACCESS_KEY=minio
   export MINIO_ROOT_PASSWORD=minioadmin # In older versions, this configuration was MINIO_SECRET_KEY=minioadmin
   nohup ./minio server /mnt/data 2>&1 &
   ```
3. MinIO Clientの設定

   ```bash
   # If you installed the client using the installation package, the client name is mcli. If you downloaded the client binary package, it is named mc  
   ./mc config host add myminio http://127.0.0.1:9000 minio minioadmin
   ```
4. バケットを作成する

   ```bash
   ./mc mb myminio/doris
   ```
5. 正しく動作していることを確認する

   ```bash
   # Upload a file  
   ./mc mv test_file myminio/doris
   # List the file  
   ./mc ls myminio/doris
   ```
## ステップ 3: Meta Service デプロイメント

1. 設定

   `./conf/doris_cloud.conf` ファイル内で、以下の2つのパラメータを修正する必要があります：

   - `brpc_listen_port`：Meta Service のリスニングポート、デフォルトは 5000 です。
   - `fdb_cluster`：FoundationDB クラスターへの接続情報で、FoundationDB デプロイメント時に取得できます。（Doris が提供する `fdb_ctl.s`h を使用している場合、この値は `$FDB_HOME/conf/fdb.cluster` ファイル内で確認できます）。

   設定例：

   ```shell
   brpc_listen_port = 5000
   fdb_cluster = xxx:yyy@127.0.0.1:4500
   ```
注意: `fdb_cluster`の値は、FoundationDBデプロイメントマシンの`/etc/foundationdb/fdb.cluster`ファイルの内容と一致する必要があります（DorisによってプロバイダされるfDB_ctl.shを使用している場合、この値は`$FDB_HOME/conf/fdb.cluster`ファイルから取得できます）。

   例として、ファイルの最後の行がdoris_cloud.confファイルの`fdb_cluster`フィールドに記入する値です：

   ```shell
   cat /etc/foundationdb/fdb.cluster
   
   DO NOT EDIT!
   This file is auto-generated, it is not to be edited by hand.
   cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
   ```
2. 開始と停止

   開始する前に、`JAVA_HOME`環境変数がOpenJDK 17を正しく指していることを確認し、`ms`ディレクトリに入ってください。

   開始コマンドは以下の通りです：

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --daemon
   ```
start スクリプトからの戻り値が 0 の場合は正常に開始されたことを示し、そうでなければ開始が失敗したことを示します。正常に開始された場合、標準出力の最後の行に "doris_cloud start successfully" が表示されます。

   stop コマンドは以下の通りです：

   ```shell
   bin/stop.sh
   ```
本番環境では、少なくとも3つのMeta Serviceノードが利用可能であることを確認してください。

## Step 4: データリサイクル機能の独立デプロイ（オプション）

:::info Information

Meta Service自体にはメタデータ管理とリサイクル機能があり、これら2つの機能は独立してデプロイできます。独立してデプロイしたい場合は、このセクションを参照してください。

:::

1. 新しい作業ディレクトリ（例：`recycler`）を作成し、`ms`ディレクトリの内容を新しいディレクトリにコピーします：

   ```shell
   cp -r ms recycler
   ```
2. 新しいディレクトリの設定ファイルでBRPCリッスンポート`brpc_listen_port`と`fdb_cluster`の値を変更します。

   データリサイクリング機能を開始するには：

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --recycler --daemon
   ```
メタデータ操作機能のみを開始するには：

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --meta-service --daemon
   ```
## ステップ5: FE Masterノードの起動

1. `fe.conf`ファイルの設定

   `fe.conf`ファイルで、以下の主要パラメータを設定する必要があります：

   - `deploy_mode`
     - 説明: Dorisの起動モードを指定します
     - 形式: ストレージ・コンピュート分離モードの場合は`cloud`、その他のモードではストレージ・コンピュート統合
     - 例: `cloud`
   - `cluster_id`
     - 説明: ストレージ・コンピュート分離アーキテクチャにおけるクラスターの一意識別子。異なるクラスターは異なる`cluster_id`を持つ必要があります。
     - 形式: 整数型
     - 例: 以下のshellスクリプト`echo $(($((RANDOM << 15)) | $RANDOM))`を使用してランダムIDを生成できます。
     - 注意: 異なるクラスターは異なる`cluster_id`を持つ必要があります。
   - `meta_service_endpoint`
     - 説明: Meta Serviceのアドレスとポート
     - 形式: `IPアドレス:ポート`
     - 例: `127.0.0.1:5000`、複数のMeta Serviceはカンマで区切って設定できます。

2. FE Masterノードの起動

   起動コマンドの例:

   ```bash
   bin/start_fe.sh --daemon
   ```
最初のFEプロセスはクラスタを初期化し、FOLLOWER役割として動作します。MySQLクライアントを使用してFEに接続し、`show frontends`を使用して、開始したばかりのFEがマスターであることを確認してください。

## Step 6: FE Follower/Observer ノードの登録と追加

他のノードも同様に設定ファイルを変更し、同じ手順に従って開始する必要があります。MySQLクライアントを使用してMaster役割のFEに接続し、以下のSQLコマンドで追加のFEノードを追加してください：

```sql
ALTER SYSTEM ADD FOLLOWER "host:port";
```
`host:port`を実際のFEノードのアドレスに置き換え、ログポートを編集してください。詳細については、[ADD FOLLOWER](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-FOLLOWER)および[ADD OBSERVER](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-OBSERVER)を参照してください。

本番環境では、最初のFEを含むFOLLOWERロールのFEノードの総数が奇数になるようにしてください。通常、3つのFOLLOWERノードで十分です。OBSERVERロールのFEノードの数は任意です。

## ステップ7: BEノードの追加

クラスターにBackendノードを追加するには、各Backendに対して以下の手順を実行してください：

1. `be.conf`の設定

   `be.conf`ファイルで、以下の主要パラメータを設定する必要があります：
   - deploy_mode
     - 説明: dorisの起動モードを指定
     - 形式: cloudはストレージとコンピューティングの分離モードを示し、その他はストレージとコンピューティングの統合モードを示す
     - 例: cloud
   - file_cache_path
     - 説明: ファイルキャッシュに使用されるディスクパスとその他のパラメータ。配列形式で表現され、各ディスクが1つのアイテムになります。pathはディスクパスを指定し、total_sizeはキャッシュサイズを制限します。-1または0はディスク全体の容量を使用します。
     - 形式: [{"path":"/path/to/file_cache", "total_size":21474836480}, {"path":"/path/to/file_cache2", "total_size":21474836480}]
     - 例: [{"path":"/path/to/file_cache", "total_size":21474836480}, {"path":"/path/to/file_cache2", "total_size":21474836480}] - デフォルト: [{"path":"${DORIS_HOME}/file_cache"}]

3. BEプロセスの開始

   以下のコマンドを使用してBackendを開始します：

   ```bash
   bin/start_be.sh --daemon
   ```
4. クラスターにBEを追加する：

   MySQLクライアントを使用して任意のFrontendに接続し、以下を実行する：

   ```sql
   ALTER SYSTEM ADD BACKEND "<ip>:<heartbeat_service_port>" [PROPERTIES properties];
   ```
`<ip>`を新しいBackendのIPアドレスに、`<heartbeat_service_port>`を設定されたheartbeat service port（デフォルトは9050）に置き換えてください。

   PROPERTIESを使用してBEが配置されているcompute groupを指定できます。

   より詳細な使用方法については、[ADD BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND)および[REMOVE BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND)を参照してください。

5. BEステータスの確認

   Backendログファイル（`be.log`）を確認して、正常に起動しクラスタに参加していることを確認してください。

   以下のSQLコマンドを使用してBackendステータスを確認することもできます：

   ```sql
   SHOW BACKENDS;
   ```
これによりクラスター内のすべてのBackendノードとその現在のステータスが表示されます。

## Step 8: Storage Vaultの追加

Storage VaultはDorisのストレージとコンピューティングの分離アーキテクチャにおける重要なコンポーネントです。データが保存される共有ストレージ層を表します。HDFSまたはS3互換のオブジェクトストレージを使用して、1つ以上のStorage Vaultを作成できます。1つのStorage VaultをデフォルトのStorage Vaultとして設定でき、システムテーブルとStorage Vaultが指定されていないテーブルは、このデフォルトのStorage Vaultに保存されます。デフォルトのStorage Vaultは削除できません。以下は、DorisクラスターのStorage Vaultを作成する手順です：

1. HDFS Storage Vaultの作成

   SQLを使用してStorage Vaultを作成するには、MySQLクライアントを使用してDorisクラスターに接続します：

   ```sql
   CREATE STORAGE VAULT IF_NOT_EXISTS hdfs_vault
       PROPERTIES (
       "type"="hdfs",
       "fs.defaultFS"="hdfs://127.0.0.1:8020"
   );
   ```
2. S3 Storage Vault の作成

   S3互換オブジェクトストレージを使用してStorage Vaultを作成するには、以下の手順に従ってください：

   - MySQL clientを使用してDorisクラスターに接続します。
   - 以下のSQLコマンドを実行してS3 Storage Vaultを作成します：

   ```sql
   CREATE STORAGE VAULT IF_NOT_EXISTS s3_vault
       PROPERTIES (
       "type"="S3",
       "s3.endpoint"="s3.us-east-1.amazonaws.com",
       "s3.access_key" = "ak",
       "s3.secret_key" = "sk",
       "s3.region" = "us-east-1",
       "s3.root.path" = "ssb_sf1_p2_s3",
       "s3.bucket" = "doris-build-1308700295",
       "provider" = "S3"
   );
   ```
他のオブジェクトストレージでStorage Vaultを作成するには、[Create Storage Vault](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)を参照してください。

3. デフォルトのStorage Vaultを設定する

   以下のSQL文を使用してデフォルトのStorage Vaultを設定します。

   ```sql
   SET <storage_vault_name> AS DEFAULT STORAGE VAULT
   ```
## 注意事項

- メタデータ操作機能を持つMeta Serviceプロセスのみを、FEとBEの`meta_service_endpoint`として設定する必要があります。
- データリサイクル機能プロセスを`meta_service_endpoint`として設定してはいけません。
