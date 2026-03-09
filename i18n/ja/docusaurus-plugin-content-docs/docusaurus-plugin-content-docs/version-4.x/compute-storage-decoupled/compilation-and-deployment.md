---
{
  "title": "コンパイルとデプロイメント",
  "language": "ja",
  "description": "この文書では、ストレージ・コンピュート分離モデルにおけるDorisのコンパイルおよびデプロイメントプロセスについて詳述する。"
}
---
## 1. 概要

本文書では、分離されたストレージ・コンピュートモデルにおけるDorisのコンパイルとデプロイメントプロセスについて詳しく説明し、統合されたストレージ・コンピュートモデルとの違い、特に新しく追加されたMeta Service (MS)モジュールのコンパイル、設定、管理について重点的に説明します。

## 2. バイナリの取得

### 2.1 直接ダウンロード

コンパイル済みバイナリ（全てのDorisモジュールを含む）は[Doris Download Page](https://doris.apache.org/download/)から取得できます（バージョン3.0.2以上を選択）。

### 2.2 コンパイル出力（オプション）

コードベースで提供される`build.sh`スクリプトを使用してコンパイルします。新しいMSモジュールは`--cloud`パラメータでコンパイルされます。

```shell
sh build.sh --fe --be --cloud 
```
コンパイル後、`output`ディレクトリに新しい`ms`ディレクトリが追加されます：

```
output
├── be
├── fe
└── ms
    ├── bin
    ├── conf
    └── lib
```
## 3. Meta Service デプロイメント

### 3.1 設定

`./conf/doris_cloud.conf` ファイルでは、主に以下の2つのパラメータを変更する必要があります：

1. `brpc_listen_port`: Meta Service のリスニングポート、デフォルトは5000です。
2. `fdb_cluster`: FoundationDB クラスターの接続情報。FoundationDB のデプロイ時に取得できます。（Doris が提供する `fdb_ctl.sh` を使用してデプロイする場合、この値は `$FDB_HOME/conf/fdb.cluster` ファイルで確認できます。）

設定例：

```Shell
brpc_listen_port = 5000
fdb_cluster = xxx:yyy@127.0.0.1:4500
```
注意: `fdb_cluster`の値は、FoundationDBデプロイメントマシン上の`/etc/foundationdb/fdb.cluster`ファイルの内容と一致する必要があります。（Dorisが提供する`fdb_ctl.sh`を使用してデプロイメントする場合、この値は`$FDB_HOME/conf/fdb.cluster`ファイルで確認できます。）

**例: ファイルの最後の行が、doris_cloud.confのfdb_clusterフィールドに入力する値です**

```shell
cat /etc/foundationdb/fdb.cluster

# DO NOT EDIT!
# This file is auto-generated, it is not to be edited by hand.
cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
```
### 3.2 開始と停止

*環境要件*

`JAVA_HOME`環境変数がOpenJDK 17を正しく指すように設定されていることを確認し、`ms`ディレクトリに移動してください。

*開始コマンド*

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --daemon
```
```text
LIBHDFS3_CONF=
starts doris_cloud with args: --meta-service
wait and check doris_cloud start successfully
successfully started brpc listening on port=5000 time_elapsed_ms=11
doris_cloud start successfully
```
startup スクリプトは、startup が成功したことを示すために 0 の値を返します。そうでない場合、startup は失敗します。

:::info
3.0.4 では、startup スクリプトはより多くの情報を出力します：

```text
2024-12-26 15:31:53 start with args: --meta-service
wait and check MetaService and Recycler start successfully
process working directory: "/mnt/disk1/doris/ms"
pid=1666015 written to file=./bin/doris_cloud.pid
version:{doris-3.0.4-release} code_version:{commit=fd44740fadabebfedb5da201d7ce427a5dd47c44 time=2025-01-16 18:53:00 +0800} build_info: ...

MetaService has been started successfully
successfully started service listening on port=5000 time_elapsed_ms=19
```
:::

*停止コマンド*

``` shell
bin/stop.sh
```
本番環境では、Meta Serviceの総数が最低3つであることを確認してください。

## 4. データリサイクル機能の独立デプロイメント（オプション）

:::info
Meta Service自体にはメタデータ管理とリサイクル機能があり、これらは独立してデプロイできます。独立してデプロイしたい場合は、このセクションを参照してください。
:::

*準備作業*

1. 新しい作業ディレクトリを作成します（例：`recycler`）。
2. `ms`ディレクトリの内容を新しいディレクトリにコピーします：

   ```shell
   cp -r ms recycler
   ```
*設定*

新しいディレクトリの設定ファイルで、BRPCリスニングポート `brpc_listen_port` と `fdb_cluster` の値を変更します。

*データリサイクル機能の開始*

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --recycler --daemon
```
*メタデータ操作のみ開始Function*

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --meta-service --daemon
```
## 5. FE と BE の起動プロセス

このセクションでは、ストレージ・コンピュート分離アーキテクチャにおけるFE（Frontend）とBE（Backend）を起動する手順について詳しく説明します。

### 5.1 起動順序

1. MASTER ロールを持つ最初のFEインスタンスを起動します。
2. 他のFEとBEインスタンスをクラスターに追加します。
3. 最初のStorage Vaultを追加します。

### 5.2 MASTER ロールのFEの起動

#### 5.2.1 fe.confの設定

`fe.conf`ファイルでは、以下の主要パラメータを設定する必要があります：

1. `deploy_mode`
   - 説明：Dorisの起動モードを指定します。
   - 形式：`cloud`はストレージ・コンピュート分離モードを示し、その他は統合ストレージ・コンピュートモードを示します。
   - 例：`cloud`

2. `cluster_id`
   - 説明：ストレージ・コンピュート分離アーキテクチャにおけるクラスターの一意識別子です。各クラスターは競合を避けるために異なるcluster_idを持つ必要があります。
   - 形式：整数（int型）。
   - 例：以下のshellコマンドを使用してランダムな`cluster_id`を生成できます。

      ```shell
      echo $(($((RANDOM << 15)) | $RANDOM))
      ```
:::caution
     **競合を避けるため、各クラスターは異なるcluster_idを持つ必要があります**
     :::

3. `meta_service_endpoint`
   - 説明: Meta Serviceのアドレスとポート。
   - 形式: `IPアドレス:ポート番号`。
   - 例: `127.0.0.1:5000`、複数のmeta serviceをカンマで区切って設定できます。

#### 5.2.2 FEの開始

開始コマンドの例:

```bash
bin/start_fe.sh --daemon
```
最初のFEプロセスはクラスターを初期化し、FOLLOWER役割で動作します。MySQLクライアントを使用してFEに接続し、`show frontends`を使用して、最近起動したFEがマスターであることを確認してください。

### 5.3 その他のFEノードの追加

その他のノードも設定ファイルを変更し、上記の手順に従って起動する必要があります。MySQLクライアントを使用してMASTER役割のFEに接続し、以下のSQLコマンドを使用して追加のFEノードを追加してください：

```sql
ALTER SYSTEM ADD FOLLOWER "host:port";
```
`host:port`を実際のFEノードのアドレスとeditlogポートに置き換えてください。詳細については、[ADD FOLLOWER](../sql-manual/sql-statements/cluster-management/instance-management/ADD-FOLLOWER)と[ADD OBSERVER](../sql-manual/sql-statements/cluster-management/instance-management/ADD-OBSERVER)を参照してください。

本番環境では、最初のFEを含むFOLLOWERロールのFrontend（FE）ノードの総数が奇数であることを確認してください。一般的には、3つのFOLLOWERで十分です。OBSERVERロールのFrontendノードは任意の数で構いません。

### 5.4 BEノードの追加

クラスターにBackendノードを追加するには、各Backendに対して以下の手順を実行します：

#### 5.4.1 be.confの設定

`be.conf`ファイルでは、以下の主要なパラメータを設定する必要があります：

1. `deploy_mode`
   - 説明：Dorisの起動モードを指定します。
   - 形式：`cloud`はストレージ・コンピュート分離モードを示し、その他は統合ストレージ・コンピュートモードを示します。
   - 例：`cloud`

2. `file_cache_path`
   - 説明：ファイルキャッシュに使用されるディスクパスとその他のパラメータを配列として表現し、各ディスクに対して1つのエントリがあります。`path`はディスクパスを指定し、`total_size`はキャッシュのサイズを制限します。-1または0はディスク全体の容量を使用します。
   - 形式：[{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
   - 例：[{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
   - デフォルト：[{"path":"${DORIS_HOME}/file_cache"}]

#### 5.4.1 BEの開始と追加

1. Backendを開始する：

   以下のコマンドを使用してBackendを開始します：

   ```bash
   bin/start_be.sh --daemon
   ```
2. Backendをクラスターに追加する：

   MySQLクライアントを使用して任意のFrontendに接続し、以下を実行します：

   ```sql
   ALTER SYSTEM ADD BACKEND "<ip>:<heartbeat_service_port>" [PROPERTIES properties];
   ```
`<ip>`を新しいBackendのIPアドレスに、`<heartbeat_service_port>`を設定されたハートビートサービスポート（デフォルトは9050）に置き換えてください。

   PROPERTIESを使用してBEのコンピューティンググループを設定できます。

   より詳細な使用方法については、[ADD BACKEND](../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND)および[REMOVE BACKEND](../sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND)を参照してください。

3. Backendステータスの確認：

   Backendログファイル（`be.log`）を確認して、正常に起動してクラスターに参加していることを確認してください。

   以下のSQLコマンドを使用してBackendのステータスを確認することもできます：

   ```sql
   SHOW BACKENDS;
   ```
これによりクラスター内のすべてのBackendとその現在のステータスが表示されます。

## 6. Storage Vaultの作成

Storage VaultはDorisの分離されたストレージとコンピュート アーキテクチャにおける重要なコンポーネントです。これらはデータを格納するための共有ストレージ層を表します。HDFSまたはS3互換のオブジェクト ストレージを使用して、1つまたは複数のStorage Vaultを作成できます。1つのStorage VaultをデフォルトのStorage Vaultとして設定でき、システム テーブルおよびStorage Vaultが指定されていないテーブルは、このデフォルトのStorage Vaultに格納されます。デフォルトのStorage Vaultは削除できません。DorisクラスターのStorage Vaultを作成する方法は以下の通りです：

### 6.1 HDFS Storage Vaultの作成

SQLを使用してStorage Vaultを作成するには、MySQLクライアントを使用してDorisクラスターに接続します。

```sql
CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault
    PROPERTIES (
    "type"="hdfs",
    "fs.defaultFS"="hdfs://127.0.0.1:8020"
    );
```
### 6.2 S3ストレージVaultの作成

S3互換オブジェクトストレージを使用してStorage Vaultを作成するには、以下の手順に従ってください：

1. MySQLクライアントを使用してDorisクラスターに接続します。

2. 以下のSQLコマンドを実行してS3 Storage Vaultを作成します：

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault
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
他のオブジェクトストレージにStorage Vaultを作成するには、[Create Storage Vault](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)を参照してください。

### 6.3 デフォルトStorage Vaultの設定

以下のSQL文を使用してデフォルトのStorage Vaultを設定します。

```sql
SET <storage_vault_name> AS DEFAULT STORAGE VAULT
```
## 7. 注意事項

- メタデータ操作用のMeta Serviceプロセスのみを、FEとBEの`meta_service_endpoint`ターゲットとして設定する必要があります。
- データリサイクル機能プロセスは`meta_service_endpoint`ターゲットとして設定しないでください。
