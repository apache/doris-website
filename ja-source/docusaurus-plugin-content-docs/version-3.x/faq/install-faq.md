---
{
  "title": "よくある操作に関するFAQ",
  "language": "ja",
  "description": "Apache Doris運用FAQおよびトラブルシューティングガイド。FE/BEノード管理、ログ解析、設定最適化、バージョンアップグレード、ストレージメディア設定、負荷分散およびその他の実用的な運用シナリオに関するよくある質問に回答し、Dorisクラスターの運用問題を迅速に特定し解決することを支援します。"
}
---
このドキュメントは、Doris を使用する際に遭遇する一般的な運用問題を記録するために使用されます。随時更新されます。

**このドキュメントで言及されている BE バイナリファイル名 `doris_be` は、以前のバージョンでは `palo_be` でした。**

### Q1. DECOMMISSION を通じて BE ノードを廃止する際に、なぜ常にいくつかの tablets が残るのですか？

廃止プロセス中に、`show backends` を通じて廃止されたノードの `tabletNum` を表示すると、`tabletNum` の数が減少していることが観察されます。これは、データシャードがこのノードから移行されていることを示しています。数が 0 に達すると、システムは自動的にこのノードを削除します。しかし、場合によっては、`tabletNum` が特定の値まで低下した後、変化が停止します。これは通常、以下の 2 つの理由が原因である可能性があります：

1.  これらの tablets は、削除されたばかりのテーブル、パーティション、またはマテリアライズドビューに属しています。新しく削除されたオブジェクトは、リサイクル箱に保持されます。廃止ロジックは、これらのシャードを処理しません。FE 設定パラメータ `catalog_trash_expire_second` を変更して、リサイクル箱内のオブジェクトの保持時間を変更できます。オブジェクトがリサイクル箱から削除されると、これらの tablets が処理されます。

2.  これらの tablets の移行タスクに問題が発生しています。この時点で、`show proc "/cluster_balance"` を使用して特定のタスクエラーを確認する必要があります。

上記の状況については、まず `show proc "/cluster_health/tablet_health";` を使用して、クラスタに不正常なシャードがあるかどうかを確認できます。0 の場合は、`drop backend` ステートメントを通じて直接この BE を削除できます。そうでなければ、不正常なシャードのレプリカ状態を具体的に確認する必要があります。

### Q2. priority_networks はどのように設定すべきですか？

`priority_networks` は、FE と BE の両方の設定パラメータです。このパラメータは主に、システムが正しいネットワークカード IP を自身の IP として選択するのに役立ちます。後でマシンに新しいネットワークカードを追加することによる間違った IP 選択の問題を防ぐため、いかなる場合においてもこのパラメータを明示的に設定することをお勧めします。

`priority_networks` の値は CIDR 形式で表現されます。2 つの部分に分かれています：最初の部分はドット十進記法での IP アドレス、2 番目の部分はプレフィックス長です。例えば、`10.168.1.0/8` はすべての `10.xx.xx.xx` IP アドレスにマッチし、`10.168.1.0/16` はすべての `10.168.xx.xx` IP アドレスにマッチします。

特定の IP を直接指定する代わりに CIDR 形式を使用する理由は、すべてのノードが統一された設定値を使用できるようにするためです。例えば、`10.168.10.1` と `10.168.10.2` の 2 つのノードがある場合、`priority_networks` の値として `10.168.10.0/24` を使用できます。

### Q3. FE における Master、Follower、Observer とは何ですか？

まず、FE には Follower と Observer の 2 つの役割のみがあることを明確にする必要があります。Master は、Follower ノードのグループから選択された 1 つの FE にすぎません。Master は特別なタイプの Follower と見なすことができます。したがって、クラスタにいくつの FE があり、どのような役割を持っているかを尋ねられたとき、正しい答えはもちろん、すべての FE ノード数、および Follower 役割と Observer 役割の数であるべきです。

Follower 役割を持つすべての FE ノードは、Paxos 合意プロトコルのグループ概念に似た選択可能なグループを形成します。Follower はグループ内で Master として選出されます。Master が失敗すると、新しい Follower が自動的に Master として選択されます。Observer は選挙に参加しないため、Observer が Master になることはありません。

