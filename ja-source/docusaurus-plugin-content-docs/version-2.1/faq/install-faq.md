---
{
  "title": "インストールエラー",
  "language": "ja",
  "description": "この文書は主にDorisの使用中における運用・保守の一般的な問題を記録するために使用され、随時更新されます。"
}
---
# 運用・保守エラー

このドキュメントは主にDorisの使用中における運用・保守の一般的な問題を記録するために使用されます。随時更新されます。

**このドキュメントに登場するBEバイナリの名前は`doris_be`ですが、以前のバージョンでは`palo_be`でした。**

### Q1. DECOMMISSIONを通じてBEノードをログオフする際、なぜ常にいくつかのtabletが残るのですか？

オフライン処理中、show backendsを使用してオフラインノードのtabletNumを確認すると、tabletNumの数が減少していることが確認でき、これはデータシャードがこのノードから移行されていることを示します。この数が0まで減少すると、システムは自動的にそのノードを削除します。しかし、場合によっては、tabletNumが特定の値まで下がった後に変化しなくなることがあります。これは通常、2つの理由によるものです：

1. これらのtabletは、削除されたばかりのテーブル、パーティション、またはマテリアライズドビューに属しています。削除されたばかりのオブジェクトはごみ箱に残っています。オフラインロジックはこれらのシャードを処理しません。オブジェクトがごみ箱に留まる時間は、FE設定パラメータcatalog_trash_expire_secondを変更することで変更できます。これらのtabletは、オブジェクトがごみ箱から削除される際に処理されます。
2. これらのtabletの移行タスクに問題があります。この場合、`show proc "/cluster_balance"`を通じて特定のタスクのエラーを確認する必要があります。

上記の状況については、まず`show proc "/cluster_health/tablet_health";`を通じてクラスタ内に不健全なシャードがあるかどうかを確認できます。これが0の場合、drop backend文を通じて直接BEを削除できます。そうでない場合は、不健全なシャードのレプリカを詳細に確認する必要があります。

### Q2. priorty_networkはどのように設定すべきですか？

priorty_networkはFEとBE両方の設定パラメータです。このパラメータは主にシステムが正しいネットワークカードIPを自身のIPとして選択するのを支援するために使用されます。後続のマシンに新しいネットワークカードを追加することによって引き起こされる誤ったIP選択の問題を防ぐため、いかなる場合でもこのパラメータを明示的に設定することを推奨します。

priorty_networkの値はCIDR形式で表現されます。2つの部分に分かれており、最初の部分はドット区切り十進表記のIPアドレス、2番目の部分は接頭辞長です。例えば10.168.1.0/8はすべての10.xx.xx.xxのIPアドレスにマッチし、10.168.1.0/16はすべての10.168.xx.xxのIPアドレスにマッチします。

特定のIPを直接指定するのではなくCIDR形式を使用する理由は、すべてのノードが統一された設定値を使用できるようにするためです。例えば、10.168.10.1と10.168.10.2という2つのノードがある場合、priorty_networkの値として10.168.10.0/24を使用できます。

### Q3. FEのMaster、Follower、Observerとは何ですか？

まず、FEには2つの役割のみが存在することを明確にしましょう：FollowerとObserverです。Masterは単にFollowerノードのグループから選出されたFEです。MasterはFollowerの特別な種類と見なすことができます。そのため、クラスタにいくつのFEがあり、それぞれの役割が何かと聞かれた場合、正しい答えはすべてのFEノードの数、Follower役割の数、Observer役割の数であるべきです。

Follower役割のすべてのFEノードは選択可能なグループを形成し、これはPaxos合意プロトコルのグループ概念に類似しています。FollowerがグループでMasterとして選出されます。Masterがダウンすると、新しいFollowerが自動的にMasterとして選択されます。Observerは選出に参加しないため、ObserverがMasterと呼ばれることはありません。

メタデータログは大部分のFollowerノードで正常に書き込まれる必要があり、これが成功と見なされます。例えば、3つのFEがある場合、2つでのみ正常に書き込まれる可能性があります。これがFollower役割の数が奇数である必要がある理由です。

Observerの役割はこの単語の意味と同じです。正常に書き込まれたメタデータログを同期し、メタデータ読み取りサービスを提供するオブザーバーとしてのみ機能します。大部分への書き込みのロジックには関与しません。

通常、1 Follower + 2 Observer または 3 Follower + N Observer をデプロイできます。前者は運用保守が簡単で、follower間の一貫性合意によって引き起こされるような複雑なエラー状況はほとんどありません（ほとんどの企業がこの方法を使用）。後者はメタデータ書き込みの高可用性を保証できます。高同期クエリのシナリオの場合、Observerを適切に追加できます。

