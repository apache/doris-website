---
{
    "title": "Ranger による Doris の認可",
    "language": "ja",
    "description": "Apache Doris の権限管理を Apache Ranger に移行する方法を説明します。プラグインのインストール、Catalog・データベース・テーブル・列・行レベルのポリシー、データマスキング、Kerberos 連携、よくある問題を扱います。",
    "keywords": [
        "Apache Doris Ranger",
        "Doris Ranger authorization",
        "Ranger plugin installation",
        "ranger-doris-plugin",
        "ranger-doris-security.xml",
        "Doris permission management",
        "Doris column permissions",
        "Row Level Filter",
        "data masking",
        "Ranger Kerberos",
        "access_controller_type",
        "ranger-doris"
    ]
}
---

<!-- Knowledge type: configuration guide / permission management -->
<!-- Applicable scenario: use Apache Ranger to manage Apache Doris database, table, column, row-level, and masking permissions in one place -->

Apache Ranger は、Hadoop プラットフォーム上でサービスを監視・有効化し、データへのアクセスを管理するためのセキュリティフレームワークです。Apache Doris で Ranger を有効にすると、権限管理は Doris 内部の `GRANT` 文から Ranger の一元的な設定に移り、Hive や HDFS などのコンポーネントと同じ権限管理システムを共有しやすくなります。

このドキュメントでは、Doris 用 Ranger プラグインのインストールと設定、および Ranger でのグローバル、Catalog、データベース、テーブル、列、行レベル、マスキングの各ポリシーの定義方法を説明します。

## 適用シナリオ

| シナリオ | 説明 |
| --- | --- |
| 権限管理の統一 | すでに Ranger で Hive/HDFS を管理しており、Doris にも同じ権限ポリシーを適用したい場合 |
| きめ細かな認可 | 列、行レベルのデータ、機密フィールドに対して、きめ細かな認可やマスキングが必要な場合 |
| Kerberos 環境 | Ranger Admin で Kerberos が有効になっており、Doris が Kerberos ID を使用してポリシーを取得する必要がある場合 |
| 内部認可からの移行 | Doris 内部の `GRANT/REVOKE` の使用をやめ、Ranger で認可を一元管理したい場合 |

## 前提条件

- Apache Ranger Admin サービスがデプロイされており（バージョン 2.x 以降を推奨）、HTTP/HTTPS でアクセスできること。
- Apache Doris クラスターがデプロイされており、FE/BE ノードから Ranger Admin サービスに接続できること。
- サービス定義とポリシーを作成するための Ranger WebUI の管理者アカウントがあること。
- 行レベルフィルタリングとデータマスキングには Doris **2.1.3** 以降、Compute Group と Storage Vault の権限には Doris **3.0.6** 以降が必要です。

## 設定手順の概要

1. Ranger サーバーに Doris プラグインをインストールします（Jar とサービス定義 JSON をアップロードします）。
2. Ranger WebUI で Doris サービスを作成し、接続情報を入力します。
3. Doris FE 側で `access_controller_type=ranger-doris` を設定し、`ranger-doris-security.xml` を配置します。
4. （任意）Ranger Admin で Kerberos が有効な場合は、`krb5.conf` を統合し、設定に UGI パラメーターを追加します。
5. Doris クラスターを再起動し、Ranger でユーザーのポリシーを設定して、Doris で確認します。

## Doris Ranger プラグインのインストールと設定

### プラグインのインストール

1. 次のファイルをダウンロードします。

    - [ranger-doris-plugin-3.0.0-SNAPSHOT.jar](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/release/ranger/dev/ranger-doris-plugin-3.0.0-SNAPSHOT.jar)
    - [mysql-connector-java-8.0.25.jar](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/release/jdbc_driver/mysql-connector-java-8.0.25.jar)

    :::caution 注意
    対応するブランチの `ranger-doris-plugin-3.0.0-SNAPSHOT.jar` をダウンロードしてください。一致しない場合は動作しません。
    :::

