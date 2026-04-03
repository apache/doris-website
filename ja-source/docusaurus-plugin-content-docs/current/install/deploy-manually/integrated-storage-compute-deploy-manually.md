---
{
  "title": "統合ストレージコンピュートクラスターを手動でデプロイする",
  "language": "ja",
  "description": "環境チェック、クラスター計画、およびオペレーティングシステム検査などの事前チェックと計画を完了した後、"
}
---
環境チェック、クラスター計画、オペレーティングシステム検査などの事前チェックと計画が完了したら、クラスターのデプロイを開始できます。

統合ストレージ・コンピュート・アーキテクチャを以下に示し、統合ストレージ・コンピュート・クラスターのデプロイには4つのステップが含まれます：

[MPP-based integrated storage compute architecture](/images/getting-started/apache-doris-technical-overview.png)

1. **FE Master Nodeのデプロイ**: 最初のFEノードをMasterノードとしてデプロイします；
   
2. **FEクラスターのデプロイ**: FollowerまたはObserver FEノードを追加してFEクラスターをデプロイします；
   
3. **BEノードのデプロイ**: BEノードをFEクラスターに登録します；
   
4. **クラスター正常性の検証**: デプロイ後、クラスターに接続してその正常性を検証します。

## ステップ1: FE Master Nodeのデプロイ

1. **メタデータパスの作成**

   FEをデプロイする際は、メタデータをBEノードのデータストレージとは異なるハードドライブに保存することを推奨します。

   インストールパッケージを展開すると、デフォルトでdoris-metaディレクトリが含まれます。別個のメタデータディレクトリを作成し、それをdoris-metaディレクトリにリンクすることを推奨します。本番環境では、Dorisインストールフォルダ外の別ディレクトリ、できればSSD上を使用することを強く推奨します。テストおよび開発環境では、デフォルト設定を使用できます。

   ```sql
   ## Use a separate disk for FE metadata
   mkdir -p <doris_meta_created>
      
   ## Create FE metadata directory symlink
   ln -s <doris_meta_created> <doris_meta_original>
   ```
