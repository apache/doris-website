---
{
    "title": "Kerberos のベストプラクティス",
    "language": "ja",
    "description": "複数のデータソースにまたがるフェデレーションクエリに Doris を使用する場合、"
}
---

複数のデータソースにまたがるフェデレーションクエリに Doris を使用する場合、クラスターごとに異なる Kerberos 認証情報を使用していることがあります。

大手投資信託会社を例に考えます。社内データプラットフォームは機能別の複数のクラスターに分かれ、それぞれ異なる技術チームまたは業務チームが管理しています。各クラスターでは、認証とアクセス制御のために独立した Kerberos Realm を設定しています。

- 本番クラスターは日次の純資産価額計算とリスク評価に使用されます。データは厳密に分離され、認可されたサービスのみがアクセスできます（Realm: PROD.FUND.COM）。
- 分析クラスターは戦略研究とモデルのバックテストに使用されます。Doris は TVF を介してこのクラスターに一時的なクエリを実行します（Realm: ANALYSIS.FUND.COM）。
- データレイククラスターは Iceberg Catalog を統合し、大量の過去の市場データやログなどの保存と分析に使用されます（Realm: LAKE.FUND.COM）。

これらのクラスター間にはクロスドメインの信頼関係が確立されておらず、認証情報を共有できません。そのため、異種データソースに統一的にアクセスするには、複数の Kerberos インスタンスの認証とコンテキスト管理を同時にサポートする必要があります。

**このドキュメントでは、複数の Kerberos 環境でデータソースを設定し、アクセスする方法を説明します。**

> この機能は 3.1+ でサポートされています。

## 複数の Kerberos クラスターの認証設定

### krb5.conf

`krb5.conf` には、Kerberos の設定情報、KDC の場所、Kerberos サービスの一部の**デフォルト値**、ホスト名と Realm のマッピング情報が含まれます。

krb5.conf を適用する際は、すべてのノードに配置してください。デフォルトの場所は `/etc/krb5.conf` です。

### realms

EXAMPLE.COM など、多数のクライアントに対する KDC と Kerberos ネットワークを定義します。

複数のクラスターを設定する場合は、一つの `krb5.conf` に複数の Realm を設定する必要があります。KDC と `admin_server` にはドメイン名も指定できます。

```
[realms]
EMR-IP.EXAMPLE = {
    kdc = 172.21.16.8:88
    admin_server = 172.21.16.8
}
EMR-HOST.EXAMPLE = {
    kdc = emr_hostname
    admin_server = emr_hostname
}
```

### domain_realm

Kerberos サービスが稼働するノードのドメインから Realm へのマッピングを設定します。

```toml
[libdefaults]
dns_lookup_realm = true
dns_lookup_kdc = true
[domain_realm]
172.21.16.8 = EMR-IP.EXAMPLE
emr-host.example = EMR-HOST.EXAMPLE
```

たとえば、プリンシパル `emr1/domain_name@realm.com` の KDC を検索する場合、`domain_name` を使って対応する Realm を特定します。一致するものがなければ、その Realm の KDC を見つけられません。

Doris の `log/be.out` または `log/fe.out` には、`domain_realm` に関連する次の二種類のエラーが通常表示されます。

```
* Unable to locate KDC for realm/Cannot locate KDC

* No service creds
```

### keytab と principal

複数の Kerberos クラスターがある環境では、通常、keytab ファイルには `/path/to/serverA.keytab`、`/path/to/serverB.keytab` のように異なるパスを使用します。異なるクラスターにアクセスする際は、対応する keytab を使用する必要があります。

HDFS クラスターで Kerberos 認証が有効な場合、通常は `hadoop.security.auth_to_local` プロパティが `core-site.xml` ファイルにあります。このプロパティは Kerberos プリンシパルを短いローカルユーザー名にマッピングするために使用され、Hadoop は Kerberos の構文規則を再利用します。

設定されていない場合、`NoMatchingRule("No rules applied to` 例外が発生することがあります。コードを参照してください。