### Q4. ノードに新しいディスクが追加されたのに、なぜデータが新しいディスクにバランスされないのですか？

現在のDorisのバランシング戦略はノードベースです。つまり、ノードの全体的な負荷指標（シャード数と総ディスク使用率）に従ってクラスタ負荷を判断します。そして、高負荷ノードから低負荷ノードへデータシャードを移行します。各ノードがディスクを追加した場合、ノードの全体的な観点では負荷は変化しないため、バランシングロジックをトリガーできません。

さらに、Dorisは現在、単一ノード内のディスク間のバランシング操作をサポートしていません。そのため、新しいディスクを追加した後、データは新しいディスクにバランスされません。

ただし、ノード間でデータが移行される際、Dorisはディスクを考慮に入れます。例えば、シャードがノードAからノードBに移行される際、ノードB内のディスク容量使用率の低いディスクが優先的に選択されます。

ここでは、この問題を解決する3つの方法を提供します：

1. 新しいテーブルを再構築する

   create table like文を通じて新しいテーブルを作成し、次にinsert into select方法を使用して古いテーブルから新しいテーブルにデータを同期します。新しいテーブルが作成される際、新しいテーブルのデータシャードは新しいディスクに分散されるため、データも新しいディスクに書き込まれます。この方法は、データ量が少ない場合（数十GB以内）に適しています。

2. Decommissionコマンドを通じて

   decommissionコマンドはBEノードを安全に廃止するために使用されます。このコマンドはまず、ノード上のデータシャードを他のノードに移行し、その後ノードを削除します。前述のように、データ移行中は、ディスク使用率の低いディスクが優先されるため、この方法はデータを他のノードのディスクに「強制的に」移行できます。データ移行が完了したら、decommission操作をキャンセルし、データがこのノードに再バランスされるようにします。すべてのBEノードで上記の手順を実行すると、データはすべてのノードのすべてのディスクに均等に分散されます。

   decommissionコマンドを実行する前に、ノードがオフライン後に削除されることを避けるため、以下のコマンドを実行してください。

   `admin set frontend config("drop_backend_after_decommission" = "false");`

3. APIを使用してデータを手動で移行する

   DorisはHTTP APIを提供し、1つのディスク上のデータシャードを別のディスクに手動で指定して移行できます。

### Q5. FE/BEログを正しく読み取る方法は？

多くの場合、ログを通じて問題をトラブルシューティングする必要があります。ここではFE/BEログのフォーマットと確認方法について説明します。

1. FE

   FEログには主に以下が含まれます：

   - fe.log：メインログ。fe.out以外のすべてを含みます。
   - fe.warn.log：メインログのサブセットで、WARNとERRORレベルのログのみが記録されます。
   - fe.out：標準/エラー出力（stdoutとstderr）のログ。
   - fe.audit.log：監査ログで、このFEが受信したすべてのSQLリクエストを記録します。

   典型的なFEログは以下の通りです：

   ```text
   2021-09-16 23:13:22,502 INFO (tablet scheduler|43) [BeLoadRebalancer.selectAlternativeTabletsForCluster():85] cluster is balance: default_cluster with medium: HDD.skip
   ```
- `2021-09-16 23:13:22,502`: ログ時刻。
   - `INFO: ログレベル、デフォルトはINFOです`。
   - `(tablet scheduler|43)`: スレッド名とスレッドID。スレッドIDを通じて、このスレッドのコンテキスト情報を表示し、このスレッドで何が起こったかを確認できます。
   - `BeLoadRebalancer.selectAlternativeTabletsForCluster():85`: クラス名、メソッド名、コード行番号。
   - `cluster is balance xxx`: ログ内容。

   通常、主にfe.logログを確認します。特別な場合、一部のログがfe.outに出力される可能性があります。

2. BE

   BEログには主に以下が含まれます：

   - be.INFO: メインログ。これは実際にはソフトリンクで、最新のbe.INFO.xxxxに接続されています。
   - be.WARNING: メインログのサブセットで、WARNとFATALレベルのログのみが記録されます。これは実際にはソフトリンクで、最新のbe.WARN.xxxxに接続されています。
   - be.out: 標準/エラー出力（stdoutとstderr）のログ。

   典型的なBEログは以下の通りです：

   ```text
   I0916 23:21:22.038795 28087 task_worker_pool.cpp:1594] finish report TASK. master host: 10.10.10.10, port: 9222
   ```
