---
{
  "title": "Kerberos ベストプラクティス",
  "description": "ユーザーが複数のデータソース間でのフェデレーテッド分析クエリにDorisを使用する場合、",
  "language": "ja"
}
---
ユーザーが複数のデータソースに対してDorisを使用してフェデレーテッド分析クエリを実行する場合、異なるクラスタが異なるKerberos認証資格情報を使用することがあります。

大手ファンド会社を例に挙げます。その内部データプラットフォームは複数の機能別クラスタに分かれており、異なる技術チームまたは事業チームによって保守され、それぞれが独立したKerberos Realmsで身元認証とアクセス制御を設定しています：

- Productionクラスタは日次純資産価値計算とリスク評価に使用され、厳格に分離されたデータで認可されたサービスのアクセスのみを許可します（Realm: PROD.FUND.COM）。
- Analysisクラスタは戦略研究とモデルバックテストに使用され、DorisはTVFを通じてこのクラスタに一時的なクエリを実装します（Realm: ANALYSIS.FUND.COM）。
- Data lakeクラスタはIceberg カタログを統合して大量の履歴市場データ、ログ、その他のデータをアーカイブおよび分析します（Realm: LAKE.FUND.COM）。

これらのクラスタはクロスドメイン信頼関係を確立しておらず、認証情報を共有できないため、これらの異種データソースへの統一アクセスには複数のKerberosインスタンスの認証とコンテキスト管理の同時サポートが必要です。

**本ドキュメントでは、マルチKerberos環境でのデータソースの設定とアクセス方法に焦点を当てます。**

> この機能は3.1+からサポートされています

## マルチKerberosクラスタ認証設定

### krb5.conf

`krb5.conf`にはKerberos設定情報、KDCの場所、Kerberosサービスの一部の**デフォルト値**、およびホスト名とRealmのマッピング情報が含まれています。

krb5.confを適用する際は、すべてのノードに配置することを確認してください。デフォルトの場所は`/etc/krb5.conf`です。

### realms

EXAMPLE.COMなど、多くのクライアントのKDCとKerberosネットワークを含みます。

複数のクラスタを設定する場合、一つの`krb5.conf`に複数のRealmsを設定する必要があります。KDCと`admin_server`もドメイン名にできます。

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

Kerberosサービスが配置されているノードに対して、ドメインからRealmへのマッピングを設定します。

```toml
[libdefaults]
dns_lookup_realm = true
dns_lookup_kdc = true
[domain_realm]
172.21.16.8 = EMR-IP.EXAMPLE
emr-host.example = EMR-HOST.EXAMPLE
```
例えば、プリンシパル `emr1/domain_name@realm.com` の場合、KDCを検索する際に `domain_name` を使用して対応するRealmを見つけます。これが一致しない場合、そのRealmのKDCを見つけることができません。

通常、`domain_realm` に関連するエラーが2種類、DorisのLog/be.outまたはlog/fe.outで確認できます：

```
* Unable to locate KDC for realm/Cannot locate KDC

* No service creds
```
### keytab and principal

複数のKerberosクラスタ環境では、keytabファイルは通常異なるパスを使用します。例えば、`/path/to/serverA.keytab`、`/path/to/serverB.keytab`などです。異なるクラスタにアクセスする際は、対応するkeytabを使用する必要があります。

HDFSクラスタでKerberos認証が有効になっている場合、通常`core-site.xml`ファイルで`hadoop.security.auth_to_local`プロパティを確認できます。これはKerberosプリンシパルをより短いローカルユーザー名にマッピングするために使用され、HadoopはKerberos構文ルールを再利用します。

設定されていない場合、`NoMatchingRule("No rules applied to`例外が発生する可能性があります。コードを参照してください：

