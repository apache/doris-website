---
{
  "title": "共通操作FAQ",
  "language": "ja",
  "description": "Apache Doris運用FAQとトラブルシューティングガイド。FE/BEノード管理、ログ解析、設定最適化、バージョンアップグレード、ストレージメディア設定、負荷分散およびその他の実用的な運用シナリオに関するよくある質問に回答し、Dorisクラスター運用問題の迅速な特定と解決を支援します。"
}
---
このドキュメントは、Dorisを使用する際に遭遇する一般的な運用上の問題を記録するために使用されます。随時更新されます。

**このドキュメントで言及されているBEバイナリファイル名`doris_be`は、以前のバージョンでは`palo_be`でした。**

### Q1. DECOMMISSIONによってBEノードを廃止する際に、なぜ常にいくつかのタブレットが残るのですか？

廃止プロセス中に、`show backends`で廃止されたノードの`tabletNum`を確認すると、`tabletNum`の数が減少していることがわかります。これは、データシャードがこのノードから移行されていることを示しています。数が0に達すると、システムは自動的にこのノードを削除します。しかし、場合によっては、`tabletNum`が特定の値まで下がった後、変化が止まることがあります。これは通常、以下の2つの理由によるものと考えられます：

1. これらのタブレットは、削除されたばかりのテーブル、パーティション、またはマテリアライズドビューに属しています。新しく削除されたオブジェクトはゴミ箱に保持されます。廃止ロジックはこれらのシャードを処理しません。FE設定パラメータ`catalog_trash_expire_second`を変更して、ゴミ箱内のオブジェクトの保持時間を変更できます。オブジェクトがゴミ箱から削除されると、これらのタブレットが処理されます。

2. これらのタブレットの移行タスクで問題が発生しています。この場合、`show proc "/cluster_balance"`を使用して、具体的なタスクエラーを確認する必要があります。

上記の状況については、まず`show proc "/cluster_health/tablet_health";`を使用して、クラスタ内に不健康なシャードがあるかどうかを確認できます。0であれば、`drop backend`文でこのBEを直接削除できます。そうでなければ、不健康なシャードのレプリカ状態を具体的に確認する必要があります。

### Q2. priority_networksはどのように設定すべきですか？

`priority_networks`は、FEとBE両方の設定パラメータです。このパラメータは主に、システムが正しいネットワークカードIPを自身のIPとして選択するのを助けるために使用されます。後でマシンに新しいネットワークカードを追加することによる誤ったIP選択の問題を防ぐため、いかなる場合においてもこのパラメータを明示的に設定することをお勧めします。

`priority_networks`の値はCIDR形式で表現されます。2つの部分に分かれています：最初の部分はドット区切り10進記法のIPアドレス、2番目の部分はプレフィックス長です。例えば、`10.168.1.0/8`はすべての`10.xx.xx.xx` IPアドレスにマッチし、`10.168.1.0/16`はすべての`10.168.xx.xx` IPアドレスにマッチします。

特定のIPを直接指定するのではなくCIDR形式を使用する理由は、すべてのノードが統一された設定値を使用できるようにするためです。例えば、`10.168.10.1`と`10.168.10.2`の2つのノードがある場合、`priority_networks`の値として`10.168.10.0/24`を使用できます。

### Q3. FEのMaster、Follower、Observerとは何ですか？

まず、FEには2つの役割しかないことを明確にする必要があります：FollowerとObserverです。Masterは単にFollowerノードのグループから選出された1つのFEです。MasterはFollowerの特殊なタイプと見なすことができます。そのため、クラスタにいくつのFEがあり、どのような役割かと問われたとき、正しい答えはもちろん、すべてのFEノード数、およびFollower役割とObserver役割の数です。

Follower役割を持つすべてのFEノードは、Paxos合意プロトコルのグループ概念と似た選択可能なグループを形成します。グループ内でFollowerがMasterとして選出されます。Masterに障害が発生すると、新しいFollowerが自動的にMasterとして選出されます。Observerは選出に参加しないため、ObserverがMasterになることはありません。

メタデータログは、Followerノードの過半数に正常に書き込まれて初めて成功と見なされます。例えば、3つのFEがある場合、2回の成功した書き込みが必要です。これがFollower役割の数を奇数にする必要がある理由でもあります。

Observer役割は、その名の通り、オブザーバーとしてのみ動作し、正常に書き込まれたメタデータログを同期し、メタデータ読み取りサービスを提供します。過半数の書き込みロジックには参加しません。