- `I0916 23:21:22.038795`: ログレベルと日時。大文字の I は INFO、W は WARN、F は FATAL を意味します。
   - `28087`: スレッド ID。スレッド ID を通じて、このスレッドのコンテキスト情報を表示し、このスレッドで何が起こったかを確認できます。
   - `task_worker_pool.cpp:1594`: コードファイルと行番号。
   - `finish report TASK xxx`: ログ内容。

   通常は主に be.INFO ログを確認します。BE のダウンタイムなどの特別なケースでは、be.out を確認する必要があります。

### Q6. FE/BE ノードがダウンした場合のトラブルシューティング方法は？

1. BE

   BE プロセスは C/C++ プロセスであり、プログラムのバグ（メモリ境界外アクセス、不正なアドレスアクセスなど）や Out Of Memory (OOM) によってハングアップする可能性があります。この場合、以下の手順でエラーの原因を確認できます：

   1. be.out を確認

      BE プロセスは、例外によってプログラムが終了する際に、現在のエラースタックを be.out に出力することを実現しています（be.out であり、be.INFO や be.WARNING ではないことに注意）。エラースタックを通じて、通常はプログラムのどこで問題が発生したかを大まかに把握できます。

      be.out にエラースタックがある場合、通常はプログラムのバグによるものであり、一般ユーザーが自力で解決できない可能性があることに注意してください。WeChat グループ、github discussion、または dev mail group でのサポートを歓迎しており、対応するエラースタックを投稿することで、迅速にトラブルシューティングを行うことができます。

   2. dmesg

      be.out にスタック情報がない場合、システムによって OOM で強制的に kill された可能性が高いです。この場合、dmesg -T コマンドを使用して Linux システムログを確認できます。末尾に Memory cgroup out of memory: Kill process 7187 (doris_be) score 1007 or sacrifice child のようなログが表示されていれば、OOM が原因であることを意味します。

      メモリ問題には、大きなクエリ、インポート、compaction など多くの理由が考えられます。Doris も継続的にメモリ使用量を最適化しています。WeChat グループ、github discussion、または dev mail group でのサポートを歓迎しています。

   3. be.INFO で F で始まるログがあるかを確認。

      F で始まるログは Fatal ログです。例えば、F0916 は 9月16日の Fatal ログを示します。Fatal ログは通常、プログラムのアサーションエラーを示し、アサーションエラーは直接プロセスの終了を引き起こします（プログラムのバグを示します）。WeChat グループ、github discussion、または dev mail group でのサポートを歓迎しています。

2. FE

   FE は java プロセスであり、C/C++ プログラムよりも堅牢性が優れています。通常、FE がハングアップする理由は OOM (Out-of-Memory) やメタデータ書き込み失敗である可能性があります。これらのエラーは通常、fe.log または fe.out にエラースタックがあります。エラースタック情報に基づいてさらなる調査が必要です。

### Q7. データディレクトリ SSD と HDD の設定について、テーブル作成時に `Failed to find enough host with storage medium and tag` エラーが発生

Doris は 1 つの BE ノードで複数のストレージパスの設定をサポートします。通常、各ディスクに対して 1 つのストレージパスを設定できます。同時に、Doris はパスを指定するストレージメディアプロパティ（SSD や HDD など）をサポートします。SSD は高速ストレージデバイス、HDD は低速ストレージデバイスを表します。

クラスタが 1 つのタイプのメディアのみを持つ場合（すべて HDD またはすべて SSD）、ベストプラクティスは be.conf でメディアプロパティを明示的に指定しないことです。上記の ```Failed to find enough host with storage medium and tag``` エラーが発生した場合、一般的には be.conf で SSD メディアのみが設定されているのに、テーブル作成段階で ```properties {"storage_medium" = "hdd"}``` を明示的に指定しているためです。同様に、be.conf で HDD メディアのみが設定されているのに、テーブル作成段階で ```properties {"storage_medium" = "ssd"}``` を明示的に指定した場合も、同じエラーが発生します。解決策は、テーブル作成の properties パラメータを設定に合わせて修正するか、be.conf での SSD/HDD の明示的な設定を削除することです。

パスのストレージメディアプロパティを指定することで、Doris のホット・コールドデータパーティションストレージ機能を活用して、ホットデータをパーティションレベルで SSD に保存し、コールドデータを自動的に HDD に転送できます。

