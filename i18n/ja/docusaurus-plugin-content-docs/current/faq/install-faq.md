---
{
    "title": "運用に関するよくある質問",
    "language": "ja",
    "description": "Apache Doris の運用 FAQ とトラブルシューティングガイド。FE/BE ノードの管理、ログの分析、設定の最適化、バージョンアップ、ストレージメディアの設定、負荷分散など、運用時によくある問題への対処方法を説明します。"
}
---

このドキュメントでは、Doris の使用中によく発生する運用上の問題をまとめています。内容は随時更新します。

**このドキュメントで言及する BE のバイナリファイル名 `doris_be` は、以前のバージョンでは `palo_be` でした。**

### Q1. DECOMMISSION で BE ノードを廃止するとき、一部のタブレットが残り続けるのはなぜですか？

廃止処理中に対象ノードの `tabletNum` を `show backends` で確認すると、`tabletNum` の値が減少していきます。これは、データシャードがそのノードから移行されていることを示します。値が 0 になると、システムはそのノードを自動的に削除します。ただし、`tabletNum` が一定の値まで減った後、変化しなくなることがあります。主な原因は次の二つです。

1.  これらのタブレットが、削除されたばかりのテーブル、パーティション、またはマテリアライズドビューに属している。削除されたオブジェクトは一定期間ごみ箱に保持されます。廃止処理では、これらのシャードは処理されません。FE の設定パラメータ `catalog_trash_expire_second` を変更すると、ごみ箱内のオブジェクトの保持期間を変更できます。オブジェクトがごみ箱から削除されると、これらのタブレットが処理されます。

2.  これらのタブレットの移行タスクで問題が発生している。この場合は `show proc "/cluster_balance"` を使用して、具体的なタスクのエラーを確認してください。

いずれの場合も、まず `show proc "/cluster_health/tablet_health";` でクラスター内に異常なシャードがあるか確認できます。異常なシャードの数が 0 なら、`drop backend` ステートメントでこの BE を直接削除できます。そうでなければ、異常なシャードのレプリカの状態を個別に確認する必要があります。

### Q2. priority_networks はどのように設定すればよいですか？

`priority_networks` は FE と BE の両方の設定パラメータです。主に、システムが自身の IP アドレスとして正しいネットワークインターフェースの IP を選択できるようにします。後からマシンにネットワークインターフェースを追加した際に誤った IP が選択されるのを防ぐため、常に明示的に設定することを推奨します。

`priority_networks` の値は CIDR 形式で指定します。ドット区切りの十進表記による IP アドレスと、プレフィックス長の二つの部分で構成されます。たとえば、`10.168.1.0/8` はすべての `10.xx.xx.xx` IP アドレスに一致し、`10.168.1.0/16` はすべての `10.168.xx.xx` IP アドレスに一致します。

特定の IP アドレスを直接指定せず CIDR 形式を使用するのは、すべてのノードで同じ設定値を使えるようにするためです。たとえば、`10.168.10.1` と `10.168.10.2` という二つのノードがある場合、`10.168.10.0/24` を `priority_networks` の値として使用できます。

### Q3. FE の Master、Follower、Observer とは何ですか？

まず、FE のロールは Follower と Observer の二種類だけです。Master は Follower ノードのグループから選出された FE であり、特別な Follower と見なせます。したがって、クラスター内の FE の数とそのロールを尋ねられた場合は、全 FE ノードの数と、Follower および Observer それぞれの数を答えるのが適切です。

Follower ロールを持つすべての FE ノードは、Paxos コンセンサスプロトコルのグループに似た、選出可能なグループを形成します。そのグループ内で一つの Follower が Master に選出されます。Master に障害が発生すると、新しい Follower が自動的に Master に選出されます。Observer は選出に参加しないため、Master にはなりません。

メタデータログの書き込みが成功したと見なされるには、過半数の Follower ノードへの書き込みが成功する必要があります。たとえば、FE が 3 台の場合、2 台への書き込み成功が必要です。Follower ロールのノード数を奇数にする必要があるのもこのためです。