通常の状況では、1 Follower + 2 Observer、または3 Followers + N Observerをデプロイできます。前者は運用保守がシンプルで、Follower間の整合性プロトコルによる複雑なエラーに遭遇することはほとんどありません（多くの企業がこのアプローチを使用）。後者はメタデータ書き込みの高可用性を保証できます。高並行性クエリシナリオの場合、Observerの数を適切に増やすことができます。

### Q4. ノードに新しいディスクを追加したとき、なぜデータが新しいディスクにバランスされないのですか？

現在のDorisのバランシング戦略はノードベースです。つまり、ノードの全体的な負荷指標（シャード数と総ディスク使用率）に基づいてクラスタ負荷を判断します。そして、高負荷ノードから低負荷ノードにデータシャードを移行します。各ノードがディスクを追加した場合、ノード全体の観点からは負荷が変わっていないため、バランシングロジックをトリガーできません。

さらに、Dorisは現在、単一ノード内のディスク間のバランシング操作をサポートしていません。そのため、新しいディスクを追加した後、データは新しいディスクにバランスされません。

しかし、ノード間でデータが移行される際、Dorisはディスク要因を考慮します。例えば、シャードがノードAからノードBに移行される場合、ノードBでディスク容量使用率が低いディスクを優先的に選択します。

ここでは、この問題を解決する3つの方法を提供します：

1. 新しいテーブルを再構築する

    `create table like`文で新しいテーブルを作成し、`insert into select`を使用して古いテーブルから新しいテーブルにデータを同期します。新しいテーブルを作成する際、新しいテーブルのデータシャードが新しいディスクに配布されるため、データも新しいディスクに書き込まれます。この方法は、データ量が少ない状況（数十GB以内）に適しています。

2. Decommissionコマンドを使用する

    `decommission`コマンドは、BEノードを安全に廃止するために使用されます。このコマンドは、最初にそのノード上のデータシャードを他のノードに移行し、その後ノードを削除します。前述のように、データ移行中はディスク使用率が低いディスクが優先されるため、この方法でデータを他のノードのディスクに「強制的に」移行できます。データ移行が完了した後、この`decommission`操作を`cancel`することで、データがこのノードにバランスバックされます。すべてのBEノードに対して上記の手順を実行すると、データはすべてのノードのすべてのディスクに均等に配布されます。

    `decommission`コマンドを実行する前に、廃止完了後にノードが削除されるのを避けるため、まず以下のコマンドを実行してください。

    `admin set frontend config("drop_backend_after_decommission" = "false");`