メタデータログは、成功したと見なされるために、Follower ノードの過半数に正常に書き込まれる必要があります。例えば、3 つの FE がある場合、2 回の成功した書き込みが必要です。これが、Follower 役割の数が奇数である必要がある理由でもあります。

Observer 役割は、その名前が示すように、正常に書き込まれたメタデータログを同期し、メタデータ読み取りサービスを提供する観察者としてのみ機能します。過半数書き込みロジックには参加しません。

通常の状況下では、1 Follower + 2 Observer または 3 Follower + N Observer を展開できます。前者は運用・保守がより簡単で、Follower 間の一貫性プロトコルによる複雑なエラーにほとんど遭遇しません（ほとんどの企業がこのアプローチを使用）。後者は、メタデータ書き込みの高可用性を保証できます。高同時実行クエリシナリオの場合は、Observer の数を適切に増やすことができます。

### Q4. ノードに新しいディスクを追加したときに、データが新しいディスクにバランスされないのはなぜですか？

現在の Doris バランシング戦略はノードベースです。つまり、ノードの全体的な負荷指標（シャード数と総ディスク使用率）に基づいてクラスタ負荷を判断します。そして、高負荷ノードから低負荷ノードにデータシャードを移行します。各ノードがディスクを追加した場合、ノード全体の観点から負荷は変化していないため、バランシングロジックをトリガーできません。

さらに、Doris は現在、単一ノード内のディスク間でのバランシング操作をサポートしていません。したがって、新しいディスクを追加した後、データは新しいディスクにバランスされません。

ただし、ノード間でデータが移行される際、Doris はディスク要因を考慮します。例えば、シャードがノード A からノード B に移行される際、ノード B でディスク容量使用率が低いディスクを優先的に選択します。

ここでは、この問題を解決する 3 つの方法を提供します：

1.  新しいテーブルを再構築

    `create table like` ステートメントを通じて新しいテーブルを作成し、`insert into select` を使用して古いテーブルから新しいテーブルにデータを同期します。新しいテーブルを作成する際、新しいテーブルのデータシャードは新しいディスクに分散されるため、データも新しいディスクに書き込まれます。この方法は、データ量が少ない状況（数十 GB 以内）に適しています。

2.  Decommission コマンドを通じて

    `decommission` コマンドは、BE ノードを安全に廃止するために使用されます。このコマンドは、まずそのノード上のデータシャードを他のノードに移行し、その後ノードを削除します。前述したように、データ移行中はディスク使用率が低いディスクが優先されるため、この方法により他のノードのディスクにデータを「強制的に」移行できます。データ移行が完了した後、この `decommission` 操作を `cancel` すると、データはこのノードにバランスバックされます。すべての BE ノードに対して上記の手順を実行すると、データはすべてのノードのすべてのディスクに均等に分散されます。

    `decommission` コマンドを実行する前に、廃止完了後にノードが削除されることを避けるため、まず以下のコマンドを実行してください。

    `admin set frontend config("drop_backend_after_decommission" = "false");`