Observer ロールは、その名のとおり、正常に書き込まれたメタデータログを同期するオブザーバーとして動作し、メタデータの読み取りサービスを提供します。過半数への書き込み処理には参加しません。

通常は、1 Follower + 2 Observers、または 3 Followers + N Observers の構成にできます。前者は運用と保守が簡単で、Follower 間の整合性プロトコルに起因する複雑なエラーもほとんど発生しません（ほとんどの企業ではこの構成を使用します）。後者ではメタデータ書き込みの高可用性を確保できます。同時実行数の多いクエリを処理する場合は、必要に応じて Observer の数を増やせます。

### Q4. ノードに新しいディスクを追加しても、データが新しいディスクにバランシングされないのはなぜですか？

現在の Doris のバランシング戦略はノード単位です。つまり、ノード全体の負荷指標（シャード数とディスク使用率の合計）に基づいてクラスターの負荷を判定し、負荷の高いノードから低いノードへデータシャードを移行します。各ノードにディスクを追加しても、ノード全体としての負荷は変わらないため、バランシング処理は開始されません。

また、Doris は現在、単一ノード内のディスク間のバランシングに対応していません。そのため、新しいディスクを追加しても、データはそこへバランシングされません。

ただし、ノード間でデータを移行する際には、Doris はディスクの状態を考慮します。たとえば、シャードをノード A からノード B に移行する場合、ノード B 内でディスク領域の使用率が低いディスクを優先して選択します。

この問題を解決する方法は 3 つあります。

1.  新しいテーブルを作り直す

    `create table like` ステートメントで新しいテーブルを作成し、`insert into select` を使用して古いテーブルから新しいテーブルへデータを同期します。新しいテーブルを作成すると、そのデータシャードが新しいディスクにも分散されるため、データが新しいディスクにも書き込まれます。この方法は、データ量が少ない場合（数十 GB 以内）に適しています。

2.  Decommission コマンドを使用する

    `decommission` コマンドは、BE ノードを安全に廃止するために使用します。このコマンドは、まずそのノード上のデータシャードをほかのノードへ移行してから、ノードを削除します。前述のとおり、データ移行時にはディスク使用率の低いディスクが優先されるため、この方法でデータをほかのノードのディスクへ「強制的に」移行できます。データの移行が完了したら、`cancel` でこの `decommission` 操作を取り消し、データが元のノードにも再びバランシングされるようにします。すべての BE ノードに対してこの手順を実行すると、すべてのノードのすべてのディスクにデータが均等に分散されます。

    `decommission` コマンドを実行する前に、廃止処理の完了後にノードが削除されないよう、まず次のコマンドを実行してください。

    `admin set frontend config("drop_backend_after_decommission" = "false");`