[hadoop/src/core/org/apache/hadoop/security/KerberosName.java](https://github.com/hanborq/hadoop/blob/master/src/core/org/apache/hadoop/security/KerberosName.java#L399)

`hadoop.security.auth_to_local` パラメータには、プリンシパルに上から順に適用される一連のマッピングルールが含まれます。一致するルールが見つかると、ユーザー名が出力され、一致しないルールは無視されます。具体的な設定形式は次のとおりです。

```
RULE:[<principal translation>](acceptance filter)<short name substitution>
```

複数クラスター環境で異なる Kerberos サービスが使用するプリンシパルを照合するには、次の設定を推奨します。

```xml
<property>
    <name>hadoop.security.auth_to_local</name>
    <value>RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
           RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
           DEFAULT</value>
</property>
```

上記の設定を使用して、`hadoop.security.auth_to_local` プロパティを `core-site.xml` に追加するか、既存の設定を置換できます。Doris 環境に適用するには、`core-site.xml` を `fe/conf` と `be/conf` に配置します。

OUTFILE、EXPORT、Broker Load、Catalog（Hive、Iceberg、Hudi）、TVF などの機能で個別に適用する必要がある場合は、各機能のプロパティに直接設定できます。

```sql
"hadoop.security.auth_to_local" = "RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
                                   RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
                                   DEFAULT"
```

マッピングルールが正しく一致するか確認するには、異なるクラスターへのアクセス時に次のエラーが発生するかを確認します。

```
NoMatchingRule: No rules applied to hadoop/domain\_name@EMR-REALM.COM
```

このエラーが発生した場合、マッピングに失敗しています。

## ベストプラクティス

このセクションでは、[Apache Doris の公式リポジトリ](https://github.com/apache/doris/tree/master/docker/thirdparties)で提供される Docker 環境を使い、Kerberos を使用する Hive/HDFS サービスを起動し、Doris から Kerberos 対応の Hive Catalog を作成する方法を説明します。

### 環境の説明

* Doris が提供する Kerberos サービスを使用します（HIVE が二組、KDC が二組）。

  * Docker の起動ディレクトリ: `docker/thirdparties`

  * krb5.conf のテンプレート:

    [`docker-compose/kerberos/common/conf/doris-krb5.conf`](https://github.com/apache/doris/blob/master/docker/thirdparties/docker-compose/kerberos/common/conf/doris-krb5.conf)

### 1. keytab ファイルと権限を準備する

keytab ファイルをローカルディレクトリにコピーします。

```bash
mkdir -p ~/doris-keytabs
cp <hive-presto-master.keytab> ~/doris-keytabs/
cp <other-hive-presto-master.keytab> ~/doris-keytabs/
```

認証失敗を防ぐため、ファイルの権限を設定します。

```bash
chmod 400 ~/doris-keytabs/*.keytab
```

### 2. krb5.conf ファイルを準備する

1. Doris が提供する `krb5.conf` テンプレートファイルを使用します。

2. 複数の Kerberos 対応 HDFS クラスターに同時にアクセスする場合は、次の基本要件に従って **krb5.conf を統合**する必要があります。

   * `[realms]`: すべてのクラスターの Realm と KDC の IP を記述します。

   * `[domain_realm]`: ドメインまたは IP から Realm へのマッピングを記述します。

   * `[libdefaults]`: 暗号化アルゴリズムを統一します（des3-cbc-sha1 など）。

3. 例:

    ```toml
    [libdefaults]
        default_realm = LABS.TERADATA.COM
        allow_weak_crypto = true
        dns_lookup_realm = true
        dns_lookup_kdc = true

    [realms]
        LABS.TERADATA.COM = {
            kdc = 127.0.0.1
            admin_server = 127.0.0.1
        }
        OTHERREALM.COM = {
            kdc = 127.0.0.1
            admin_server = 127.0.0.1
        }

    [domain_realm]
        presto-master.docker.cluster = LABS.TERADATA.COM
        hadoop-master-2 = OTHERREALM.COM
        .labs.teradata.com = LABS.TERADATA.COM
        .otherrealm.com = OTHERREALM.COM
    ```

4. `krb5.conf` を対応する Docker ディレクトリにコピーします。

    ```bash
    cp doris-krb5.conf ~/doris-kerberos/krb5.conf
    ```

### 3. Docker の Kerberos 環境を起動する

1. ディレクトリに移動します。

    ```bash
    cd docker/thirdparties
    ```

2. Kerberos 環境を起動します。

    ```bash
    ./run-thirdparties-docker.sh -c kerberos
    ```

3. 起動後のサービスは次のとおりです。

   * Hive Metastore 1:9583
   * Hive Metastore 2:9683
   * HDFS 1:8520
   * HDFS 2:8620

### 4. コンテナーの IP を取得する

次のコマンドで Docker の IP を確認します。

```bash
docker inspect <container-name> | grep IPAddress
```

または、サービスがホストネットワークにマッピングされている場合は、127.0.0.1 を直接使用できます。

### 5. Kerberos 対応の Hive Catalog を作成する

1. Hive Catalog1

    ```sql
    CREATE CATALOG IF NOT EXISTS multi_kerberos_one
    PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9583",
    "fs.defaultFS" = "hdfs://127.0.0.1:8520",
    "hadoop.kerberos.min.seconds.before.relogin" = "5",
    "hadoop.security.authentication" = "kerberos",
    "hadoop.kerberos.principal" = "hive/presto-master.docker.cluster@LABS.TERADATA.COM",
    "hadoop.kerberos.keytab" = "/mnt/disk1/gq/keytabs/hive-presto-master.keytab",
    "hive.metastore.sasl.enabled" = "true",
    "hadoop.security.auth_to_local" = "RULE:[2:$1@$0](.*@LABS.TERADATA.COM)s/@.*//
                                        RULE:[2:$1@$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                                        RULE:[2:$1@$0](.*@OTHERREALM.COM)s/@.*//
                                        DEFAULT",
    "hive.metastore.kerberos.principal" = "hive/hadoop-master@LABS.TERADATA.COM"
    );
    ```

2. Hive Catalog2

    ```sql
    CREATE CATALOG IF NOT EXISTS multi_kerberos_two
    PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9683",
    "fs.defaultFS" = "hdfs://127.0.0.1:8620",
    "hadoop.kerberos.min.seconds.before.relogin" = "5",
    "hadoop.security.authentication" = "kerberos",
    "hadoop.kerberos.principal" = "hive/presto-master.docker.cluster@OTHERREALM.COM",
    "hadoop.kerberos.keytab" = "/mnt/disk1/gq/keytabs/other-hive-presto-master.keytab",
    "hive.metastore.sasl.enabled" = "true",
    "hadoop.security.auth_to_local" = "RULE:[2:$1@$0](.*@OTHERREALM.COM)s/@.*//
                                        RULE:[2:$1@$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                                        DEFAULT",
    "hive.metastore.kerberos.principal" = "hive/hadoop-master-2@OTHERREALM.COM"
    );
    ```

これで、複数の Kerberos クラスターへのアクセス設定は完了です。異なる Kerberos 認証情報を使用して、両方の Hive クラスターのデータを参照できます。
## 接続テストツール

Kerberos などの外部依存先への接続を確認するには、オープンソースツールの **Pulse** を使用できます。

**Pulse は独立したオープンソースの接続テストツールです。
使用方法、インストール方法、リリース情報については、プロジェクトのドキュメントを参照してください。**

- ドキュメント: [Kerberos 接続テストツール](https://github.com/CalvinKirs/Pulse/tree/main/kerberos-tools)
- リリースパッケージ: [Kerberos 接続テストツール v1.0.0](https://github.com/CalvinKirs/Pulse/releases/tag/v1.0.0)
## よくある質問（FAQ）
1. javax.security.sasl.SaslException: No common protection layer between client and server
   - 原因: クライアントの `hadoop.rpc.protection` が HDFS クラスターの設定と異なります。
   - 対処方法: クライアントと HDFS サーバーの `hadoop.rpc.protection` を一致させます。

2. No valid credentials provided (Mechanism level: Illegal key size)
   - 原因: Java はデフォルトで 128 ビットを超える暗号鍵をサポートしません。
   - 対処方法: Java Cryptography Extension（JCE）Unlimited Strength Policy をインストールし、JAR ファイルを `$JAVA_HOME/jre/lib/security` に展開してサービスを再起動します。

3. Encryption type AES256 CTS mode with HMAC SHA1-96 is not supported/enabled
   - 原因: 現在の Java 環境は AES256 に対応していませんが、Kerberos 側で使用されている可能性があります。
   - 対処方法: `/etc/krb5.conf` の `[libdefaults]` を更新してサポート対象の暗号方式を使用するか、JCE 拡張機能をインストールして AES256 を有効にします（上記と同様）。

4. No valid credentials provided (Mechanism level: Failed to find any Kerberos tgt)
   - 原因: Kerberos が有効な Ticket Granting Ticket（TGT）を見つけられません。以前は動作していた環境では、チケットの期限切れまたは KDC の再起動が原因です。新しい環境では、`krb5.conf` または keytab が誤っているか、破損しています。
   - 対処方法: `krb5.conf` と keytab を確認し、チケットが有効であることを確かめてから、`kinit` で新しいチケットの取得を試みます。

5. Failure unspecified at GSS-API level (Mechanism level: Checksum failed)
   - 原因: GSS-API のチェックサム検証に失敗しています。`kinit` で誤ったパスワードを使用したか、keytab が無効または古い鍵バージョンであるため、JVM がパスワード認証に切り替わっています。
   - 対処方法: `kinit` で正しいパスワードを使用し、keytab が最新かつ有効であることを確認します。

6. Receive timed out
   - 原因: 不安定なネットワークや大きなパケットで、KDC との通信に UDP を使用しています。
   - 対処方法: `/etc/krb5.conf` に次の設定を追加し、Kerberos に TCP を使用させます。
```shell
[libdefaults]
udp_preference_limit = 1
```

7. javax.security.auth.login.LoginException: Unable to obtain password from user
   - 原因: プリンシパルが keytab と一致しないか、アプリケーションが `krb5.conf` または keytab を読み取れません。
   - 対処方法:
      - `klist -kt <keytab_file>` と `kinit -kt <keytab_file> <principal>` を使用して、keytab とプリンシパルを検証します。
      - 実行ユーザーが読み取れるように、`krb5.conf` と keytab のパスと権限を確認します。
      - JVM の起動オプションで正しい設定ファイルのパスが指定されていることを確認します。

8. Principal not found or Could not resolve Kerberos principal name
   - 原因:
      - プリンシパル内のホスト名を解決できません。
      - `_HOST` プレースホルダーが KDC に認識されないホスト名に展開されます。
      - DNS または `/etc/hosts` の設定に誤りがあります。
   - 対処方法:
      - プリンシパルの表記を確認します。
      - 関連するすべてのノード（Doris FE/BE と KDC）に、正しいホスト名と IP アドレスの対応が登録されていることを確認します。

9. Cannot find KDC for realm "XXX"
   - 原因: 指定した Realm の KDC が `krb5.conf` に設定されていません。
   - 対処方法:
      - `[realms]` 内の Realm 名を確認します。
      - `kdc` のアドレスを確認します。
      - `/etc/krb5.conf` を変更した後、BE と FE を再起動します。

10. Request is a replay
   - 原因: KDC が認証要求を重複と判断しています。典型的な原因は、ノード間の時刻のずれや、複数のサービスによる同じプリンシパルの共有です。
   - 対処方法:
      - すべてのノードで NTP を有効にし、時刻を同期します。
      - 共有を避けるため、`service/_HOST@REALM` のようにサービスインスタンスごとに固有のプリンシパルを使用します。

11. Client not found in Kerberos database
   - 原因: クライアントプリンシパルが Kerberos データベースに存在しません。
   - 対処方法: KDC にプリンシパルを作成します。

12. Message stream modified (41)
   - 原因: 特定の OS（CentOS 7 など）と Kerberos/Java の組み合わせで知られている問題です。
   - 対処方法: ベンダーのパッチまたはセキュリティ更新を適用します。

13. Pre-authentication information was invalid (24)
   - 原因:
      - 事前認証データが無効です。
      - クライアントと KDC の間で時刻がずれています。
      - JDK の暗号方式の設定が KDC と一致しません。
   - 対処方法:
      - すべてのノードの時刻を同期します。
      - 暗号方式の設定を一致させます。
