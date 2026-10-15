---
{
    "title": "ストレージ・コンピュート一体型クラスターの手動デプロイ",
    "sidebar_label": "ストレージ・コンピュート一体型クラスターの手動デプロイ",
    "language": "ja",
    "description": "Linux 上で Apache Doris のストレージ・コンピュート一体型クラスターを手動でデプロイする方法。FE/BE ノードのデプロイ、設定、検証を含み、本番クラスターの構築に適しています。",
    "keywords": [
      "Doris のデプロイ",
      "ストレージ・コンピュート一体型のデプロイ",
      "FE ノードのデプロイ",
      "BE ノードのデプロイ",
      "Doris クラスターの構築",
      "Doris の手動インストール"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Cluster deployment / Environment acceptance -->

ストレージ・コンピュート一体型クラスターのデプロイは、次の四ステップで行います。

1. **FE Master ノードをデプロイする**：最初の FE ノードを Master ノードとしてデプロイします。
  
2. **FE クラスターをデプロイする（任意）**：Follower または Observer の FE ノードを追加して、FE クラスターをデプロイします。
  
3. **BE ノードをデプロイする**：BE ノードを FE クラスターに登録します。

4. **クラスターの正常動作を確認する**：デプロイ後、クラスターに接続して正常に動作することを確認します。

デプロイを始める前に、該当するバージョンの Doris を[ダウンロード](https://doris.apache.org/download)できます。

## 前提条件

デプロイを始める前に、次の条件を満たしていることを確認してください。

| 確認項目 | 要件 | 関連ドキュメント |
|--------|------|---------|
| オペレーティングシステム | CentOS 7+ / Ubuntu 22.04+ | [オペレーティングシステムの確認](../preparation/os-checking.md) |
| JDK のバージョン | JDK 17+ | - |
| ネットワーク | ノード間で通信でき、必要なポートにアクセスできること | [環境の確認](../preparation/env-checking.md) |
| ディスク容量 | FE は 100GB 以上、BE は 500GB 以上を推奨 | [クラスターの計画](../preparation/cluster-planning.md) |

[環境の確認](../preparation/env-checking.md)、[オペレーティングシステムの確認](../preparation/os-checking.md)、[クラスターの計画](../preparation/cluster-planning.md)などの事前確認と計画が完了したら、ストレージ・コンピュート一体型クラスターのデプロイを開始できます。


## ステップ 1：FE Master ノードをデプロイする

1. **メタデータの保存先を作成する**

   FE のデータは、BE ノードとは別のディスクに保存することを推奨します。

   インストールパッケージを展開すると、デフォルトの `doris-meta` ディレクトリが含まれています。メタデータ専用のディレクトリを作成し、デフォルトの `doris-meta` ディレクトリからそこへのシンボリックリンクを作成することを推奨します。本番環境では専用の SSD を使用し、Doris のインストールディレクトリ内には配置しないでください。開発環境とテスト環境では、デフォルトの設定を使用できます。

   ```SQL
   ## Use a separate disk for FE metadata
   mkdir -p <doris_meta_created>
      
   ## Create FE metadata directory symlink
   ln -s <doris_meta_created> <doris_meta_original>
   ```

2. **FE の設定ファイルを変更する**

   FE の設定ファイルは、FE のデプロイ先の `conf` ディレクトリにあります。FE ノードを起動する前に、`conf/fe.conf` を変更する必要があります。

    FE ノードをデプロイする前に、次の設定を調整することを推奨します。

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

   各パラメーターの説明は次のとおりです。設定項目の詳細については、[FE の設定項目](../../admin-manual/config/fe-config)を参照してください。

   | パラメーター | 推奨設定 |
   | ------------------------------------------------------------ | --------------------------------------------------------- |
   | JAVA_OPTS | `-Xmx` を使用して Java ヒープを調整します。本番環境では 16G 以上を推奨します。 |
   | [lower_case_table_names ](../../admin-manual/config/fe-config#lower_case_table_names) | 大文字と小文字の区別を設定します。1（区別しない）を推奨します。（このパラメーターはクラスター作成後に変更できません。） |
   | [priority_networks ](../../admin-manual/config/fe-config#priority_networks) | ノードの IP アドレスに基づいて指定するネットワーク CIDR です。FQDN 環境では省略できます。 |
   | JAVA_HOME | オペレーティングシステムとは独立した JDK 環境を Doris に使用することを推奨します。 |
   
3. **FE プロセスを起動する**

   次のコマンドで FE プロセスを起動します。

   ```Shell
   bin/start_fe.sh --daemon
   ```

   FE プロセスはバックグラウンドで起動し、ログはデフォルトで `log/` ディレクトリに保存されます。起動に失敗した場合は、`log/fe.log` または `log/fe.out` のエラーメッセージを確認してください。

4. **FE の起動状態を確認する**

   MySQL クライアントで Doris クラスターに接続します。初期ユーザーは `root` で、デフォルトのパスワードは空です。

   ```SQL

   mysql -uroot -P<fe_query_port> -h<fe_ip_address>

   ```

   Doris クラスターに接続したら、`show frontends` コマンドで FE の状態を確認できます。通常は、次の点を確認します。

   - Alive が `true` の場合、ノードは稼働しています。

   - Join が `true` の場合、ノードはクラスターに参加したことを示します。ただし、現在もクラスターに接続しているとは限りません（切断されている可能性があります）。

   - IsMaster が true の場合、そのノードは Master ノードです。

## ステップ 2：FE クラスターをデプロイする（任意）

単一の FE ノードはテストや検証に使用できます。本番環境では、少なくとも 3 ノードをデプロイすることを推奨します。FE Master ノードのデプロイ後、さらに二つの FE Follower ノードをデプロイする必要があります。

1. **メタデータディレクトリを作成する**

   FE Master ノードのデプロイ手順を参照して、`doris-meta` ディレクトリを作成します。

2. **FE Follower の設定ファイルを変更する**

   FE Master ノードのデプロイ手順を参照して、FE Follower の設定ファイルを変更します。通常は、FE Master の設定ファイルをそのままコピーできます。

3. **新しい FE Follower ノードを Doris クラスターに登録する**

   新しい FE ノードを起動する前に、FE クラスターに登録する必要があります。

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   
   ## register a new FE follower node
   ALTER SYSTEM ADD FOLLOWER "<fe_ip_address>:<fe_edit_log_port>"
   ```

   Observer ノードを追加するには、`ADD OBSERVER` コマンドを使用します。

   ```Bash
   ## register a new FE observer node
   ALTER SYSTEM ADD OBSERVER "<fe_ip_address>:<fe_edit_log_port>"
   ```

   :::caution 注意
   - FE Follower ノード（Master を含む）の数は奇数にしてください。高可用性を確保するには、3 ノードのデプロイを推奨します。

   - FE を高可用性モード（Master 1 ノード、Follower 2 ノード）でデプロイする場合、FE の読み取り処理能力を拡張するために Observer FE を追加することを推奨します。
   :::

4. **FE Follower ノードを起動する**

   次のコマンドで FE Follower ノードを起動し、メタデータを自動的に同期します。

   ```Shell
   bin/start_fe.sh --helper <helper_fe_ip>:<fe_edit_log_port> --daemon
   ```

   ここで、`helper_fe_ip` は FE クラスター内で稼働しているいずれかのノードの IP アドレスです。`--helper` パラメーターが必要なのは FE を初めて起動するときだけで、以降の再起動では不要です。

5. **Follower ノードの状態を確認する**

   FE Master ノードの場合と同様に、Follower ノードを追加した後は `show frontends` コマンドでノードの状態を確認します。IsMaster は false になっている必要があります。

## ステップ 3：BE ノードをデプロイする

1. **データディレクトリを作成する**

   BE プロセスはデータの計算と保存に使用します。データディレクトリはデフォルトで `be/storage` 以下に配置されます。本番環境では、BE のデータと BE のデプロイファイルを通常は別のディスクに保存します。BE は複数のディスクにデータを分散できるため、各ディスクの I/O 能力をより有効に活用できます。

   ```Bash
   ## Create a BE data storage directory on each data disk
   mkdir -p <be_storage_root_path>
   ```

2. **BE の設定ファイルを変更する**

   BE の設定ファイルは、BE のデプロイ先の `conf` ディレクトリにあります。BE ノードを起動する前に、`conf/be.conf` を変更する必要があります。

   ```Bash
   ## modify storage path for BE node
   storage_root_path=/home/disk1/doris,medium:HDD;/home/disk2/doris,medium:SSD
   
   ## modify network CIDR 
   priority_networks = 10.1.3.0/24
   
   ## modify Java Home in be/conf/be.conf
   JAVA_HOME = <your-java-home-path>
   ```
   
   各パラメーターの説明は次のとおりです。

   | パラメーター | 推奨設定 |
   | ------------------------------------------------------------ | --------------------------------------------------------- |
   | [priority_networks](../../admin-manual/config/be-config#priority_networks) | ノードの IP アドレスに基づいて指定するネットワーク CIDR です。FQDN 環境では省略できます。 |
   | JAVA_OPTS | `-Xmx` を使用して Java ヒープを調整します。本番環境では 2G 以上を推奨します。 |
   | JAVA_HOME | オペレーティングシステムとは独立した JDK 環境を Doris に使用することを推奨します。 |

3. **BE ノードを Doris に登録する**

   BE ノードを起動する前に、FE クラスターに登録する必要があります。

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## register BE node
   ALTER SYSTEM ADD BACKEND "<be_ip_address>:<be_heartbeat_service_port>"
   ```

4. **BE プロセスを起動する**

   次のコマンドで BE プロセスを起動します。

   ```Bash
   bin/start_be.sh --daemon
   ```

   BE プロセスはバックグラウンドで起動し、ログはデフォルトで `log/` ディレクトリに保存されます。起動に失敗した場合は、`log/be.log` または `log/be.out` のエラーメッセージを確認してください。

5. **BE の起動状態を確認する**

   Doris クラスターに接続したら、`show backends` コマンドで BE ノードの状態を確認できます。

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## check BE node status
   show backends;
   ```

   通常は、次の点に注意してください。

   - Alive が true の場合、ノードは稼働しています。

   - TabletNum は、そのノード上のタブレット数を示します。新しく追加したノードではデータのバランシングが行われ、TabletNum は徐々に平均値に近づきます。

## ステップ 4：クラスターの正常動作を確認する

1. **データベースにログインする**

   MySQL クライアントで Doris クラスターにログインします。

   ```Bash
   ## connect a alive fe node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   ```

2. **Doris のインストール情報を確認する**

   `show frontends` と `show backends` を使用して、データベース内の各インスタンスの情報を表示します。
   
   ```SQL
   -- check fe status
   show frontends;

   -- check be status
   show backends;
   ```

3. **Doris クラスターのパスワードを変更する**

   Doris クラスターの作成時に、システムはデフォルトでパスワードが空の `root` ユーザーを自動作成します。セキュリティを高めるため、クラスター作成後すぐに `root` ユーザーの新しいパスワードを設定することを推奨します。

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

4. **テストテーブルを作成してデータを挿入する**

   クラスターが正常に動作していることを確認するため、新しく作成したクラスターにテストテーブルを作成し、テストデータを挿入します。

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

   Doris は MySQL プロトコルと互換性があるため、`INSERT` 文を使用してデータを挿入できます。

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

---

## 注意事項

- FE のメタデータディレクトリには専用の SSD を使用することを推奨します。Doris のインストールディレクトリ内には配置しないでください。
- BE のデータディレクトリは、`storage_root_path` パラメーターを使用して複数のディスクに設定できます。形式は `path1,medium:HDD;path2,medium:SSD` です。
- 本番環境では、高可用性を確保するために 3 つの FE Follower ノードをデプロイすることを推奨します。
- `lower_case_table_names` パラメーターはクラスター作成後に変更できません。初期化時に設定を確認してください。
- `priority_networks` パラメーターは、ノードの IP が属するサブネットに一致するよう、実際のネットワークに合わせて設定する必要があります。

## よくある質問

### Q：FE の起動に失敗した場合は、どのように調査しますか？

1. Java 環境を確認します。`echo $JAVA_HOME` を実行し、JDK がインストールされていることを確認してください。
2. ログを確認します。`tail -100 log/fe.log` を実行し、`Exception` または `ERROR` を探してください。
3. よくあるエラー：
   - **ポートがすでに使用されている**：`query_port`（デフォルトは 9030）のポート番号がすでに使用されていないか、`fe.conf` の設定を確認してください。
   - **メタデータディレクトリの権限**：`doris-meta` ディレクトリの読み書きができることを確認してください。

### Q：BE を FE クラスターに登録できない場合は、どうすればよいですか？

1. FE クラスターが正常に稼働していることを確認します。`show frontends` を実行して Alive の状態を確認してください。
2. ネットワーク接続を確認します。`telnet <fe_ip> 9030` を実行してポートをテストしてください。
3. BE の設定を確認します。`priority_networks` の設定が実際の IP に一致するか、`be.conf` を確認してください。
4. BE のログを確認します。`tail -100 log/be.log` を実行して登録失敗の原因を調べてください。

### Q：クラスターの稼働状態を確認するには、どうすればよいですか？

```SQL
-- Check FE status
SHOW FRONTENDS;

-- Check BE status
SHOW BACKENDS;
-- Confirm that Alive is true for all BEs
```

### Q：root のパスワードを忘れた場合は、どうすればリセットできますか？

FE ノード上で 127.0.0.1 経由で接続し、パスワードなしで root としてログインしてから、パスワードを変更します。

```Bash
mysql -h127.0.0.1 -P9030 -uroot

-- Reset password
SET PASSWORD = PASSWORD('your_new_password');
```

---

## トラブルシューティング

| 症状 | 考えられる原因 | 対処方法 |
|---------|---------|---------|
| FE が起動しない | ポートがすでに使用されている | `fe.conf` のポートを変更するか、そのポートを使用しているプロセスを停止します |
| FE のメタデータ同期に失敗する | ネットワークの問題、またはノードの切断 | ノード間のネットワークを確認し、`priority_networks` が正しく設定されていることを確認します |
| BE の登録に失敗する | FE クラスターを利用できない | 少なくとも一つの FE ノードの Alive が true であることを確認します |
| BE の Alive が表示されるが Tablet がない | データのバランシングが完了していない | しばらく待ちます。新しいノードではデータのバランシングが自動的に行われます |
| パスワードの変更に失敗する | 構文エラー、または権限の問題 | `SET PASSWORD = PASSWORD('new_password')` という構文を使用します |