3.  API を使用してデータを手動で移行する

    Doris は、あるディスク上のデータシャードを別のディスクへ移行するよう手動で指定できる [HTTP API](https://doris.apache.org/docs/dev/admin-manual/be/tablet-migration) を提供します。

### Q5. FE/BE のログはどのように読み取ればよいですか？

問題の調査には、ログの確認が必要になることがよくあります。ここでは FE/BE のログの形式と確認方法を説明します。

1.  FE

    FE の主なログは次のとおりです。

    -   `fe.log`：メインログ。`fe.out` 以外のすべての内容を含みます。

    -   `fe.warn.log`：メインログの一部で、WARN および ERROR レベルのログのみを記録します。

    -   `fe.out`：標準出力と標準エラー出力のログ（stdout と stderr）。

    -   `fe.audit.log`：この FE が受信したすべての SQL リクエストを記録する監査ログ。

    FE の典型的なログエントリは次のとおりです。

    ```text
    2021-09-16 23:13:22,502 INFO (tablet scheduler|43) [BeLoadRebalancer.selectAlternativeTabletsForCluster():85] cluster is balance: default_cluster with medium: HDD. skip
    ```

    -   `2021-09-16 23:13:22,502`：ログのタイムスタンプ。

    -   `INFO`：ログレベル。デフォルトは INFO です。

    -   `(tablet scheduler|43)`：スレッド名とスレッド ID。スレッド ID を使ってそのスレッドのコンテキスト情報を確認でき、スレッド内で何が起きたかを調査するのに役立ちます。

    -   `BeLoadRebalancer.selectAlternativeTabletsForCluster():85`：クラス名、メソッド名、コードの行番号。

    -   `cluster is balance xxx`：ログの内容。

    通常は主に `fe.log` を確認します。状況によっては、一部のログが `fe.out` に出力されることもあります。

2.  BE

    BE の主なログは次のとおりです。

    -   `be.INFO`：メインログ。実際には最新の `be.INFO.xxxx` を指すシンボリックリンクです。

    -   `be.WARNING`：メインログの一部で、WARN および FATAL レベルのログのみを記録します。実際には最新の `be.WARN.xxxx` を指すシンボリックリンクです。

    -   `be.out`：標準出力と標準エラー出力のログ（stdout と stderr）。

    BE の典型的なログエントリは次のとおりです。

    ```text
    I0916 23:21:22.038795 28087 task_worker_pool.cpp:1594] finish report TASK. master host: 10.10.10.10, port: 9222
    ```

    -   `I0916 23:21:22.038795`：ログレベルと日時。先頭の大文字 I は INFO、W は WARN、F は FATAL を表します。

    -   `28087`：スレッド ID。スレッド ID を使ってそのスレッドのコンテキスト情報を確認でき、スレッド内で何が起きたかを調査するのに役立ちます。

    -   `task_worker_pool.cpp:1594`：コードのファイル名と行番号。

    -   `finish report TASK xxx`：ログの内容。

    通常は主に `be.INFO` を確認します。BE がクラッシュした場合などは、`be.out` を確認する必要があります。

### Q6. FE/BE ノードが停止したときは、どのように調査すればよいですか？

1.  BE

    BE プロセスは C/C++ プロセスであり、プログラムのバグ（メモリ範囲外へのアクセス、不正なアドレスへのアクセスなど）やメモリ不足（OOM）によってクラッシュすることがあります。この場合は、次の手順で原因を調べられます。

    1.  `be.out` を確認する

        BE プロセスは、異常な状態で終了したときに、現在のエラースタックを `be.out` に出力するよう実装されています（出力先は `be.out` で、`be.INFO` や `be.WARNING` ではありません）。通常は、エラースタックから問題が発生した箇所をおおまかに特定できます。

        `be.out` にエラースタックが記録されている場合、通常はプログラムのバグが原因であり、一般ユーザーだけでは解決できないことがあります。WeChat グループ、GitHub Discussion、または開発者向けメーリングリストで、該当するエラースタックを添えて相談してください。原因の迅速な特定に役立ちます。

    2.  dmesg

        `be.out` にスタック情報がない場合は、OOM によってシステムに強制終了された可能性が高いです。この場合、`dmesg -T` コマンドで Linux のシステムログを確認できます。末尾に `Memory cgroup out of memory: Kill process 7187 (doris_be) score 1007 or sacrifice child` に似たログがあれば、OOM が原因です。

        メモリの問題には、大規模なクエリ、データのインポート、compaction など、さまざまな原因があります。Doris でもメモリ使用量の最適化を継続しています。WeChat グループ、GitHub Discussion、または開発者向けメーリングリストで相談してください。

    3.  `be.INFO` に F で始まるログがあるか確認する

        F で始まるログは Fatal ログです。たとえば、`F0916` は九月の 16 日に記録された Fatal ログを表します。Fatal ログは通常、プログラムのアサーションエラーを示し、アサーションエラーが発生するとプロセスは直ちに終了します（プログラムにバグがあることを示します）。WeChat グループ、GitHub Discussion、または開発者向けメーリングリストで相談してください。

2.  FE

    FE は Java プロセスであり、C/C++ プログラムよりも堅牢です。FE がクラッシュする原因は、通常 OOM（メモリ不足）またはメタデータの書き込み失敗です。通常、これらのエラーのスタック情報は `fe.log` または `fe.out` に記録されます。スタック情報に基づいて詳しく調査する必要があります。

### Q7. データディレクトリの SSD/HDD 設定について：テーブルの作成時に `Failed to find enough host with storage medium and tag` エラーが発生することがあるのはなぜですか？

Doris では、BE ノードに複数のストレージパスを設定できます。通常は、ディスクごとに一つのストレージパスを設定すれば十分です。また、パスに SSD や HDD などのストレージメディア属性を指定できます。SSD は高速なストレージデバイス、HDD は低速なストレージデバイスを表します。

クラスター内のメディアがすべて HDD またはすべて SSD など、一種類だけの場合は、`be.conf` でメディア属性を明示的に指定しないことが推奨されます。上記の `Failed to find enough host with storage medium and tag` エラーは、一般に、`be.conf` には SSD メディアだけを設定しているのに、テーブル作成時に `properties {"storage_medium" = "hdd"}` を明示的に指定した場合に発生します。同様に、`be.conf` には HDD メディアだけを設定し、テーブル作成時に `properties {"storage_medium" = "ssd"}` を明示的に指定した場合にも発生します。解決するには、テーブル作成時の `properties` パラメータを設定に合わせて変更するか、`be.conf` での SSD/HDD の明示的な指定を削除してください。

パスにストレージメディア属性を指定すると、Doris のホットデータとコールドデータのパーティションストレージ機能を利用できます。これにより、ホットデータをパーティション単位で SSD に格納し、コールドデータを自動的に HDD へ移動できます。

Doris は、ストレージパスがあるディスクの実際のメディア種別を自動的には検出しません。ユーザーがパスの設定で種別を明示する必要があります。たとえば、パス `/path/to/data1.SSD` は、そのパスを SSD ストレージメディアとして指定します。`data1.SSD` は実際のディレクトリ名です。Doris は、実際のストレージメディアの種別ではなく、ディレクトリ名の末尾にある `.SSD` に基づいて種別を判定します。つまり、ユーザーは任意のパスを SSD ストレージメディアとして指定でき、Doris はディレクトリ名のサフィックスだけを認識し、実際のメディア種別との一致は確認しません。サフィックスを付けない場合、デフォルトは HDD です。

言い換えると、`.HDD` と `.SSD` は、ストレージディレクトリの相対的な「低速」と「高速」の区別にのみ使用され、実際のストレージメディアの種別を示すものではありません。したがって、BE ノード上のストレージパス間にメディアの違いがなければ、サフィックスを付ける必要はありません。

### Q8. 複数の FE で Nginx を使用して Web UI の負荷分散を行うと、ログインできない

Doris では複数の FE を配置できます。Web UI へのアクセスを Nginx で負荷分散すると、Session の問題によりログインを繰り返し求められることがあります。これは Session の共有に関する問題です。Nginx は、Session を共有するための集中型の解決方法を提供します。ここでは Nginx の `ip_hash` を使用します。`ip_hash` により、特定の IP からのリクエストを同じバックエンドへ転送できるため、その IP のクライアントとバックエンドの間で安定した Session を確立できます。`ip_hash` は `upstream` 設定で定義します。

```text
upstream  doris.com {
   server    172.22.197.238:8030 weight=3;
   server    172.22.197.239:8030 weight=4;
   server    172.22.197.240:8030 weight=4;
   ip_hash;
}
```

Nginx の設定全体の例は次のとおりです。

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

### Q9. FE の起動に失敗し、fe.log に "wait catalog to be ready. FE type UNKNOWN" が出力され続ける

通常、この問題には次の二つの原因があります。

1.  今回の FE 起動時に取得したローカル IP が、前回の起動時と一致しない。通常は `priority_network` が正しく設定されておらず、FE が起動時に誤った IP アドレスを選択したためです。`priority_network` を修正して FE を再起動する必要があります。

2.  クラスター内の Follower FE ノードの過半数が起動していない。たとえば、Follower が 3 台あるのに一台しか起動していない場合です。この場合は、FE の選出可能なグループでサービスを提供する Master を選出できるように、少なくとももう一台の FE を起動する必要があります。

上記の方法で解決できない場合は、Doris 公式ドキュメントの[メタデータの操作に関するドキュメント](../admin-manual/trouble-shooting/metadata-operation.md)に従って復旧できます。

### Q10. Lost connection to MySQL server at 'reading initial communication packet', system error: 0

MySQL クライアントで Doris に接続したときにこの問題が発生する場合、通常は FE のコンパイルに使用した JDK のバージョンと、FE の実行に使用した JDK のバージョンが異なることが原因です。Docker のコンパイル用イメージでコンパイルする場合、デフォルトの JDK バージョンは OpenJDK 11 です。コマンドを使用して OpenJDK 8 に切り替えられます（詳しくはコンパイルに関するドキュメントを参照してください）。

### Q11. recoveryTracker should overlap or follow on disk last VLSN of 4,422,880 recoveryFirst= 4,422,882 UNEXPECTED_STATE_FATAL

FE の再起動時に、上記のエラーが発生することがあります（通常は Follower が複数ある場合のみ）。このとき、エラー内の二つの値の差が 2 になり、FE の起動に失敗します。

これは BDB JE の未解決のバグです。この状況が発生した場合は、[メタデータの操作に関するドキュメント](../admin-manual/trouble-shooting/metadata-operation.md)に記載された障害復旧操作によってのみ、メタデータを復旧できます。

### Q12. Doris のコンパイル時とインストール時の JDK バージョンに互換性がない

Docker を使用して Doris をコンパイルし、インストールした後、FE の起動時に例外 `java.lang.Suchmethoderror: java.nio.ByteBuffer.limit(I)Ljava/nio/ByteBuffer;` が発生することがあります。これは Docker のデフォルトが JDK 11 であるためです。インストール先で JDK 8 を使用している場合は、Docker 内の JDK 環境を JDK 8 に切り替える必要があります。具体的な切り替え方法については、[コンパイルに関するドキュメント](https://doris.apache.org/community/source-install/compilation-with-docker)を参照してください。

### Q13. ローカルで FE または単体テストを起動すると、Cannot find external parser table action_table.dat エラーが発生する

次のコマンドを実行してください。

```bash
cd fe && mvn clean install -DskipTests
```

同じエラーが引き続き発生する場合は、次のコマンドを手動で実行してください。

```bash
cp fe-core/target/generated-sources/cup/org/apache/doris/analysis/action_table.dat fe-core/target/classes/org/apache/doris/analysis
```

### Q14. バージョン 1.2 へのアップグレード後、NoClassDefFoundError により BE を起動できない

:::note
Java UDF の依存関係に関するエラーは、Doris バージョン 1.2 以降でサポートされています。
:::

アップグレード後に BE を起動した際、次の Java の `NoClassDefFoundError` エラーが発生する場合があります。

```text
Exception in thread "main" java.lang.NoClassDefFoundError: org/apache/doris/udf/JniUtil
Caused by: java.lang.ClassNotFoundException: org.apache.doris.udf.JniUtil
```

公式サイトから Java UDF 関数の依存パッケージ `apache-doris-java-udf-jar-with-dependencies-1.2.0` をダウンロードし、BE のインストールディレクトリ内の `lib` ディレクトリに配置してから、BE を再起動してください。

### Q15. バージョン 1.2 へのアップグレード後、BE の起動時に Failed to initialize JNI が表示される

:::note
Java 環境に関する問題は、Doris バージョン 1.2 以降でサポートされています。
:::

アップグレード後に BE を起動した際、次の `Failed to initialize JNI` エラーが発生する場合があります。

```text
Failed to initialize JNI: Failed to find the library libjvm.so.
```

システムの `JAVA_HOME` 環境変数を設定するか、`JAVA_HOME` 変数を `be.conf` に設定してから、BE ノードを再起動してください。

### Q16. Docker：バックエンドを起動できない
CPU が AVX2 に対応していない可能性があります。`docker logs -f be` でバックエンドのログを確認してください。
CPU が AVX2 に対応していない場合は、`apache/doris:1.2.2-be-x86_64-noavx2` イメージを、
`apache/doris:1.2.2-be-x86_64` イメージの代わりに使用する必要があります。
イメージのバージョン番号は時間の経過とともに変わるため、最新バージョンは [Docker Hub](https://registry.hub.docker.com/r/apache/doris/tags?page=1&name=avx2) で確認してください。