2. ダウンロードしたファイルを Ranger サービスの `ranger-plugins/doris` ディレクトリに配置します。例：

    ```text
    /usr/local/service/ranger/ews/webapp/WEB-INF/classes/ranger-plugins/doris/ranger-doris-plugin-3.0.0-SNAPSHOT.jar
    /usr/local/service/ranger/ews/webapp/WEB-INF/classes/ranger-plugins/doris/mysql-connector-java-8.0.25.jar
    ```

3. Ranger サービスを再起動します。

4. [ranger-servicedef-doris.json](https://github.com/morningman/ranger/blob/doris-plugin/agents-common/src/main/resources/service-defs/ranger-servicedef-doris.json) をダウンロードします。

    :::caution 注意
    対応するブランチの `ranger-servicedef-doris.json` をダウンロードしてください。一致しない場合は動作しません。
    :::

5. 次のコマンドでサービス定義ファイルを Ranger サービスにアップロードし、Apache Doris プラグインの定義を登録します。

    ```shell
    curl -u user:password -X POST \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        http://172.21.0.32:6080/service/plugins/definitions \
        -d@ranger-servicedef-doris.json
    ```

    各項目は次のとおりです。

    - ユーザー名とパスワードは、Ranger WebUI へのログインに使用する認証情報です。
    - サービスのアドレスとポートは、`ranger.service.http.port` 項目（設定ファイル `ranger-admin-site.xml` 内）で確認できます。

    コマンドが成功すると、サービス定義が JSON 形式で返されます。例：

    ```json
    {
      "id": 207,
      "guid": "d3ff9e41-f9dd-4217-bb5f-3fa9996454b6",
      "isEnabled": true,
      "createdBy": "Admin",
      "updatedBy": "Admin",
      "createTime": 1705817398112,
      "updateTime": 1705817398112,
      "version": 1,
      "name": "doris",
      "displayName": "Apache Doris",
      "implClass": "org.apache.ranger.services.doris.RangerServiceDoris",
      "label": "Doris",
      "description": "Apache Doris",
      "options": {
        "enableDenyAndExceptionsInPolicies": "true"
      },
      ...
    }
    ```

    定義を作成し直すには、次のコマンドで削除してから再度アップロードします（`207` は定義の作成時に返された `id` です）。

    ```shell
    curl -v -u user:password -X DELETE \
        http://172.21.0.32:6080/service/plugins/definitions/207
    ```

    削除する前に、Ranger WebUI ですでに作成した Doris サービスを削除する必要があります。次のコマンドで、登録済みのサービス定義を一覧表示して `id` を取得することもできます。

    ```shell
    curl -v -u user:password -X GET \
        http://172.21.0.32:6080/service/plugins/definitions/
    ```

### プラグインの設定

インストール後、Ranger WebUI を開きます。Service Manager ページに Apache Doris プラグインが表示されます。

![Ranger の Service Manager に表示された Apache Doris プラグイン](/images/ranger/ranger1.png)

プラグインの横にある `+` ボタンをクリックして、Doris サービスを追加します。

![Doris サービスの追加画面](/images/ranger/ranger2.png)

Config Properties セクションのパラメーターは次のとおりです。

| パラメーター | 説明 |
| --- | --- |
| `Service Name` | サービス名。Doris はこの名前に基づいてポリシーを取得します。`ranger.plugin.doris.service.name`（`ranger-doris-security.xml` 内）と一致させる必要があります。`doris` を推奨します。一致しない場合、Doris がポリシーを取得できず、認証に失敗します |
| `Username` / `Password` | Doris クラスターのユーザー名とパスワード。Admin ユーザーを推奨します |
| `jdbc.driver_class` | Doris への接続に使用する JDBC ドライバー。例：`com.mysql.cj.jdbc.Driver` |
| `jdbc.url` | Doris クラスターの JDBC URL。例：`jdbc:mysql://172.21.0.101:9030?useSSL=false` |
| `resource.lookup.timeout.value.in.ms` | メタデータ取得時のタイムアウトを指定する追加パラメーター。`10000`（10 秒）を推奨します |

`Test Connection` をクリックして、接続を確認できます。

:::info 注記
Doris がすでに起動しており、`fe.conf` に `access_controller_type=ranger-doris` が設定されている場合、`Test Connection` をクリックすると `fail` が返されます。これは Ranger の認証サービスがまだ作成されておらず、Doris がポリシーを取得できないためです。想定どおりの動作なので、そのままサービスの作成に進んでください。
:::

次に `Add` をクリックしてサービスを追加します。作成したサービスは、Service Manager ページの Apache Doris プラグインの下に表示されます。サービスをクリックして、Ranger ポリシーの設定を開始します。

## Doris 側で Ranger を有効にする

### Doris の設定を変更する

1. `fe/conf/fe.conf` ファイルで、認証方式を Ranger に設定します。

    ```text
    access_controller_type=ranger-doris
    ```

2. 各 FE ノードに `ranger-doris-security.xml` ファイルを作成し、`conf` ディレクトリに配置します。内容は次のとおりです。

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
    <configuration>
        <property>
            <name>ranger.plugin.doris.policy.cache.dir</name>
            <value>/path/to/ranger/cache/</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.pollIntervalMs</name>
            <value>30000</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.rest.client.connection.timeoutMs</name>
            <value>60000</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.rest.client.read.timeoutMs</name>
            <value>60000</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.rest.url</name>
            <value>http://172.21.0.32:6080</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.source.impl</name>
            <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
        </property>
        <property>
            <name>ranger.plugin.doris.service.name</name>
            <value>doris</value>
        </property>
    </configuration>
    ```

    変更が必要な主な設定項目は次のとおりです。

    | 設定項目 | 説明 |
    | --- | --- |
    | `ranger.plugin.doris.policy.cache.dir` | Ranger Server から取得した権限キャッシュファイルの保存先です。**このディレクトリは手動で作成する必要があります** |
    | `ranger.plugin.doris.policy.rest.url` | Ranger Admin サービスのアドレスです。実際のアドレスに置き換えてください |
    | `ranger.plugin.doris.service.name` | Ranger WebUI で作成したサービス名と一致させる必要があります。デフォルトは `doris` です |
    | `ranger.plugin.doris.policy.pollIntervalMs` | ポリシーを取得する間隔です。単位はミリ秒です |

3. クラスターを起動します。

### Ranger Server で Kerberos が有効な場合の設定

<!-- Knowledge type: configuration parameters -->
<!-- Applicable scenario: Ranger Admin has Kerberos enabled / cross-realm authentication -->

Ranger Admin サービス自体で Kerberos 認証が有効になっている場合、Doris 内の Ranger Client はポリシーの取得時に Kerberos ID を使用して Ranger Admin に認証する必要があります。これを設定しないと、ポリシーの取得に失敗し、認証が有効になりません。次の二つの追加設定を行ってください。

#### 1. krb5.conf を統合する

Doris の Ranger Client が Kerberos にログインする際、内部で JVM の `Krb5LoginModule` を使用します。これは**各 FE/BE ノードの `/etc/krb5.conf`** から KDC アドレスを読み取ります。環境内に複数の Kerberos レルムがある場合（たとえば、HDFS クラスターと Ranger Admin が動作するクラスターでレルムが異なる場合）、すべてのレルムの KDC 情報を一つの `/etc/krb5.conf` ファイルに**統合**し、そのファイルをすべての FE ノードと BE ノードに配置する必要があります。

統合した `krb5.conf` の例を次に示します。

```ini
[libdefaults]
    default_realm = HADOOP.EXAMPLE.COM
    dns_lookup_realm = true
    dns_lookup_kdc = true

[realms]
    # Realm of the HDFS / Hive cluster
    HADOOP.EXAMPLE.COM = {
        kdc = hadoop-kdc.example.com:88
        admin_server = hadoop-kdc.example.com
    }
    # Realm of the cluster where Ranger Admin runs (merge it in if it differs from the one above)
    RANGER.EXAMPLE.COM = {
        kdc = ranger-kdc.example.com:88
        admin_server = ranger-kdc.example.com
    }

[domain_realm]
    hadoop-kdc.example.com = HADOOP.EXAMPLE.COM
    ranger-admin.example.com = RANGER.EXAMPLE.COM
```

:::caution 注意
`/etc/krb5.conf` を変更または追加した後は、設定を反映するためにすべての FE ノードと BE ノードを再起動する必要があります。
:::

#### 2. ranger-hive-security.xml（または ranger-doris-security.xml）に Kerberos UGI を設定する

各 FE ノードの `fe/conf/` ディレクトリで、`ranger-hive-security.xml`（Hive Ranger 認証を使用する場合）または `ranger-doris-security.xml`（Doris Ranger 認証を使用する場合）を探します。ファイルがなければ作成し、`<configuration>` 内に次の 4 つの設定項目を追加します。

```xml
<!-- Enable UGI Kerberos login -->
<property>
    <name>ranger.plugin.hive.ugi.initialize</name>
    <value>true</value>
</property>
<!-- Login method: keytab -->
<property>
    <name>ranger.plugin.hive.ugi.login.type</name>
    <value>keytab</value>
</property>
<!-- Principal in the keytab file -->
<property>
    <name>ranger.plugin.hive.ugi.keytab.principal</name>
    <value>hive/hostname@RANGER.EXAMPLE.COM</value>
</property>
<!-- Path to the keytab file (must be deployed to every FE node) -->
<property>
    <name>ranger.plugin.hive.ugi.keytab.file</name>
    <value>/etc/security/keytabs/hive.keytab</value>
</property>
```

各設定項目の意味は次のとおりです。

| 設定項目 | 説明 |
| --- | --- |
| `ranger.plugin.hive.ugi.initialize` | プラグインの読み込み時に UGI の Kerberos ログインを初期化するかどうか |
| `ranger.plugin.hive.ugi.login.type` | ログイン方式。`keytab` に固定します |
| `ranger.plugin.hive.ugi.keytab.principal` | keytab ファイルに実際に存在するプリンシパル。例：`hive/your-host@YOUR-REALM.COM`。`klist -kt /path/to/hive.keytab` で確認できます |
| `ranger.plugin.hive.ugi.keytab.file` | keytab ファイルの絶対パス。Doris FE プロセスを実行するユーザーがこのファイルを読み取れるようにしてください（`chmod 400` を推奨します） |

:::tip 注記
- **Doris Ranger 認証**（`ranger-doris-security.xml`）を使用する場合は、上記の設定項目の `hive` を `doris` に置き換えます。例：`ranger.plugin.doris.ugi.initialize`。
- 設定完了後は、反映するために **FE を再起動**する必要があります。
:::

:::warning 既知の制限：複数の Catalog でグローバル UGI が上書きされる
Doris に組み込まれた Ranger Plugin は、現在 Kerberos ログインに Hadoop の `UserGroupInformation`（UGI）を使用します。JVM プロセスは通常、グローバルなログインユーザーの状態を一つだけ共有するため、Doris で**異なるプリンシパルを使用する複数の Kerberos 対応 Ranger Catalog** を設定すると、UGI が互いに上書きされます。

**具体的な動作**：

1. Catalog A が初期化されて `keytab_A` でログインすると、グローバル UGI は `Principal_A` になります。
2. 次に Catalog B が初期化されて `keytab_B` でログインすると、グローバル UGI は `Principal_B` に上書きされます。
3. その後、Catalog A 用 Ranger プラグインのバックグラウンドスレッドが Ranger Admin から権限ポリシーを取得するときに、誤って `Principal_B` のチケットを使用するため、認証エラーとポリシー取得エラーが発生します。

**現在の推奨事項**：同じ Doris クラスター内で Ranger を有効にするすべての Kerberos データソースについて、**同じ Kerberos プリンシパルと同じ keytab ファイルを使用するように計画**してください。これにより、UGI の相互上書きによる認証エラーを回避できます。
:::

## 権限設定の例 {#permission-examples}

<!-- Knowledge type: procedural steps -->
<!-- Applicable scenario: configure permissions at various levels for Doris users in Ranger -->

Doris ユーザーに権限を付与する手順は次のとおりです。

1. Doris で `user1` を作成します。
2. 先に Doris で `admin` ユーザーを使用し、Catalog `hive` を作成します。
3. Ranger で `user1` を作成します。現在、Ranger から Doris へも Doris から Ranger へもユーザーを自動同期できないため、手動で作成する必要があります。**Doris と同じユーザー名にしてください**。Ranger でのユーザー作成手順については、Ranger の公式ドキュメントを参照してください。`Settings -> Users` でユーザーを作成します。

Ranger で Doris に設定できる権限の範囲を次の表に示します。

| 権限の範囲 | 対応する Doris の GRANT 文 | 選択方法 |
| --- | --- | --- |
| グローバル権限 | `grant select_priv on *.*.* to user1` | Catalog と同じ階層のドロップダウンで `global` を選択します。入力欄には `*` のみ指定できます |
| Catalog 権限 | `grant select_priv on hive.*.* to user1` | Catalog のドロップダウンで対象の Catalog を選択します |
| データベース権限 | `grant select_priv on hive.tpch.* to user1` | Catalog と Database を指定します |
| テーブル権限 | `grant select_priv on hive.tpch.user to user1` | Catalog、Database、テーブルを指定します |
| 列権限 | `grant select_priv(name,age) on hive.tpch.user to user1` | テーブル権限に加えて列を選択します |
| Resource 権限 | `grant usage_priv on resource 'resource1' to user1` | Catalog と同じ階層のドロップダウンで `resource` を選択します |
| Workload Group 権限 | `grant usage_priv on workload group 'group1' to user1` | Catalog と同じ階層のドロップダウンで `workload group` を選択します |
| Compute Group 権限（3.0.6 以降） | `grant usage_priv on compute group 'group1' to user1` | Catalog と同じ階層のドロップダウンで `compute group` を選択します |
| Storage Vault 権限（3.0.6 以降） | `grant usage_priv on storage vault 'vault1' to user1` | Catalog と同じ階層のドロップダウンで `storage vault` を選択します |

権限の範囲ごとの Ranger 設定例を以下に示します。

### グローバル権限

Doris 内部の認可文 `grant select_priv on *.*.* to user1` に相当します。

- Catalog と同じ階層のドロップダウンに `global` オプションがあります。
- 入力欄には `*` のみ指定できます。

![Ranger でのグローバル権限の設定例](/images/ranger/global.png)

### Catalog 権限

Doris 内部の認可文 `grant select_priv on hive.*.* to user1` に相当します。

![Ranger での Catalog 権限の設定例](/images/ranger/catalog.png)

### データベース権限

Doris 内部の認可文 `grant select_priv on hive.tpch.* to user1` に相当します。

![Ranger でのデータベース権限の設定例](/images/ranger/database.png)

### テーブル権限

> ここでのテーブルには、テーブル、ビュー、非同期マテリアライズドビューを含みます。

Doris 内部の認可文 `grant select_priv on hive.tpch.user to user1` に相当します。

![Ranger でのテーブル権限の設定例](/images/ranger/table.png)

### 列権限

Doris 内部の認可文 `grant select_priv(name,age) on hive.tpch.user to user1` に相当します。

![Ranger での列権限の設定例](/images/ranger/column.png)

### Resource 権限

Doris 内部の認可文 `grant usage_priv on resource 'resource1' to user1` に相当します。

- Catalog と同じ階層のドロップダウンに `resource` オプションがあります。

![Ranger での Resource 権限の設定例](/images/ranger/resource.png)

### Workload Group 権限

Doris 内部の認可文 `grant usage_priv on workload group 'group1' to user1` に相当します。

- Catalog と同じ階層のドロップダウンに `workload group` オプションがあります。

![Ranger での Workload Group 権限の設定例](/images/ranger/group1.png)

### Compute Group 権限

> バージョン 3.0.6 以降でサポートされます。

Doris 内部の認可文 `grant usage_priv on compute group 'group1' to user1` に相当します。

- Catalog と同じ階層のドロップダウンに `compute group` オプションがあります。

![Ranger での Compute Group 権限の設定例](/images/ranger/compute-group.png)

### Storage Vault 権限

> バージョン 3.0.6 以降でサポートされます。

Doris 内部の認可文 `grant usage_priv on storage vault 'vault1' to user1` に相当します。

- Catalog と同じ階層のドロップダウンに `storage vault` オプションがあります。

![Ranger での Storage Vault 権限の設定例](/images/ranger/storage-vault.png)

## 行レベル権限の例

> バージョン 2.1.3 以降でサポートされます。

1. [権限設定の例](#permission-examples)に従い、`user1` に `select` 権限を付与します。対象は `internal.db1.user` テーブルです。
2. Ranger で Row Level Filter ポリシーを追加します。

    ![Row Level Filter ポリシーの設定例](/images/ranger/ranger-row-policy.jpeg)

3. `user1` として Doris にログインし、`select * from internal.db1.user` を実行します。`id > 3` かつ `age = 2` を満たす行だけが表示されます。

## データマスキングの例

> バージョン 2.1.3 以降でサポートされます。

1. [権限設定の例](#permission-examples)に従い、`user1` に `select` 権限を付与します。対象は `internal.db1.user` テーブルです。
2. Ranger で Masking ポリシーを追加します。

    ![データマスキングポリシーの設定例](/images/ranger/ranger-data-mask.png)

3. `user1` として Doris にログインし、`select * from internal.db1.user` を実行します。`phone` フィールドは指定したルールに従ってマスキングされて表示されます。

## よくある問題

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenario: Ranger authentication failures / policy pull exceptions / log inspection -->

### Q: Ranger へのアクセスに失敗します。ログはどこで確認できますか？

各 FE に `log4j.properties` ファイルを作成し、`conf` ディレクトリに配置します。内容は次のとおりです。

```text
log4j.rootLogger = warn,stdout,D

log4j.appender.stdout = org.apache.log4j.ConsoleAppender
log4j.appender.stdout.Target = System.out
log4j.appender.stdout.layout = org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern = [%-5p] %d{yyyy-MM-dd HH:mm:ss,SSS} method:%l%n%m%n

log4j.appender.D = org.apache.log4j.DailyRollingFileAppender
log4j.appender.D.File = /path/to/fe/log/ranger.log
log4j.appender.D.Append = true
log4j.appender.D.Threshold = INFO
log4j.appender.D.layout = org.apache.log4j.PatternLayout
log4j.appender.D.layout.ConversionPattern = %-d{yyyy-MM-dd HH:mm:ss}  [ %t:%r ] - [ %p ]  %m%n
```

各項目は次のように設定します。

- `log4j.appender.D.File` を実際のログ保存先に変更します。Ranger プラグインのログがここに保存されます。
- 必要に応じて `log4j.rootLogger` のログレベルを調整します（`debug` や `info` など）。`debug` はデバッグ専用です。本番環境では使用しないでください。ログ量が非常に多くなり、認証性能が低下します。

### Q: Row Level Filter ポリシーを設定しましたが、クエリ時に権限エラーが発生します。なぜですか？

Row Level Filter ポリシーは、ユーザーがテーブル内でアクセスできる行を制限するだけです。**ユーザーには別途 ACCESS POLICY を付与する必要があります**。

### Q: サービスを作成すると、デフォルトでは `admin` ユーザーにしか権限がなく、`root` ユーザーには権限がありません。どうすればよいですか？

図のように、サービスの作成時に `default.policy.users` 設定を追加します。複数のユーザーにすべての権限を付与するには、`,` で区切ります。

![default.policy.users の設定例](/images/ranger/default-policy.png)

### Q: Ranger 認証を有効にした後も、Doris 内部の認可は機能しますか？

いいえ。ロールの作成や削除もできません。すべての権限を Ranger で設定する必要があります。
