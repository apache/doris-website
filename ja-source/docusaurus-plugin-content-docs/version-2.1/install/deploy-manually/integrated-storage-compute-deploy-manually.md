---
{
  "title": "統合ストレージコンピュートクラスターを手動でデプロイする",
  "language": "ja",
  "description": "環境チェック、クラスター計画、オペレーティングシステム検査などの事前チェックと計画を完了した後、"
}
---
環境チェック、クラスター計画、オペレーティングシステム検査などの事前チェックと計画を完了した後、クラスターのデプロイを開始できます。

統合ストレージ・コンピュート・アーキテクチャを以下に示します。統合ストレージ・コンピュート・クラスターのデプロイには4つのステップが含まれます：

[integrated-storage-compute-architecture](/images/getting-started/apache-doris-technical-overview.png)

1. **FE Masterノードのデプロイ**: 最初のFEノードをMasterノードとしてデプロイします；
   
2. **FEクラスターのデプロイ**: FollowerまたはObserver FEノードを追加してFEクラスターをデプロイします；
   
3. **BEノードのデプロイ**: BEノードをFEクラスターに登録します；
   
4. **クラスターの正確性の確認**: デプロイ後、クラスターに接続してその正確性を確認します。

## ステップ1: FE Masterノードのデプロイ

1. **メタデータパスの作成**

   FEをデプロイする際、メタデータはBEノードのデータストレージとは異なるハードドライブに保存することを推奨します。

   インストールパッケージを展開すると、デフォルトでdoris-metaディレクトリが含まれています。別のメタデータディレクトリを作成し、それをdoris-metaディレクトリにリンクすることを推奨します。本番環境では、Dorisインストールフォルダー外の別のディレクトリ、できればSSD上に配置することを強く推奨します。テスト環境や開発環境では、デフォルト設定を使用できます。

   ```sql
   ## Use a separate disk for FE metadata
   mkdir -p <doris_meta_created>
      
   ## Create FE metadata directory symlink
   ln -s <doris_meta_created> <doris_meta_original>
   ```
2. **FE設定ファイルの修正**

   FE設定ファイルは、FEデプロイメントパス下のconfディレクトリに配置されています。FEノードを起動する前に、`conf/fe.conf`ファイルを修正してください。

   FEノードをデプロイする前に、以下の設定を修正することを推奨します：

   ```Bash
   ## modify Java Heap
   JAVA_OPTS="-Xmx16384m -XX:+UseMembar -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=7 -XX:+PrintGCDateStamps -XX:+PrintGCDetails -XX:+UseConcMarkSweepGC -XX:+UseParNewGC -XX:+CMSClassUnloadingEnabled -XX:-CMSParallelRemarkEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:SoftRefLRUPolicyMSPerMB=0 -Xloggc:$DORIS_HOME/log/fe.gc.log.$DATE"
      
   ## modify case sensitivity
   lower_case_table_names = 1
     
   ## modify network CIDR 
   priority_networks = 10.1.3.0/24
      
   ## modify Java Home
   JAVA_HOME = <your-java-home-path>
   ```