2. **FE設定ファイルの変更**

   FE設定ファイルはFEデプロイメントパス下のconfディレクトリに配置されています。FEノードを起動する前に、`conf/fe.conf`ファイルを変更してください。

   FEノードをデプロイする前に、以下の設定を変更することを推奨します：

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
パラメータの説明: 詳細については、[FE Configuration](../../admin-manual/config/fe-config)を参照してください：

   | パラメータ                                                    | 推奨事項                                                 |
   | ------------------------------------------------------------ | --------------------------------------------------------- |
   | JAVA_OPTS                                                    | `-Xmx`パラメータを指定してJava Heapを調整します。本番環境では16G以上に設定することを推奨します。   |
   | [lower_case_table_names ](../../admin-manual/config/fe-config#lower_case_table_names) | 大文字小文字の区別を設定します。1に調整することを推奨します。これは大文字小文字を区別しないことを意味します。            |
   | [priority_networks ](../../admin-manual/config/fe-config#priority_networks) | ネットワークIPアドレスに基づいてネットワークCIDRを指定します。FQDN環境では無視できます。 |
   | JAVA_HOME                                                    | DorisにはOSから独立したJDK環境を使用することを推奨します。                |
   
3. **FEプロセスの開始**

   以下のコマンドを使用してFEプロセスを開始できます：

   ```Shell
   bin/start_fe.sh --daemon
   ```
FEプロセスが開始され、バックグラウンドで実行されます。デフォルトでは、ログはlog/ディレクトリに保存されます。起動に失敗した場合は、log/fe.logまたはlog/fe.outファイルでエラーの詳細を確認できます。

4. **FE起動状態の確認**

   MySQL Clientを使用してDorisクラスターに接続できます。デフォルトのユーザーはrootで、パスワードは空です。

   ```sql
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   ```
Dorisクラスターに接続後、`show frontends`コマンドを使用してFEノードのステータスを確認できます。通常、以下を確認する必要があります：

   - Alive: trueの場合、ノードが生きていることを示します。

   - Join: trueの場合、ノードがクラスターに参加していることを示しますが、必ずしもノードがクラスター内でアクティブであることを意味しません（接続が失われている可能性があります）。

   - IsMaster: trueの場合、現在のノードがMasterノードであることを示します。

## ステップ2：FEクラスターのデプロイ（オプション）

本番環境では、少なくとも3つのノードをデプロイすることを推奨します。FE Masterノードをデプロイした後、2つの追加のFE Followerノードをデプロイする必要があります。

1. **メタデータディレクトリの作成**

   FE Masterノードのデプロイと同じ手順に従って、`doris-meta`ディレクトリを作成します。

2. **FE Followerノード設定の変更**

   FE Masterノードと同じ手順に従って、FollowerノードのFE設定ファイルを変更します。通常、FE Masterノードから設定ファイルを単純にコピーできます。

3. **DorisクラスターでのFE Followerノードの新規登録**

   新しいFEノードを開始する前に、FEクラスターに新しいFEノードを登録する必要があります。

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   
   ## register a new FE follower node
   ALTER SYSTEM ADD FOLLOWER "<fe_ip_address>:<fe_edit_log_port>"
   ```
observer ノードを追加するには、`ADD OBSERVER` コマンドを使用します：

   ```Bash
   ## register a new FE observer node
   ALTER SYSTEM ADD OBSERVER "<fe_ip_address>:<fe_edit_log_port>"
   ```
:::caution Note
   - FE Follower ノード数（Master を含む）は奇数にする必要があります。高可用性のために 3 ノードでのデプロイを推奨します。

   - FE が高可用性モードでデプロイされている場合（1 Master、2 Followers）、FE 読み取りサービス容量を拡張するために Observer FE ノードを追加することを推奨します。
   :::

4. **FE Follower Node の起動**

   FE Follower ノードは以下のコマンドで起動でき、メタデータが自動的に同期されます。

   ```Shell
   bin/start_fe.sh --helper <helper_fe_ip>:<fe_edit_log_port> --daemon
   ```
ここで、helper_fe_ipはFEクラスター内の任意のライブノードを指します。--helperパラメータはFEの初回起動時にメタデータを同期するためにのみ使用され、その後の再起動時にはこのパラメータは不要です。

5. **Followerノードのステータス確認**

   FE Followerノードのステータスをチェックする方法は、FE Masterノードのステータスと同じです。Followerノードを追加した後、show frontendsコマンドを使用してFEノードのステータスを確認してください。Masterとは異なり、IsMasterの状態はfalseになります。

## ステップ3: BEノードのデプロイ

1. **データディレクトリの作成**

   BEプロセスはデータの計算と保存を担当します。データディレクトリはデフォルトで`be/storage`の下に配置されます。本番環境では、BEデータを別のディスクに保存し、BEデータとデプロイメントファイルを異なるディスクに配置することが一般的です。BEは複数のディスクにデータを分散することをサポートしており、複数のハードドライブのI/O機能をより有効活用できます。

   ```Bash
   ## Create a BE data storage directory on each data disk
   mkdir -p <be_storage_root_path>
   ```
2. **BE設定ファイルの変更**

   BE設定ファイルはBEデプロイメントパス下のconfディレクトリに配置されています。BEノードを開始する前に、`conf/be.conf`ファイルを変更する必要があります。

   ```Bash
   ## modify storage path for BE node
   storage_root_path=/home/disk1/doris,medium:HDD;/home/disk2/doris,medium:SSD
   
   ## modify network CIDR 
   priority_networks = 10.1.3.0/24
   
   ## modify Java Home in be/conf/be.conf
   JAVA_HOME = <your-java-home-path>
   ```
パラメータの説明は以下のとおりです：

   | パラメータ                                                         | 提案                                                  |
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

5. **BE起動状態の確認**

   Dorisクラスターに接続後、show backendsコマンドを使用してBEノードの状態を確認します。

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## check BE node status
   show backends;
   ```
通常、以下の状態に注意してください：

   - `Alive`がtrueの場合、ノードが生きていることを示します。

   - `TabletNum`はノード上のシャード数を表します。新しく追加されたノードはデータバランシングが行われ、`TabletNum`は徐々により均等に分散されます。


## ステップ4: クラスターの整合性を検証

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
3. **Doris Cluster Password の変更**

   Doris cluster が作成されると、`root` という名前のユーザーが自動的に作成され、そのパスワードはデフォルトで空に設定されます。セキュリティ上の理由により、cluster が作成された直後に `root` ユーザーに新しいパスワードを設定することを推奨します。

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

   クラスターの整合性を検証するため、新しく作成されたクラスターにテストテーブルを作成し、いくつかのデータを挿入することができます。

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