3.  API を使用して手動でデータを移行

    Doris は、1 つのディスク上のデータシャードを別のディスクに移行することを手動で指定できる [HTTP API](https://doris.apache.org/docs/dev/admin-manual/be/tablet-migration) を提供します。

### Q5. FE/BE ログを正しく読むにはどうすればよいですか？

多くの場合、ログを通じて問題をトラブルシューティングする必要があります。ここでは FE/BE ログの形式と表示方法について説明します。

1.  FE

    FE ログには主に以下が含まれます：

    -   `fe.log`: メインログ。`fe.out` 以外のすべての内容を含みます。

    -   `fe.warn.log`: メインログのサブセットで、WARN と ERROR レベルのログのみを記録します。

    -   `fe.out`: 標準/エラー出力ログ（stdout と stderr）。

    -   `fe.audit.log`: 監査ログで、この FE が受信したすべての SQL リクエストを記録します。

    典型的な FE ログエントリは以下のとおりです：

    ```text
    2021-09-16 23:13:22,502 INFO (tablet scheduler|43) [BeLoadRebalancer.selectAlternativeTabletsForCluster():85] cluster is balance: default_cluster with medium: HDD. skip
    ```
-   `2021-09-16 23:13:22,502`: ログのタイムスタンプ。

    -   `INFO`: ログレベル、デフォルトはINFO。

    -   `(tablet scheduler|43)`: スレッド名とスレッドID。スレッドIDを通じて、このスレッドのコンテキスト情報を確認でき、このスレッドで何が発生したかのトラブルシューティングに便利です。

    -   `BeLoadRebalancer.selectAlternativeTabletsForCluster():85`: クラス名、メソッド名、およびコード行番号。

    -   `cluster is balance xxx`: ログの内容。

    通常の状況では、主に`fe.log`ログを確認します。特殊な場合には、一部のログが`fe.out`に出力されることがあります。

2.  BE

    BEログは主に以下を含みます：

    -   `be.INFO`: メインログ。これは実際にはソフトリンクで、最新の`be.INFO.xxxx`にリンクしています。

    -   `be.WARNING`: メインログのサブセットで、WARNとFATALレベルのログのみを記録します。これは実際にはソフトリンクで、最新の`be.WARN.xxxx`にリンクしています。

    -   `be.out`: 標準/エラー出力ログ（stdoutとstderr）。

    典型的なBEログエントリは以下の通りです：

    ```text
    I0916 23:21:22.038795 28087 task_worker_pool.cpp:1594] finish report TASK. master host: 10.10.10.10, port: 9222
    ```
-   `I0916 23:21:22.038795`: ログレベルと日時。大文字のIはINFO、WはWARN、FはFATALを表します。

    -   `28087`: スレッドID。スレッドIDを通じて、このスレッドのコンテキスト情報を確認でき、このスレッドで何が起こったかのトラブルシューティングに便利です。

    -   `task_worker_pool.cpp:1594`: コードファイルと行番号。

    -   `finish report TASK xxx`: ログ内容。

    通常の状況では、主に`be.INFO`ログを確認します。BEがクラッシュするなどの特別な場合は、`be.out`を確認する必要があります。

### Q6. FE/BEノードがダウンした際のトラブルシューティング方法

1.  BE

    BEプロセスはC/C++プロセスで、一部のプログラムバグ（メモリ境界外、不正アドレスアクセスなど）やOut Of Memory（OOM）によってクラッシュする可能性があります。この場合、以下の手順でエラー原因を確認できます：

    1.  `be.out`を確認

        BEプロセスは、異常な条件によってプログラムが終了する際に、現在のエラースタックを`be.out`に出力するよう実装されています（`be.INFO`や`be.WARNING`ではなく`be.out`であることに注意）。エラースタックを通じて、通常はプログラムに問題が発生した箇所を概ね把握できます。

        `be.out`にエラースタックが表示される場合、通常はプログラムバグが原因であり、一般ユーザーが自分で解決できない可能性があります。WeChatグループ、GitHub Discussion、またはdevメーリングリストでサポートを求め、対応するエラースタックを投稿して迅速なトラブルシューティングを行ってください。

    2.  dmesg

        `be.out`にスタック情報がない場合、OOMによってシステムに強制終了された可能性が高いです。この場合、`dmesg -T`コマンドを使用してLinuxシステムログを確認できます。最後に`Memory cgroup out of memory: Kill process 7187 (doris_be) score 1007 or sacrifice child`のようなログがある場合、OOMが原因であることを意味します。

        メモリ問題は、大きなクエリ、インポート、compactionなど、複数の側面が原因の可能性があります。Dorisもメモリ使用量を継続的に最適化しています。WeChatグループ、GitHub Discussion、またはdevメーリングリストでサポートを求めてください。

    3.  `be.INFO`でFで始まるログがあるかを確認

        Fで始まるログはFatalログです。例えば、`F0916`は9月16日のFatalログを表します。Fatalログは通常プログラムアサーションエラーを示し、アサーションエラーはプロセスを直接終了させます（プログラムにバグがあることを示します）。WeChatグループ、GitHub Discussion、またはdevメーリングリストでサポートを求めてください。

2.  FE

    FEはJavaプロセスで、C/C++プログラムよりも堅牢性が優れています。通常、FEがクラッシュする理由はOOM（Out-of-Memory）またはメタデータ書き込み失敗の可能性があります。これらのエラーは通常`fe.log`または`fe.out`にエラースタックがあります。エラースタック情報に基づいてさらなるトラブルシューティングが必要です。

### Q7. データディレクトリのSSDとHDD設定について、テーブル作成時に`Failed to find enough host with storage medium and tag`エラーが発生することがあります

DorisはBEノードに対して複数のストレージパスの設定をサポートしています。通常の状況では、ディスクごとに1つのストレージパスを設定すれば十分です。同時に、Dorisはパスのストレージメディア属性の指定をサポートしており、SSDやHDDなどがあります。SSDは高速ストレージデバイス、HDDは低速ストレージデバイスを表します。

クラスターにすべてHDDまたはすべてSSDなど、1種類のメディアしかない場合、ベストプラクティスは`be.conf`でメディア属性を明示的に指定しないことです。上記の`Failed to find enough host with storage medium and tag`エラーが発生した場合、一般的には`be.conf`でSSDメディアのみが設定されているにも関わらず、テーブル作成時に`properties {"storage_medium" = "hdd"}`が明示的に指定されている場合です。同様に、`be.conf`でHDDメディアのみが設定されているにも関わらず、テーブル作成時に`properties {"storage_medium" = "ssd"}`が明示的に指定されている場合も、上記のエラーが発生します。解決策は、テーブル作成の`properties`パラメータを設定に合わせて修正するか、`be.conf`でのSSD/HDDの明示的な設定を削除することです。

パスのストレージメディア属性を指定することで、Dorisのホットコールドデータパーティションストレージ機能を使用して、パーティションレベルでホットデータをSSDに保存し、コールドデータは自動的にHDDに転送されます。

注意すべき点は、Dorisはストレージパスが配置されているディスクの実際のストレージメディアタイプを自動的に感知しません。このタイプはユーザーがパス設定で明示的に示す必要があります。例えば、パス`/path/to/data1.SSD`は、このパスがSSDストレージメディアであることを示します。そして`data1.SSD`が実際のディレクトリ名です。Dorisは、ディレクトリ名の後の`.SSD`サフィックスに基づいてストレージメディアタイプを決定し、実際のストレージメディアタイプではありません。つまり、ユーザーは任意のパスをSSDストレージメディアとして指定でき、Dorisはディレクトリサフィックスのみを認識し、ストレージメディアが一致するかどうかは判断しません。サフィックスが書かれていない場合、デフォルトでHDDになります。

言い換えると、`.HDD`と`.SSD`は、ストレージディレクトリの「相対的な」「低速」と「高速」の区別を識別するためにのみ使用され、実際のストレージメディアタイプを識別するものではありません。そのため、BEノード上のストレージパス間にメディアの違いがない場合は、サフィックスを記入する必要はありません。

### Q8. 複数のFEでWeb UIロードバランシングを実装するためにNginxを使用する際、ログインできない

Dorisは複数のFEをデプロイできます。Web UIにアクセスする際、Nginxを使用してロードバランシングを行うと、Sessionの問題により継続的にログインし直すよう求められます。この問題は実際にはSession共有の問題です。NginxはSession共有の集中型ソリューションを提供しています。ここではNginxの`ip_hash`技術を使用します。`ip_hash`は特定のIPからのリクエストを同じバックエンドに送ることができ、このIP下の特定のクライアントと特定のバックエンドが安定したSessionを確立できるようになります。`ip_hash`は`upstream`設定で定義されます：

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
### Q9. FE起動が失敗し、fe.logに「wait catalog to be ready. FE type UNKNOWN」が継続的に出力される

この問題には通常2つの原因があります：

1.  今回のFE起動時に取得されたローカルIPが前回起動時と一致しない場合。通常は`priority_network`が正しく設定されていないため、FE起動時に間違ったIPアドレスにマッチしてしまうことが原因です。`priority_network`を修正してFEを再起動する必要があります。

2.  クラスター内の大部分のFollower FEノードが起動していない場合。例えば、3つのFollowerがあるが1つしか起動していない場合です。この場合、FE選出可能グループがMasterを選出してサービスを提供できるよう、少なくともさらに1つのFEを起動する必要があります。

上記の状況で解決できない場合は、Doris公式ドキュメントの[Metadata Operations Documentation](../admin-manual/trouble-shooting/metadata-operation.md)に従って復旧することができます。

### Q10. Lost connection to MySQL server at 'reading initial communication packet', system error: 0

MySQLクライアントを使用してDorisに接続する際に上記の問題が発生する場合、通常はFEのコンパイル時に使用したJDKバージョンとFE実行時に使用するJDKバージョンが異なることが原因です。Dockerコンパイルイメージでコンパイルする場合、デフォルトのJDKバージョンはOpenJDK 11であり、コマンドを通じてOpenJDK 8に切り替えることができることに注意してください（詳細はコンパイルドキュメントを参照）。

### Q11. recoveryTracker should overlap or follow on disk last VLSN of 4,422,880 recoveryFirst= 4,422,882 UNEXPECTED_STATE_FATAL

FE再起動時に上記のエラーが発生することがあります（通常は複数のFollowerがある場合のみ）。そして、エラー内の2つの値が2だけ異なり、FE起動が失敗します。

これはまだ解決されていないBDB JEのバグです。この状況に遭遇した場合は、[Metadata Operations Documentation](../admin-manual/trouble-shooting/metadata-operation.md)の障害復旧操作を通じてメタデータを復旧することしかできません。

### Q12. Dorisコンパイルおよびインストール時のJDKバージョン非互換性の問題

Dockerを使用してDorisを自分でコンパイルし、コンパイル完了後にインストールして、FE起動時に例外情報`java.lang.Suchmethoderror: java.nio.ByteBuffer.limit(I)Ljava/nio/ByteBuffer;`が表示される場合があります。これはDockerのデフォルトがJDK 11であることが原因です。インストール環境でJDK 8を使用している場合は、Docker内のJDK環境をJDK 8に切り替える必要があります。具体的な切り替え方法については、[Compilation Documentation](https://doris.apache.org/community/source-install/compilation-with-docker)を参照してください。

### Q13. FEをローカルで起動またはユニットテストの起動時にCannot find external parser table action_table.datエラーが報告される

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
Java UDF関数の依存関係パッケージ`apache-doris-java-udf-jar-with-dependencies-1.2.0`を公式サイトからダウンロードし、BEのインストールディレクトリ下の`lib`ディレクトリに配置してから、BEを再起動する必要があります。

### Q16. バージョン1.2にアップグレード後、BE起動時にFailed to initialize JNI問題が表示される

:::note
Java環境の問題は、Dorisバージョン1.2以降でサポートされています
:::

アップグレード後のBE起動時に以下の`Failed to initialize JNI`エラーが発生する場合：

```text
Failed to initialize JNI: Failed to find the library libjvm.so.
```
システムで`JAVA_HOME`環境変数を設定するか、`be.conf`で`JAVA_HOME`変数を設定してから、BEノードを再起動する必要があります。

### Q17. Docker: backendの起動に失敗する
これはCPUがAVX2をサポートしていないことが原因である可能性があります。`docker logs -f be`でbackendログを確認してください。
CPUがAVX2をサポートしていない場合は、`apache/doris:1.2.2-be-x86_64`の代わりに、
`apache/doris:1.2.2-be-x86_64-noavx2`イメージを使用する必要があります。
イメージのバージョン番号は時間の経過とともに変更されることに注意してください。最新バージョンについては[Dockerhub](https://registry.hub.docker.com/r/apache/doris/tags?page=1&name=avx2)を確認してください。