Doris はストレージパスが配置されているディスクの実際のストレージメディアタイプを自動的に認識しないことに注意が必要です。このタイプは、パス設定でユーザーが明示的に示す必要があります。例えば、パス "/path/to/data1.SSD" は、このパスが SSD ストレージメディアであることを意味します。そして "data1.SSD" が実際のディレクトリ名です。Doris はディレクトリ名の後の ".SSD" サフィックスに基づいてストレージメディアタイプを決定し、実際のストレージメディアタイプではありません。つまり、ユーザーは任意のパスを SSD ストレージメディアとして指定でき、Doris はディレクトリサフィックスのみを認識し、ストレージメディアが一致するかは判断しません。サフィックスが書かれていない場合は、デフォルトで HDD になります。

言い換えれば、".HDD" と ".SSD" は、ストレージディレクトリの「相対的な」「低速」と「高速」を識別するためにのみ使用され、実際のストレージメディアタイプではありません。したがって、BE ノード上のストレージパスにメディアの違いがない場合は、サフィックスを記入する必要はありません。

### Q8. Nginx を使用して Web UI ロードバランシングを実装する際に、複数の FE でログインできない

Doris は複数の FE をデプロイできます。Web UI にアクセスする際、Nginx をロードバランシングに使用すると、セッションの問題により常にログインの再入力が求められます。この問題は実際にはセッション共有の問題です。Nginx は集中型セッション共有ソリューションを提供します。ここでは nginx の ip_hash 技術を使用します。ip_hash は ip のリクエストを同じバックエンドに振り向けることができるため、この ip 下のクライアントとバックエンドが安定したセッションを確立できます。ip_hash は upstream 設定で定義されます：

```text
upstream doris.com {
   server 172.22.197.238:8030 weight=3;
   server 172.22.197.239:8030 weight=4;
   server 172.22.197.240:8030 weight=4;
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
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Load modular configuration files from the /etc/nginx/conf.d directory.
    # See http://nginx.org/en/docs/ngx_core_module.html#include
    # for more information.
    include /etc/nginx/conf.d/*.conf;
    #include /etc/nginx/custom/*.conf;
    upstream doris.com {
      server 172.22.197.238:8030 weight=3;
      server 172.22.197.239:8030 weight=4;
      server 172.22.197.240:8030 weight=4;
      ip_hash;
    }

    server {
        listen 80;
        server_name gaia-pro-bigdata-fe02;
        if ($request_uri ~ _load) {
           return 307 http://$host$request_uri ;
        }

        location / {
            proxy_pass http://doris.com;
            proxy_redirect default;
        }
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root html;
        }
    }
 }
```
### Q9. FE起動失敗、「wait catalog to be ready. FE type UNKNOWN」がfe.logに繰り返し表示される

この問題には通常2つの原因があります：

1. 今回FEが起動した際に取得したローカルIPが前回の起動時と一致しない。これは通常`priority_network`が正しく設定されていないために発生し、FE起動時に間違ったIPアドレスがマッチしてしまいます。`priority_network`を修正してからFEを再起動してください。
2. クラスター内のほとんどのFollower FEノードが起動していない。例えば、3つのFollowerがあり、1つしか起動していない場合です。この場合、少なくとも1つ以上の他のFEを起動する必要があり、そうすることでFE選択可能グループがMasterを選出してサービスを提供できるようになります。

上記の状況で解決できない場合は、Doris公式サイトドキュメントの[metadata operation and maintenance document](../admin-manual/trouble-shooting/metadata-operation.md)に従って復旧できます。

### Q10. Lost connection to MySQL server at 'reading initial communication packet', system error: 0

MySQLクライアントを使用してDorisに接続する際に以下の問題が発生する場合、これは通常FEをコンパイルする際に使用したjdkバージョンとFEを実行する際に使用するjdkバージョンが異なることが原因です。dockerを使用してイメージをコンパイルする場合、デフォルトのJDKバージョンはopenjdk 11であり、コマンドを通じてopenjdk 8に切り替えることができます（詳細はコンパイルドキュメントを参照してください）。

### Q11. recoveryTracker should overlap or follow on disk last VLSN of 4,422,880 recoveryFirst= 4,422,882 UNEXPECTED_STATE_FATAL

FEを再起動する際に上記のエラーが発生することがあります（通常は複数のFollowerがある場合のみ）。エラー内の2つの値は2の差があります。これによりFEの起動が失敗します。

これはまだ解決されていないbdbjeのバグです。この場合、[Metadata Operation and Maintenance Documentation](../admin-manual/trouble-shooting/metadata-operation.md)の障害復旧操作を実行してメタデータを復元することしかできません。

### Q12. Dorisコンパイルとインストール JDKバージョン非互換性の問題