パラメータの説明：詳細については、[FE Configuration](../../admin-manual/config/fe-config)を参照してください：

   | パラメータ                                                    | 推奨事項                                                 |
   | ------------------------------------------------------------ | --------------------------------------------------------- |
   | JAVA_OPTS                                                    | Java Heapを調整するために`-Xmx`パラメータを指定します。本番環境では16G以上に設定することを推奨します。   |
   | [lower_case_table_names ](../../admin-manual/config/fe-config#lower_case_table_names) | 大文字小文字の区別を設定します。1に調整することを推奨します。これは大文字小文字を区別しないことを意味します。            |
   | [priority_networks ](../../admin-manual/config/fe-config#priority_networks) | ネットワークCIDRはネットワークIPアドレスに基づいて指定されます。FQDN環境では無視できます。 |
   | JAVA_HOME                                                    | DorisにはOSから独立したJDK環境を使用することを推奨します。                |
   
3. **FEプロセスの開始**

   以下のコマンドを使用してFEプロセスを開始できます：

   ```Shell
   bin/start_fe.sh --daemon
   ```
FEプロセスが開始され、バックグラウンドで実行されます。デフォルトでは、ログはlog/ディレクトリに保存されます。起動に失敗した場合は、log/fe.logまたはlog/fe.outファイルでエラーの詳細を確認できます。

4. **FE起動ステータスの確認**

   MySQL Clientを使用してDorisクラスターに接続できます。デフォルトのユーザーはrootで、パスワードは空です。

   ```sql
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   ```
Dorisクラスターに接続した後、`show frontends`コマンドを使用してFEノードのステータスを確認できます。通常、以下を確認する必要があります：

   - Alive: trueの場合、ノードが生きていることを示します。

   - Join: trueの場合、ノードがクラスターに参加したことを示しますが、必ずしもノードがクラスター内でアクティブであることを意味するわけではありません（接続が失われている可能性があります）。

   - IsMaster: trueの場合、現在のノードがMasterノードであることを示します。

## Step 2: FEクラスターのデプロイ（オプション）

本番環境では、少なくとも3つのノードをデプロイすることを推奨します。FE Masterノードをデプロイした後、2つの追加のFE Followerノードをデプロイする必要があります。

1. **メタデータディレクトリの作成**

   FE Masterノードのデプロイと同じ手順に従って、`doris-meta`ディレクトリを作成します。

2. **FE Followerノード設定の変更**

   FE Masterノードと同じ手順に従って、FollowerノードのFE設定ファイルを変更します。通常、FE Masterノードから設定ファイルを単純にコピーできます。

3. **DorisクラスターでのFE Followerノードの登録**

   新しいFEノードを開始する前に、FEクラスター内で新しいFEノードを登録する必要があります。

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   
   ## register a new FE follower node
   ALTER SYSTEM ADD FOLLOWER "<fe_ip_address>:<fe_edit_log_port>"
   ```
オブザーバーノードを追加するには、`ADD OBSERVER`コマンドを使用します：

   ```Bash
   ## register a new FE observer node
   ALTER SYSTEM ADD OBSERVER "<fe_ip_address>:<fe_edit_log_port>"
   ```
:::caution 注意
   - FE Followerノード（Masterを含む）の数は奇数である必要があります。高可用性のために3ノードの配置を推奨します。

   - FEが高可用性モード（1 Master、2 Followers）で配置されている場合、FE読み取りサービス容量を拡張するためにObserver FEノードを追加することを推奨します。
   :::

4. **FE Followerノードの起動**

   FE Followerノードは以下のコマンドで起動でき、メタデータが自動的に同期されます。

   ```Shell
   bin/start_fe.sh --helper <helper_fe_ip>:<fe_edit_log_port> --daemon
   ```
ここで、helper_fe_ipはFEクラスター内の任意のライブノードを指します。--helperパラメータはFEの初回起動時にメタデータを同期するためにのみ使用され、その後の再起動ではこのパラメータは不要です。

5. **Followerノードの状態確認**

   FE FollowerノードのステータスをチェックするメソッドはFE Masterノードのステータスをチェックするメソッドと同じです。Followerノードを追加した後、show frontendsコマンドを使用してFEノードのステータスを確認してください。Masterとは異なり、IsMasterの状態はfalseであるべきです。

## ステップ3: BEノードのデプロイ

1. **データディレクトリの作成**

   BEプロセスはデータの計算とストレージを担当します。データディレクトリはデフォルトで`be/storage`配下に配置されます。本番環境では、BEデータを別のディスクに保存し、BEデータとデプロイファイルを異なるディスクに配置することが一般的です。BEは複数のディスクにデータを分散して、複数のハードドライブのI/O能力をより有効活用することをサポートしています。

   ```Bash
   ## Create a BE data storage directory on each data disk
   mkdir -p <be_storage_root_path>
   ```
2. **BE設定ファイルの変更**

   BE設定ファイルはBEデプロイメントパス配下のconfディレクトリに配置されています。BEノードを開始する前に、`conf/be.conf`ファイルを変更する必要があります。

   ```Bash
   ## modify storage path for BE node
   storage_root_path=/home/disk1/doris,medium:HDD;/home/disk2/doris,medium:SSD
   
   ## modify network CIDR 
   priority_networks = 10.1.3.0/24
   
   ## modify Java Home in be/conf/be.conf
   JAVA_HOME = <your-java-home-path>
   ```
パラメータの説明は以下の通りです：

   | パラメータ                                                         | 推奨事項                                                  |
   | ------------------------------------------------------------ | --------------------------------------------------------- |
   | [priority_networks](../../admin-manual/config/be-config#priority_networks) | ネットワークCIDR、ネットワークIPアドレスで指定します。FQDN環境では無視できます。 |
   | JAVA_OPTS                                                    | `-Xmx`パラメータを設定してJavaヒープサイズを調整します。本番環境では2GB以上に設定することを推奨します。   |
   | JAVA_HOME                                                    | Dorisにはオペレーティングシステムから独立したJDK環境を使用することを推奨します。               |

3. **DorisでのBEノードの登録**

   BEノードを開始する前に、FEクラスターに登録します：

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## Register BE node
   ALTER SYSTEM ADD BACKEND "<be_ip_address>:<be_heartbeat_service_port>"
   ```
4. **BEプロセスの開始**

   BEプロセスは以下のコマンドで開始できます：

   ```Bash
   bin/start_be.sh --daemon
   ```
BEプロセスが開始され、バックグラウンドで実行されます。ログはデフォルトで`log/`ディレクトリに保存されます。起動に失敗した場合は、`log/be.log`または`log/be.out`ファイルでエラー情報を確認してください。

5. **BE起動ステータスの確認**

   Dorisクラスタに接続した後、show backendsコマンドを使用してBEノードのステータスを確認します。

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## check BE node status
   show backends;
   ```
通常、以下の状態に注意してください：

   - `Alive`がtrueの場合、ノードが稼働していることを示します。

   - `TabletNum`は、ノード上のシャード数を表します。新しく追加されたノードはデータバランシングが実行され、`TabletNum`は徐々により均等に分散されます。


## ステップ4: クラスター整合性の確認

1. **データベースへのログイン**

   MySQL Clientを使用してDorisクラスターにログインします。

   ```Bash
   ## connect a alive fe node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   ```
2. **Dorisインストール情報の確認**

   `show frontends`と`show backends`を使用して、各データベースインスタンスのステータスを確認します。

   ```Sql
   -- check fe status
   show frontends \G  
        
   -- check be status  
   show backends \G
   ```
3. **Doris Cluster パスワードの変更**

   Doris クラスターが作成されると、`root` という名前のユーザーが自動的に作成され、そのパスワードはデフォルトで空に設定されます。セキュリティ上の理由から、クラスターが作成された直後に `root` ユーザーの新しいパスワードを設定することが推奨されます。

   ```SQL
   -- check the current user
   select user();  
   +------------------------+  
   | user()                 |  
   +------------------------+  
   | 'root'@'192.168.88.30' |  
   +------------------------+  
        
   -- modify the password for current user
   SET PASSWORD = PASSWORD('doris_new_passwd');
   ```
4. **テストテーブルの作成とデータの挿入**

   クラスターの整合性を検証するために、新しく作成されたクラスターにテストテーブルを作成し、いくつかのデータを挿入することができます。

   ```SQL
   -- create a test database
   create database testdb;
    
   -- create a test table
   CREATE TABLE testdb.table_hash
   (
       k1 TINYINT,
       k2 DECIMAL(10, 2) DEFAULT "10.5",
       k3 VARCHAR(10) COMMENT "string column",
       k4 INT NOT NULL DEFAULT "1" COMMENT "int column"
   )
   COMMENT "my first table"
   DISTRIBUTED BY HASH(k1) BUCKETS 32;
   ```
DorisはMySQLプロトコルと互換性があり、INSERT文を使用してデータを挿入できます。

   ```SQL
   -- insert data
   INSERT INTO testdb.table_hash VALUES
   (1, 10.1, 'AAA', 10),
   (2, 10.2, 'BBB', 20),
   (3, 10.3, 'CCC', 30),
   (4, 10.4, 'DDD', 40),
   (5, 10.5, 'EEE', 50);
   
   -- check the data
   SELECT * from testdb.table_hash;
   +------+-------+------+------+
   | k1   | k2    | k3   | k4   |
   +------+-------+------+------+
   |    3 | 10.30 | CCC  |   30 |
   |    4 | 10.40 | DDD  |   40 |
   |    5 | 10.50 | EEE  |   50 |
   |    1 | 10.10 | AAA  |   10 |
   |    2 | 10.20 | BBB  |   20 |
   +------+-------+------+------+
   ```