3. APIを使用して手動でデータを移行する

    Dorisは、1つのディスク上の指定されたデータシャードを別のディスクに移行するための[HTTP API](https://doris.apache.org/docs/dev/admin-manual/be/tablet-migration)を提供しています。

### Q5. FE/BEログを正しく読むにはどうすればよいですか？

多くの場合、ログを通じて問題をトラブルシューティングする必要があります。ここではFE/BEログの形式と確認方法について説明します。

1. FE

    FEログには主に以下が含まれます：

    - `fe.log`: メインログ。`fe.out`以外のすべての内容が含まれます。

    - `fe.warn.log`: メインログのサブセットで、WARNおよびERRORレベルのログのみを記録します。

    - `fe.out`: 標準/エラー出力ログ（stdoutとstderr）。

    - `fe.audit.log`: 監査ログで、このFEが受信したすべてのSQLリクエストを記録します。

    典型的なFEログエントリは以下のようになります：

    ```text
    2021-09-16 23:13:22,502 INFO (tablet scheduler|43) [BeLoadRebalancer.selectAlternativeTabletsForCluster():85] cluster is balance: default_cluster with medium: HDD. skip
    ```
-   `2021-09-16 23:13:22,502`: ログのタイムスタンプ。

    -   `INFO`: ログレベル、デフォルトはINFO。

    -   `(tablet scheduler|43)`: スレッド名とスレッドID。スレッドIDを通じて、このスレッドのコンテキスト情報を確認でき、このスレッドで何が起こったかのトラブルシューティングに便利。

    -   `BeLoadRebalancer.selectAlternativeTabletsForCluster():85`: クラス名、メソッド名、コード行番号。

    -   `cluster is balance xxx`: ログ内容。

    通常の状況では、主に`fe.log`ログを確認します。特別な場合には、一部のログが`fe.out`に出力される可能性があります。

2.  BE

    BEログには主に以下が含まれます：

    -   `be.INFO`: メインログ。これは実際にはソフトリンクで、最新の`be.INFO.xxxx`にリンクしています。

    -   `be.WARNING`: メインログのサブセットで、WARNとFATALレベルのログのみを記録。これは実際にはソフトリンクで、最新の`be.WARN.xxxx`にリンクしています。

    -   `be.out`: 標準/エラー出力ログ（stdoutとstderr）。

    典型的なBEログエントリは以下のとおりです：

    ```text
    I0916 23:21:22.038795 28087 task_worker_pool.cpp:1594] finish report TASK. master host: 10.10.10.10, port: 9222
    ```
-   `I0916 23:21:22.038795`: ログレベルと日時。大文字のIはINFO、WはWARN、FはFATALを表します。

    -   `28087`: スレッドid。スレッドidを通じて、このスレッドのコンテキスト情報を表示でき、このスレッドで何が起こったかのトラブルシューティングに便利です。

    -   `task_worker_pool.cpp:1594`: コードファイルと行番号。

    -   `finish report TASK xxx`: ログの内容。

    通常の状況では、主に`be.INFO`ログを確認します。BEクラッシュなどの特別な場合には、`be.out`を確認する必要があります。

### Q6. FE/BEノードがダウンした場合のトラブルシューティング方法は？

1.  BE

    BEプロセスはC/C++プロセスであり、一部のプログラムバグ（メモリ境界外アクセス、不正なアドレスアクセスなど）やOut Of Memory（OOM）により、クラッシュする可能性があります。この場合、以下の手順でエラーの原因を確認できます：

    1.  `be.out`を確認

        BEプロセスは、異常な状況によりプログラムが終了した際に、現在のエラースタックを`be.out`に出力するように実装されています（`be.INFO`や`be.WARNING`ではなく`be.out`であることに注意）。エラースタックを通じて、通常はプログラムがおかしくなった箇所を大まかに特定できます。

        なお、`be.out`にエラースタックが表示される場合、通常はプログラムバグによるものであり、一般ユーザーが自分で解決するのは困難な場合があります。WeChatグループ、GitHub Discussion、またはdevメーリングリストでサポートを求め、対応するエラースタックを投稿して迅速なトラブルシューティングを行うことをお勧めします。

    2.  dmesg

        `be.out`にスタック情報がない場合、OOMによりシステムに強制終了された可能性が高いです。この場合、`dmesg -T`コマンドを使用してLinuxシステムログを確認できます。最後に`Memory cgroup out of memory: Kill process 7187 (doris_be) score 1007 or sacrifice child`のようなログがある場合、OOMが原因であることを意味します。

        メモリ問題は、大きなクエリ、インポート、compactionなど複数の側面が原因となる可能性があります。Dorisはメモリ使用量の最適化も継続的に行っています。WeChatグループ、GitHub Discussion、またはdevメーリングリストでサポートを求めることをお勧めします。

    3.  `be.INFO`でFで始まるログがあるかを確認

        Fで始まるログはFatalログです。例えば、`F0916`は9月16日のFatalログを表します。Fatalログは通常プログラムのアサーションエラーを示し、アサーションエラーはプロセスを直接終了させます（プログラムにバグがあることを示します）。WeChatグループ、GitHub Discussion、またはdevメーリングリストでサポートを求めることをお勧めします。

2.  FE

    FEはJavaプロセスであり、C/C++プログラムよりも堅牢性が優れています。通常、FEがクラッシュする理由はOOM（Out-of-Memory）またはメタデータ書き込み失敗の可能性があります。これらのエラーは通常`fe.log`または`fe.out`にエラースタックが記録されます。エラースタック情報に基づいて、さらなるトラブルシューティングが必要です。

### Q7. データディレクトリのSSDとHDD設定について、テーブル作成時に`Failed to find enough host with storage medium and tag`エラーが発生することがあります

DorisはBEノードに複数のストレージパスを設定することをサポートしています。通常の状況では、ディスクごとに1つのストレージパスを設定すれば十分です。同時に、DorisはパスのストレージメディアムタイプをSSDやHDDなどで指定することをサポートしています。SSDは高速ストレージデバイスを表し、HDDは低速ストレージデバイスを表します。

クラスタが1つのタイプのメディアムのみを持つ場合（すべてHDDまたはすべてSSD）、ベストプラクティスは`be.conf`でメディアム属性を明示的に指定しないことです。上記の`Failed to find enough host with storage medium and tag`エラーが発生する場合、一般的には`be.conf`でSSDメディアムのみが設定されているにも関わらず、テーブル作成時に`properties {"storage_medium" = "hdd"}`が明示的に指定されている場合です。同様に、`be.conf`でHDDメディアムのみが設定されているにも関わらず、テーブル作成時に`properties {"storage_medium" = "ssd"}`が明示的に指定された場合も、上記のエラーが発生します。解決策は、テーブル作成の`properties`パラメータを設定に合わせて変更するか、`be.conf`でのSSD/HDDの明示的な設定を削除することです。

パスのストレージメディアム属性を指定することで、Dorisのホット・コールドデータパーティションストレージ機能を使用して、パーティションレベルでホットデータをSSDに保存し、コールドデータは自動的にHDDに転送されます。

注意すべき点は、Dorisはストレージパスが配置されているディスクの実際のストレージメディアムタイプを自動的に検出しないことです。このタイプはパス設定でユーザーが明示的に指定する必要があります。例えば、パス`/path/to/data1.SSD`は、このパスがSSDストレージメディアムであることを示します。そして`data1.SSD`が実際のディレクトリ名です。Dorisはディレクトリ名の後の`.SSD`サフィックスに基づいてストレージメディアムタイプを判定し、実際のストレージメディアムタイプではありません。つまり、ユーザーは任意のパスをSSDストレージメディアムとして指定でき、Dorisはディレクトリサフィックスのみを認識し、ストレージメディアムが一致するかどうかは判定しません。サフィックスが記載されていない場合、デフォルトでHDDとなります。

言い換えると、`.HDD`と`.SSD`は、ストレージディレクトリの「相対的な」「低速」と「高速」の区別を識別するためにのみ使用され、実際のストレージメディアムタイプを識別するものではありません。そのため、BEノードのストレージパス間でメディアムの違いがない場合、サフィックスを記入する必要はありません。

### Q8. 複数のFEでWeb UIロードバランシングを実現するためにNginxを使用する際、ログインできない場合

Dorisは複数のFEをデプロイできます。Web UIにアクセスする際、Nginxをロードバランシングに使用すると、Session問題により再ログインを求められる状況が続きます。この問題は実際にはSessionの共有問題です。Nginxは一元化されたSession共有ソリューションを提供しています。ここではNginxの`ip_hash`技術を使用します。`ip_hash`は特定のIPからのリクエストを同じバックエンドに向けることができるため、このIP下の特定のクライアントと特定のバックエンドが安定したSessionを確立できます。`ip_hash`は`upstream`設定で定義されます：

```text
upstream  doris.com {
   server    172.22.197.238:8030 weight=3;
   server    172.22.197.239:8030 weight=4;
   server    172.22.197.240:8030 weight=4;
   ip_hash;
}
```
完全なNginxの設定例は以下の通りです：

```text
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# Load dynamic modules. See /usr/share/doc/nginx/README.dynamic.
include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # Load modular configuration files from the /etc/nginx/conf.d directory.
    # See http://nginx.org/en/docs/ngx_core_module.html#include
    # for more information.
    include /etc/nginx/conf.d/*.conf;
    #include /etc/nginx/custom/*.conf;
    upstream  doris.com {
      server    172.22.197.238:8030 weight=3;
      server    172.22.197.239:8030 weight=4;
      server    172.22.197.240:8030 weight=4;
      ip_hash;
    }

    server {
        listen       80;
        server_name  gaia-pro-bigdata-fe02;
        if ($request_uri ~ _load) {
           return 307 http://$host$request_uri ;
        }

        location / {
            proxy_pass http://doris.com;
            proxy_redirect default;
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
 }
```
### Q9. FE起動に失敗し、fe.logに「wait catalog to be ready. FE type UNKNOWN」が連続して表示される

この問題には通常2つの原因があります：

1.  今回FEが起動した時に取得されたローカルIPが前回の起動時と一致しない場合。通常は`priority_network`が正しく設定されていないため、FEが起動時に誤ったIPアドレスにマッチしてしまうことが原因です。`priority_network`を修正してFEを再起動する必要があります。

2.  クラスター内のほとんどのFollower FEノードが起動していない場合。例えば、3つのFollowerがあるが、1つしか起動していない状態です。この場合、FE選出グループがMasterを選出してサービスを提供できるよう、少なくとも1つ以上のFEを追加で起動する必要があります。

上記の状況で解決できない場合は、Doris公式ドキュメントの[Metadata Operations Documentation](../admin-manual/trouble-shooting/metadata-operation.md)に従って復旧を行ってください。

### Q10. Lost connection to MySQL server at 'reading initial communication packet', system error: 0

MySQLクライアントを使用してDorisに接続する際に以下の問題が発生した場合、通常はFEのコンパイル時に使用されたJDKバージョンとFEの実行時に使用されるJDKバージョンが異なることが原因です。Dockerコンパイルイメージを使用してコンパイルする場合、デフォルトのJDKバージョンはOpenJDK 11であることに注意してください。コマンドを通じてOpenJDK 8に切り替えることができます（詳細はコンパイルドキュメントを参照してください）。

### Q11. recoveryTracker should overlap or follow on disk last VLSN of 4,422,880 recoveryFirst= 4,422,882 UNEXPECTED_STATE_FATAL

FEを再起動する際に上記のエラーが発生することがあります（通常は複数のFollowerがある場合のみ）。そしてエラー内の2つの値が2の差があるため、FEの起動に失敗します。

これはBDB JEのバグで、まだ解決されていません。この状況に遭遇した場合、[Metadata Operations Documentation](../admin-manual/trouble-shooting/metadata-operation.md)の障害復旧操作を通じてメタデータを復旧することしかできません。

### Q12. Dorisコンパイルとインストール時のJDKバージョン非互換問題

Dockerを使用してDorisを自分でコンパイルし、コンパイル完了後にインストールしてFEを起動する際に、例外情報`java.lang.Suchmethoderror: java.nio.ByteBuffer.limit(I)Ljava/nio/ByteBuffer;`が表示される場合があります。これはDocker内のデフォルトがJDK 11であることが原因です。インストール環境でJDK 8を使用している場合、Docker内のJDK環境をJDK 8に切り替える必要があります。具体的な切り替え方法については、[Compilation Documentation](https://doris.apache.org/community/source-install/compilation-with-docker)を参照してください。

### Q13. FEをローカルで起動またはユニットテストを開始すると「Cannot find external parser table action_table.dat」エラーが報告される

以下のコマンドを実行してください：

```bash
cd fe && mvn clean install -DskipTests
```
同じエラーが引き続き発生する場合は、以下のコマンドを手動で実行してください：

```bash
cp fe-core/target/generated-sources/cup/org/apache/doris/analysis/action_table.dat fe-core/target/classes/org/apache/doris/analysis
```
### Q15. バージョン1.2へのアップグレード後、BEがNoClassDefFoundError問題で起動に失敗する

:::note
Java UDF依存関係エラーはDorisバージョン1.2以降でサポートされています
:::

アップグレード後にBEを起動する際に以下のJava `NoClassDefFoundError`エラーが発生した場合：

```text
Exception in thread "main" java.lang.NoClassDefFoundError: org/apache/doris/udf/JniUtil
Caused by: java.lang.ClassNotFoundException: org.apache.doris.udf.JniUtil
```
Java UDF関数の依存パッケージ`apache-doris-java-udf-jar-with-dependencies-1.2.0`を公式ウェブサイトからダウンロードし、BEインストールディレクトリの`lib`ディレクトリに配置してから、BEを再起動する必要があります。

### Q16. バージョン1.2へのアップグレード後、BE起動時にFailed to initialize JNI問題が表示される

:::note
Java環境の問題は、Dorisバージョン1.2以降でサポートされています
:::

アップグレード後にBEを起動する際に、以下の`Failed to initialize JNI`エラーが発生する場合：

```text
Failed to initialize JNI: Failed to find the library libjvm.so.
```
システムで`JAVA_HOME`環境変数を設定するか、`be.conf`で`JAVA_HOME`変数を設定してから、BEノードを再起動する必要があります。

### Q17. Docker: backendの起動に失敗する
これはCPUがAVX2をサポートしていないことが原因の可能性があります。`docker logs -f be`でbackendログを確認してください。
CPUがAVX2をサポートしていない場合は、`apache/doris:1.2.2-be-x86_64`の代わりに、
`apache/doris:1.2.2-be-x86_64-noavx2`イメージを使用する必要があります。
イメージのバージョン番号は時間の経過とともに変更されることに注意してください。最新バージョンについては[Dockerhub](https://registry.hub.docker.com/r/apache/doris/tags?page=1&name=avx2)を確認してください。