Dockerを使用してDorisをコンパイルし、コンパイルとインストール後にFEを起動すると、例外メッセージ`java.lang.Suchmethoderror: java.nio.ByteBuffer.limit (I)Ljava/nio/ByteBuffer;`が表示されます。これはDockerではデフォルトでJDK 11が使用されているためです。インストール環境でJDK8を使用している場合は、DockerでJDK環境をJDK8に切り替える必要があります。具体的な切り替え方法については、[Compile Documentation](https://doris.apache.org/community/source-install/compilation-with-docker)を参照してください。

### Q13. ローカルでFE起動またはunit testのエラー Cannot find external parser table action_table.dat
以下のコマンドを実行してください

```
cd fe && mvn clean install -DskipTests
```
同じエラーが報告された場合は、以下のコマンドを実行してください

```
cp fe-core/target/generated-sources/cup/org/apache/doris/analysis/action_table.dat fe-core/target/classes/org/apache/doris/analysis
```
### ### Q14. Dorisがバージョン1.0以降にアップグレードし、ODBC経由でMySQL外観で「Failed to set ciphers to use (2026)」エラーが報告される。
この問題は、dorisがバージョン1.0にアップグレードしてConnector/ODBC 8.0.x以上を使用した後に発生します。Connector/ODBC 8.0.xには複数のアクセス方法があり、例えばyum経由でインストールされる`/usr/lib64/libmyodbc8w.so`は`libssl.so.10`と`libcrypto.so.10`に依存しています。
doris 1.0以降では、opensslは1.1にアップグレードされ、dorisバイナリパッケージに組み込まれているため、これによりopensslの競合と以下のようなエラーが発生する可能性があります

```
ERROR 1105 (HY000): errCode = 2, detailMessage = driver connect Error: HY000 [MySQL][ODBC 8.0(w) Driver]SSL connection error: Failed to set ciphers to use (2026)
```
解決策は、ODBC ConnectorのバージョンとしてConnector/ODBC 8.0.28を使用し、オペレーティングシステムでLinux - Genericを選択することです。このバージョンのODBC Driverはopenssl version 1.1を使用しています。または、より低いバージョンのODBC connectorを使用してください。例えば[Connector/ODBC 5.3.14](https://dev.mysql.com/downloads/connector/odbc/5.3.html)です。詳細については、[ODBC exterior documentation](https://doris.apache.org/docs/1.2/lakehouse/external-table/odbc)を参照してください。

MySQL ODBC Driverで使用されているopensslのバージョンは以下の方法で確認できます

```
ldd /path/to/libmyodbc8w.so |grep libssl.so
```
出力に ``libssl.so.10`` が含まれている場合、それを使用する際に問題が発生する可能性があります。``libssl.so.1.1`` が含まれている場合は、doris 1.0と互換性があります。

### Q15. バージョン1.2へのアップグレード後、BE NoClassDefFoundErrorの問題で起動に失敗する
Java UDF依存関係エラー
アップグレードサポートでbeを起動する場合、以下のJava `NoClassDefFoundError`エラーが発生します

```
Exception in thread "main" java.lang.NoClassDefFoundError: org/apache/doris/udf/IniUtil
Caused by: java.lang.ClassNotFoundException: org.apache.doris.udf.JniUtil
```
`apache-doris-java-udf-jar-with-dependencies-1.2.0` のJava UDF関数依存パッケージを公式Webサイトからダウンロードし、BEインストールディレクトリ下のlibディレクトリに配置してから、BEを再起動する必要があります

### Q16. バージョン1.2にアップグレード後、BE起動時に Failed to initialize JNI が表示される

アップグレード後にBEを起動する際に以下の `Failed to initialize JNI` エラーが発生した場合

```
Failed to initialize JNI: Failed to find the library libjvm.so.
```
`JAVA_HOME`環境変数を設定するか、be.confで`JAVA_HOME`変数を設定してBEノードを再起動する必要があります。

### Q17. Docker: backendの起動に失敗する
これはCPUがAVX2をサポートしていないことが原因の可能性があります。`docker logs -f be`でbackendログを確認してください。
CPUがAVX2をサポートしていない場合は、`apache/doris:1.2.2-be-x86_64`の代わりに、
`apache/doris:1.2.2-be-x86_64-noavx2`イメージを使用する必要があります。
イメージのバージョン番号は時間の経過とともに変更されるため、最新バージョンについては[Dockerhub](https://registry.hub.docker.com/r/apache/doris/tags?page=1&name=avx2)を確認してください。