[hadoop/src/core/org/apache/hadoop/security/KerberosName.java](https://github.com/hanborq/hadoop/blob/master/src/core/org/apache/hadoop/security/KerberosName.java#L399)

`hadoop.security.auth_to_local`パラメータには、プリンシパルをRULEに対して上から下へマッチングするマッピングルールのセットが含まれています。マッチするマッピングルールが見つかると、ユーザー名を出力し、マッチしないルールは無視されます。具体的な設定フォーマット：

```
RULE:[<principal translation>](acceptance filter)<short name substitution>
```
異なるKerberosサービスがマルチクラスタ環境で使用するプリンシパルをマッチさせるために、推奨される設定は以下の通りです：

```xml
<property>
    <name>hadoop.security.auth_to_local</name>
    <value>RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
           RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
           DEFAULT</value>
</property>
```
上記の設定は、`core-site.xml`内の`hadoop.security.auth_to_local`プロパティを追加または置換するために使用できます。`core-site.xml`を`fe/conf`と`be/conf`に配置して、Doris環境で有効にします。

OUTFILE、EXPORT、Broker Load、カタログ（Hive、Iceberg、Hudi）、TVF、およびその他の機能で個別に有効にする必要がある場合は、それらのプロパティで直接設定できます：

```sql
"hadoop.security.auth_to_local" = "RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
                                   RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
                                   DEFAULT"
```
マッピングルールが正しく一致するかどうかを確認するには、異なるクラスターにアクセスする際にこのエラーが発生するかどうかをチェックしてください：

```
NoMatchingRule: No rules applied to hadoop/domain\_name@EMR-REALM.COM
```
表示された場合、マッチングが失敗したことを示します。

## ベストプラクティス

このセクションでは、[Apache Doris公式リポジトリ](https://github.com/apache/doris/tree/master/docker/thirdparties)が提供するDocker環境を使用して、DockerでKerberosを使用したHive/HDFSサービスを開始し、DorisからKerberos対応のHive Catalogを作成する方法を紹介します。

### 環境説明

* Dorisが提供するKerberosサービスを使用（2セットのHIVE、2セットのKDC）：

  * Docker起動ディレクトリ：`docker/thirdparties`

  * krb5.confテンプレート：

    [`docker-compose/kerberos/common/conf/doris-krb5.conf`](https://github.com/apache/doris/blob/master/docker/thirdparties/docker-compose/kerberos/common/conf/doris-krb5.conf)

### 1. keytabファイルと権限の準備

keytabファイルをローカルディレクトリにコピー：

```bash
mkdir -p ~/doris-keytabs
cp <hive-presto-master.keytab> ~/doris-keytabs/
cp <other-hive-presto-master.keytab> ~/doris-keytabs/
```
認証の失敗を防ぐため、ファイルのアクセス許可を設定してください：

```bash
chmod 400 ~/doris-keytabs/*.keytab
```
### 2. krb5.confファイルの準備

1. Dorisによって提供される`krb5.conf`テンプレートファイルを使用します

2. 複数のKerberos HDFSクラスターに同時にアクセスする必要がある場合は、**krb5.confをマージ**する必要があり、基本要件は以下の通りです：

   * `[realms]`: すべてのクラスターのRealmsとKDC IPsを記述します。

   * `[domain_realm]`: ドメインまたはIPからRealmへのマッピングを記述します。

   * `[libdefaults]`: 統一された暗号化アルゴリズム（des3-cbc-sha1など）。

3. 例：

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
4. `krb5.conf`を対応するDockerディレクトリにコピーします:

    ```bash
    cp doris-krb5.conf ~/doris-kerberos/krb5.conf
    ```
### 3. Docker Kerberos環境を開始する

1. ディレクトリに移動する：

    ```bash
    cd docker/thirdparties
    ```
2. Kerberos環境を開始する：

    ```bash
    ./run-thirdparties-docker.sh -c kerberos
    ```
3. 起動後のサービスには以下が含まれます：

   * Hive Metastore 1:9583
   * Hive Metastore 2:9683
   * HDFS 1:8520
   * HDFS 2:8620

### 4. コンテナIPの取得

Docker IPを確認するには以下のコマンドを使用します：

```bash
docker inspect <container-name> | grep IPAddress
```
または、127.0.0.1 を直接使用してください（サービスがホストネットワークにマッピングされている場合）。

### 5. Kerberos Hive カタログ の作成

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
    "hadoop.kerberos.keytab" = "/mnt/disk1/gq/keytabs/keytabs/hive-presto-master.keytab",
    "hive.metastore.sasl.enabled " = "true",
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
    "hadoop.kerberos.keytab" = "/mnt/disk1/gq/keytabs/keytabs/other-hive-presto-master.keytab",
    "hive.metastore.sasl.enabled " = "true",
    "hadoop.security.auth_to_local" = "RULE:[2:$1@$0](.*@OTHERREALM.COM)s/@.*//
                                        RULE:[2:$1@$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                                        DEFAULT",
    "hive.metastore.kerberos.principal" = "hive/hadoop-master-2@OTHERREALM.COM"
    );
    ```
この時点で、マルチKerberosクラスターアクセス設定は完了です。両方のHiveクラスターからデータを表示し、異なるKerberos認証情報を使用できます。

## 接続テストツール

Kerberosなどの外部依存関係への接続を検証するために、オープンソースツール**Pulse**を使用できます。

**Pulseは独立したオープンソースの接続テストツールです。使用方法、インストール詳細、リリース情報については、プロジェクトのドキュメントを参照してください。**

- ドキュメント: [Kerberos Connectivity Tool](https://github.com/CalvinKirs/Pulse/tree/main/kerberos-tools)
- リリースパッケージ: [Kerberos Connectivity Tool v1.0.0](https://github.com/CalvinKirs/Pulse/releases/tag/v1.0.0)

## FAQ

1. javax.security.sasl.SaslException: No common protection layer between client and server
   - 原因: クライアントの`hadoop.rpc.protection`がHDFSクラスターの設定と異なります。
   - 修正: クライアントとHDFSサーバー間で`hadoop.rpc.protection`を一致させてください。

2. No valid credentials provided (Mechanism level: Illegal key size)
   - 原因: Javaはデフォルトで128ビットより大きい暗号化キーをサポートしていません。
   - 修正: Java Cryptography Extension (JCE) Unlimited Strength Policyをインストールし、JARファイルを`$JAVA_HOME/jre/lib/security`に展開してサービスを再起動してください。

3. Encryption type AES256 CTS mode with HMAC SHA1-96 is not supported/enabled
   - 原因: 現在のJava環境にAES256サポートがない一方で、KerberosがAES256を使用している可能性があります。
   - 修正: `/etc/krb5.conf`の`[libdefaults]`でサポートされている暗号を使用するよう更新するか、JCE拡張機能をインストールしてAES256を有効にしてください（上記と同様）。

4. No valid credentials provided (Mechanism level: Failed to find any Kerberos tgt)
   - 原因: KerberosがTicket Granting Ticket (TGT)を見つけることができません。以前動作していた設定では、チケットが期限切れになったかKDCが再起動しました。新しい設定では、`krb5.conf`またはkeytabが不正確または破損しています。
   - 修正: `krb5.conf`とkeytabを検証し、チケットが有効であることを確認して、`kinit`を実行して新しいチケットを取得してください。

5. Failure unspecified at GSS-API level (Mechanism level: Checksum failed)
   - 原因: GSS-APIチェックサム失敗。`kinit`で間違ったパスワードを使用した。keytabが無効であるか古いキーバージョンを持っているため、JVMがパスワードログインにフォールバックしています。
   - 修正: `kinit`で正しいパスワードを使用し、keytabが最新かつ有効であることを確認してください。

6. Receive timed out
   - 原因: 不安定なネットワークまたは大きなパケットでKDCとの通信にUDPを使用しています。
   - 修正: `/etc/krb5.conf`に以下を追加してKerberosにTCPの使用を強制してください：

```shell
[libdefaults]
udp_preference_limit = 1
```
7. javax.security.auth.login.LoginException: Unable to obtain password from user
   - 原因: Principalがkeytabと一致しないか、アプリケーションが`krb5.conf`またはkeytabを読み取れません。
   - 修正方法:
      - `klist -kt <keytab_file>`と`kinit -kt <keytab_file> <principal>`を使用してkeytabとprincipalを検証してください。
      - ランタイムユーザーが読み取れるように、`krb5.conf`とkeytabのパスと権限を確認してください。
      - JVMスタートアップオプションで正しい設定パスが指定されていることを確認してください。

8. Principal not found or Could not resolve Kerberos principal name
   - 原因:
      - principal内のホスト名が解決できません。
      - `_HOST`プレースホルダーがKDCに不明なホスト名に展開されます。
      - DNSまたは`/etc/hosts`が正しく設定されていません。
   - 修正方法:
      - principalのスペルを確認してください。
      - 関連するすべてのノード（Doris FE/BEとKDC）に正しいホスト名-IPエントリがあることを確認してください。

9. Cannot find KDC for realm "XXX"
   - 原因: 指定されたrealmに`krb5.conf`でKDCが設定されていません。
   - 修正方法:
      - `[realms]`下のrealm名を確認してください。
      - `kdc`アドレスを確認してください。
      - `/etc/krb5.conf`を変更した後、BEとFEを再起動してください。

10. Request is a replay
- 原因: KDCが認証リクエストが重複していると判断します。典型的な理由: ノード間のクロックスキューまたは同一principalを共有する複数のサービス。
- 修正方法:
   - すべてのノードでNTPを有効にして時刻を同期させてください。
   - 共有を避けるため、`service/_HOST@REALM`などのサービスインスタンスごとに一意のprincipalを使用してください。

11. クライアント not found in Kerberos database
- 原因: クライアントprincipalがKerberosデータベースに存在しません。
- 修正方法: KDCでprincipalを作成してください。

12. Message stream modified (41)
- 原因: 特定のOS（例：CentOS 7）とKerberos/Javaの組み合わせに関する既知の問題です。
- 修正方法: ベンダーパッチまたはセキュリティアップデートを適用してください。

13. Pre-authentication information was invalid (24)
- 原因:
   - 無効な事前認証データ。
   - クライアントとKDC間のクロックスキュー。
   - JDK暗号設定がKDCと一致しない。
- 修正方法:
   - すべてのノード間で時刻を同期してください。
   - 暗号設定を合わせてください。
