---
{
    "title": "Kyuubi",
    "language": "ja",
    "description": "Apache Doris と Apache Kyuubi の連携について、JDBC Engine の設定、MySQL ドライバーの配置、Thrift プロトコル経由でのクエリ実行を説明します。"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Integrating Apache Kyuubi with Apache Doris as a JDBC data source -->

[Apache Kyuubi](https://kyuubi.apache.org/) は、Lakehouse 上で Serverless SQL を提供する分散型のマルチテナントゲートウェイです。Spark、Flink、Hive、JDBC などのエンジンに接続でき、Thrift や Trino などのインターフェースプロトコルを公開するため、下流のアプリケーションと柔軟に連携できます。Apache Kyuubi には JDBC Engine が実装されており、Doris ダイアレクトに対応しています。これにより、Doris への統一的なアクセスゲートウェイとして利用でき、高可用性、サービスディスカバリ、テナント分離、統一認証、ライフサイクル管理などの機能を提供します。

## ユースケース

- サービスディスカバリと高可用性を備えた、Doris への統一的なアクセスゲートウェイが必要な場合。
- マルチテナント環境でテナント分離と統一認証が必要な場合。
- Thrift プロトコル（HiveServer2 と互換）経由で Doris にアクセスする場合。
- Spark、Flink、Hive などのエンジンと Doris を単一の Lakehouse ゲートウェイに統合する場合。

## 環境要件

| 項目 | 要件 |
| --- | --- |
| Apache Kyuubi のバージョン | 1.6.0 以降 |
| Doris のアクセスポート | FE の MySQL プロトコルポート（デフォルトは `9030`） |
| Kyuubi のリッスンポート | Thrift プロトコルポート（デフォルトは `10009`） |
| 必要なドライバー | MySQL JDBC ドライバー `mysql-connector-j-8.x.x.jar` |

## デプロイ手順

全体の手順は次のとおりです。

1. Apache Kyuubi をダウンロードして展開します。
2. Kyuubi の JDBC データソースとして Doris を設定します。
3. MySQL JDBC ドライバーを追加します。
4. Kyuubi サービスを起動します。

### 1. Apache Kyuubi をダウンロードする

公式サイトから Apache Kyuubi 1.6.0 以降のインストールパッケージをダウンロードし、デプロイ先のディレクトリに展開します。

ダウンロード先: <https://kyuubi.apache.org/releases.html>

### 2. Kyuubi のデータソースとして Doris を設定する

設定ファイル `$KYUUBI_HOME/conf/kyuubi-defaults.conf` を編集し、次の内容を追加します。

```properties
kyuubi.engine.type=jdbc
kyuubi.engine.jdbc.type=doris
kyuubi.engine.jdbc.driver.class=com.mysql.cj.jdbc.Driver
kyuubi.engine.jdbc.connection.url=jdbc:mysql://xxx:xxx
kyuubi.engine.jdbc.connection.user=***
kyuubi.engine.jdbc.connection.password=***
```

設定項目の説明:

| 設定項目 | 説明 |
| --- | --- |
| `kyuubi.engine.type` | エンジンの種類。`jdbc` を指定します。 |
| `kyuubi.engine.jdbc.type` | JDBC サービスの種類。ここでは `doris` を指定します。 |
| `kyuubi.engine.jdbc.driver.class` | JDBC サービスへの接続に使用するドライバーのクラス名。`com.mysql.cj.jdbc.Driver` を指定します。 |
| `kyuubi.engine.jdbc.connection.url` | JDBC サービスの接続 URL。ここには Doris FE の MySQL Server アドレスを指定します。 |
| `kyuubi.engine.jdbc.connection.user` | JDBC サービスのユーザー名。 |
| `kyuubi.engine.jdbc.connection.password` | JDBC サービスのパスワード。 |

関連するその他の設定については、[Apache Kyuubi の設定リファレンス](https://kyuubi.readthedocs.io/en/master/configuration/settings.html)を参照してください。

### 3. MySQL ドライバーを追加する

MySQL JDBC ドライバー `mysql-connector-j-8.x.x.jar` を `$KYUUBI_HOME/externals/engines/jdbc` ディレクトリにコピーします。

### 4. Kyuubi サービスを起動する

次のコマンドを実行して Kyuubi を起動します。

```shell
$KYUUBI_HOME/bin/kyuubi start
```

起動に成功すると、Kyuubi はデフォルトでポート `10009` で待ち受け、Thrift プロトコル経由でアクセスできるようになります。

## 使用例

次の例では、Apache Kyuubi に付属する beeline ツールを使用して、Thrift プロトコル経由で Doris のデータをクエリします。

### 1. 接続を確立する

beeline を使用して Kyuubi サービスに接続します。

```shell
$KYUUBI_HOME/bin/beeline -u "jdbc:hive2://xxxx:10009/"
```

### 2. クエリを実行する

クエリ `select * from demo.example_tbl;` を実行します。想定される出力は次のとおりです。

```shell
0: jdbc:hive2://xxxx:10009/> select * from demo.example_tbl;

2023-03-07 09:29:14.771 INFO org.apache.kyuubi.operation.ExecuteStatement: Processing anonymous's query[bdc59dd0-ceea-4c02-8c3a-23424323f5db]: PENDING_STATE -> RUNNING_STATE, statement:
select * from demo.example_tbl
2023-03-07 09:29:14.786 INFO org.apache.kyuubi.operation.ExecuteStatement: Query[bdc59dd0-ceea-4c02-8c3a-23424323f5db] in FINISHED_STATE
2023-03-07 09:29:14.787 INFO org.apache.kyuubi.operation.ExecuteStatement: Processing anonymous's query[bdc59dd0-ceea-4c02-8c3a-23424323f5db]: RUNNING_STATE -> FINISHED_STATE, time taken: 0.015 seconds
+----------+-------------+-----------+------+------+------------------------+-------+-----------------+-----------------+
| user_id  |    date     |   city    | age  | sex  |    last_visit_date     | cost  | max_dwell_time  | min_dwell_time  |
+----------+-------------+-----------+------+------+------------------------+-------+-----------------+-----------------+
| 10000    | 2017-10-01  | Beijing   | 20   | 0    | 2017-10-01 07:00:00.0  | 70    | 10              | 2               |
| 10001    | 2017-10-01  | Beijing   | 30   | 1    | 2017-10-01 17:05:45.0  | 4     | 22              | 22              |
| 10002    | 2017-10-02  | Shanghai  | 20   | 1    | 2017-10-02 12:59:12.0  | 400   | 5               | 5               |
| 10003    | 2017-10-02  | Guangzhou | 32   | 0    | 2017-10-02 11:20:00.0  | 60    | 11              | 11              |
| 10004    | 2017-10-01  | Shenzhen  | 35   | 0    | 2017-10-01 10:00:15.0  | 200   | 3               | 3               |
| 10004    | 2017-10-03  | Shenzhen  | 35   | 0    | 2017-10-03 10:20:22.0  | 22    | 6               | 6               |
+----------+-------------+-----------+------+------+------------------------+-------+-----------------+-----------------+
6 rows selected (0.068 seconds)
```
