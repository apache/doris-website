---
{
  "title": "Ranger認証",
  "language": "ja",
  "description": "Apache Rangerは、監視、サービスの有効化に使用されるセキュリティフレームワークです、"
}
---
Apache Rangerは、Hadoopプラットフォーム上での監視、サービス有効化、および包括的なデータセキュリティアクセス管理に使用されるセキュリティフレームワークです。Rangerを使用すると、Ranger側で設定された権限が、認可のためのDorisでのGrant文の実行を置き換えます。Rangerのインストールと設定については、以下を参照してください：Installing and Configuring Doris Ranger Plugin。

## Rangerの例

### Doris設定の変更
1. `fe/conf/fe.conf`ファイルで、認可方法を`ranger access_controller_type=ranger-doris`として設定します。
2. すべてのFEのconfディレクトリに、以下の内容で`ranger-doris-security.xml`ファイルを作成します：

   ```
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
この中で、`ranger.plugin.doris.policy.cache.dir` と `ranger.plugin.doris.policy.rest.url` は実際の値に変更する必要があります。
3. クラスターを開始します。

### 権限の例
1. Doris で `user1` を作成します。
2. Doris で、まず `admin` ユーザーを使用して Catalog: `hive` を作成します。
3. Ranger で `user1` を作成します。

#### グローバル権限
Doris の内部認可ステートメント `grant select_priv on *.*.* to user1` と同等です。
- グローバルオプションは、catalog と同じレベルのドロップダウンボックスで見つけることができます。
- 入力ボックスには `*` のみ入力できます。

  ![Global Permissions](/images/ranger/global.png)

#### Catalog 権限
Doris の内部認可ステートメント `grant select_priv on hive.*.* to user1` と同等です。

![Catalog Permissions](/images/ranger/catalog.png)

#### データベース権限
Doris の内部認可ステートメント `grant select_priv on hive.db1.* to user1` と同等です。

![Database Permissions](/images/ranger/database.png)

#### テーブル権限
> ここで、「テーブル」という用語は一般的にテーブル、ビュー、非同期マテリアライズドビューを指します。

Doris の内部認可ステートメント `grant select_priv on hive.db1.tbl1 to user1` と同等です。

![Table Permissions](/images/ranger/table.png)

#### カラム権限
Doris の内部認可ステートメント `grant select_priv(col1,col2) on hive.db1.tbl1 to user1` と同等です。

![Column Permissions](/images/ranger/column.png)

#### リソース権限
Doris の内部認可ステートメント `grant usage_priv on resource 'resource1' to user1` と同等です。
- リソースオプションは、catalog と同じレベルのドロップダウンボックスで見つけることができます。

![Resource Permissions](/images/ranger/resource.png)

#### Workload Group 権限
Doris の内部認可ステートメント `grant usage_priv on workload group 'group1' to user1` と同等です。
- workload group オプションは、catalog と同じレベルのドロップダウンボックスで見つけることができます。

![ Workload Group Permissions](/images/ranger/group1.png)

#### Compute Group 権限

> バージョン 3.0.6 でサポート

Doris の内部認可ステートメント `grant usage_priv on compute group 'group1' to user1` と同等です。
- compute group オプションは、catalog と同じレベルのドロップダウンボックスで見つけることができます。

![compute group](/images/ranger/compute-group.png)

#### Storage Vault 権限

> バージョン 3.0.6 でサポート

Doris の内部認可ステートメント `grant usage_priv on storage vault 'vault1' to user1` と同等です。
- storage vault オプションは、catalog と同じレベルのドロップダウンボックスで見つけることができます。

![storage vault](/images/ranger/storage-vault.png)


### 行レベル権限の例

> バージョン 2.1.3 でサポート

1. 権限の例を参照して、`user1` に `internal.db1.user` テーブルの select 権限を付与します。
2. Ranger で、Row Level Filter ポリシーを追加します

   ![Row Policy Example](/images/ranger/ranger-row-policy.jpeg)

3. `user1` で Doris にログインします。`select * from internal.db1.user` を実行すると、条件 `id > 3` と `age = 2` を満たすデータのみ表示されます。

### データマスキングの例

> バージョン 2.1.3 でサポート

1. 権限の例を参照して、`user1` に `internal.db1.user` テーブルの select 権限を付与します。
2. Ranger で、Masking ポリシーを追加します

   ![Data Mask Example](/images/ranger/ranger-data-mask.png)

3. `user1` で Doris にログインします。`select * from internal.db1.user` を実行すると、電話番号が指定されたルールに従ってマスクされていることがわかります。

## よくある質問
1. Ranger アクセスが失敗した場合のログを表示するには？

   すべての FE の `conf` ディレクトリに `log4j.properties` ファイルを作成し、以下の内容を記述します：

    ```
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
`log4j.appender.D.File`をRangerプラグインログを保存するために使用される実際のパスに変更します。
2. Row Level Filterポリシーが設定されているが、ユーザーがクエリ時に権限拒否エラーに遭遇する。

   Row Level Filterポリシーは、テーブルのデータ内の特定のレコードへのユーザーアクセスを制限するためにのみ使用されます。ユーザーの認可は、ACCESS POLICYを通じて付与される必要があります。
3. サービス作成後、デフォルトでは'admin'ユーザーのみに権限があります` Root 'userには権限がありません

   画像に示すように、サービス作成時に`default.policy.users`設定を追加します。完全な権限を持つ複数のユーザーを設定する必要がある場合は、`,`で区切ります。
   ![default policy](/images/ranger/default-policy.png)
4. 認証にRangerを使用した後、内部認可は引き続き有効ですか？

   いいえ、使用できません。ロールの作成/削除もできません。

## Doris Ranger Pluginのインストールと設定

### Pluginのインストール

1. 以下のファイルをダウンロードします

    - [ranger-doris-plugin-3.0.0-SNAPSHOT.jar](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/release/ranger/dev/ranger-doris-plugin-3.0.0-SNAPSHOT.jar)
    - [mysql-connector-java-8.0.25.jar](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/release/jdbc_driver/mysql-connector-java-8.0.25.jar)

2. ダウンロードしたファイルをRangerサービスの`ranger-plugins/doris`ディレクトリに配置します。例：

   ```
   /usr/local/service/ranger/ews/webapp/WEB-INF/classes/ranger-plugins/doris/ranger-doris-plugin-3.0.0-SNAPSHOT.jar
   /usr/local/service/ranger/ews/webapp/WEB-INF/classes/ranger-plugins/doris/mysql-connector-java-8.0.25.jar
   ```
3. Rangerサービスを再起動します。

4. [ranger-servicedef-doris.json](https://github.com/morningman/ranger/blob/doris-plugin/agents-common/src/main/resources/service-defs/ranger-servicedef-doris.json)をダウンロードします。

5. 以下のコマンドを実行して、定義ファイルをRangerサービスにアップロードします：

   ```
   curl -u user:password -X POST \
       -H "Accept: application/json" \
       -H "Content-Type: application/json" \
       http://172.21.0.32:6080/service/plugins/definitions \
       -d@ranger-servicedef-doris.json
   ```
Ranger WebUIの実際のログイン認証情報でユーザー名とパスワードを置き換えてください。

サービスアドレスとポートは、`ranger-admin-site.xml`設定ファイルの`ranger.service.http.port`設定項目で確認できます。

実行が成功した場合、次のようなJSON形式のサービス定義が返されます：

   ```
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
サービス定義を再作成したい場合は、以下のコマンドを使用してサービス定義を削除してから再アップロードできます：

   ```
   curl -v -u user:password -X DELETE \
   http://172.21.0.32:6080/service/plugins/definitions/207
   ```
`207`を実際のサービス定義作成時に返されたIDに置き換えてください。

削除前に、Ranger WebUIで作成されたDorisサービスを削除する必要があります。

以下のコマンドを使用して現在のサービス定義を一覧表示し、IDを取得することもできます：

   ```
   curl -v -u user:password -X GET \
   http://172.21.0.32:6080/service/plugins/definitions/
   ```
### Plugin設定

インストール後、Ranger WebUIを開くと、Service Managerインターフェースで Apache Doris pluginを確認できます：

![ranger](/images/ranger/ranger1.png)

pluginの横にある`+`ボタンをクリックして、Dorisサービスを追加します：

![ranger2](/images/ranger/ranger2.png)

Config Propertiesセクションには以下のパラメータがあります：

- `Username`/`Password`：DorisクラスタのユーザーネームとパスワードAdminユーザーの使用を推奨します。
- `jdbc.driver_class`：Dorisに接続するために使用されるJDBCドライバー。`com.mysql.cj.jdbc.Driver`
- `jdbc.url`：DorisクラスタのJDBC URL接続文字列。`jdbc:mysql://172.21.0.101:9030?useSSL=false`
- 追加パラメータ：
    - `resource.lookup.timeout.value.in.ms`：メタデータ取得のタイムアウト。`10000`（10秒）に設定することを推奨します。

`Test Connection`をクリックして接続が成功するかどうか確認できます。

`Add`をクリックした後、Apache Doris pluginのService Managerインターフェースで作成されたサービスを確認できます。サービスをクリックしてRangerの設定を開始します。
