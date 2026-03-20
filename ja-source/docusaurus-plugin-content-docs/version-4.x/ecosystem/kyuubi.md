---
{
  "title": "九尾",
  "language": "ja",
  "description": "Apache Kyuubiは、データウェアハウスおよびレイクハウス上でサーバーレスSQLを提供する分散型マルチテナントゲートウェイです。"
}
---
# DorisでKyuubiを使用する

## はじめに

[Apache Kyuubi](https://kyuubi.apache.org/)は、データウェアハウスやレイクハウス上でサーバーレスSQLを提供する分散・マルチテナントゲートウェイです。
Apache KyuubiはThrift、Trino、MySQLなどの多様なプロトコルを、Spark、Flink、Hive、JDBCなどのエンジンに提供しています。
DorisはApache KyuubiでサポートされているDoris dialectを使用して、JDBCデータソースとして接続できます。
Apache Kyuubiは、HA、サービスディスカバリー、統合認証、エンジンライフサイクル管理など、一連の有用な機能も提供します。

## 使用方法

### Apache Kyuubiのダウンロード

<https://kyuubi.apache.org/zh/releases.html>からApache Kyuubiをダウンロードしてください

Apache Kyuubi 1.6.0以上を取得し、フォルダに展開してください。

### KyuubiデータソースとしてのDorisの設定

- `$KYUUBI_HOME/conf/kyuubi-defaults.conf`でKyuubi設定を更新してください

```properties
kyuubi.engine.type=jdbc
kyuubi.engine.jdbc.type=doris
kyuubi.engine.jdbc.driver.class=com.mysql.cj.jdbc.Driver
kyuubi.engine.jdbc.connection.url=jdbc:mysql://xxx:xxx
kyuubi.engine.jdbc.connection.user=***
kyuubi.engine.jdbc.connection.password=***
```
| Configuration                          | Description                                                   |
|----------------------------------------|---------------------------------------------------------------|
| kyuubi.engine.type                     | Engine Type、`jdbc` を指定                                |
| kyuubi.engine.jdbc.type                | JDBC サービスタイプ、`doris` を指定                         |
| kyuubi.engine.jdbc.driver.class        | JDBC ドライバークラス名、`com.mysql.cj.jdbc.Driver` を指定 |
| kyuubi.engine.jdbc.connection.url      | Doris FE への JDBC url                                          |
| kyuubi.engine.jdbc.connection.user     | JDBC ユーザー名                                                 |
| kyuubi.engine.jdbc.connection.password | JDBC パスワード                                                 |

- Apache Kyuubi のその他の設定については、[Apache Kyuubi Configuration Docs](https://kyuubi.readthedocs.io/en/master/configuration/settings.html) を参照してください。

### MySQL JDBC Driver の追加

MySQL JDBC Driver `mysql-connector-j-8.X.X.jar` を `$KYUUBI_HOME/externals/engines/jdbc` にコピーします。

### Kyuubi Server の開始

`$KYUUBI_HOME/bin/kyuubi start` を実行します。
開始後、デフォルトでポート 10009 が Kyuubi Server によって Thrift プロトコルで待機されます。

## 例

以下の例は、Thrift プロトコルで beeline CLI を使用して Kyuubi で Doris をクエリする基本的な例を示しています。

### Beeline で Kyuubi に接続

```shell
$ $KYUUBI_HOME/bin/beeline -u "jdbc:hive2://xxxx:10009/"
```
### Kyuubiでクエリを実行

クエリステートメント`select * from demo.expamle_tbl;`を実行し、クエリ結果を返します。

```shell
0: jdbc:hive2://xxxx:10009/> select * from demo.example_tbl;  
  
2023-03-07 09:29:14.771 INFO org.apache.kyuubi.operation.ExecuteStatement: Processing anonymous's query[bdc59dd0-ceea-4c02-8c3a-23424323f5db]: PENDING_STATE -> RUNNING_STATE, statement:  
select * from demo.example_tbl  
2023-03-07 09:29:14.786 INFO org.apache.kyuubi.operation.ExecuteStatement: Query[bdc59dd0-ceea-4c02-8c3a-23424323f5db] in FINISHED_STATE  
2023-03-07 09:29:14.787 INFO org.apache.kyuubi.operation.ExecuteStatement: Processing anonymous's query[bdc59dd0-ceea-4c02-8c3a-23424323f5db]: RUNNING_STATE -> FINISHED_STATE, time taken: 0.015 seconds  
+----------+-------------+-------+------+------+------------------------+-------+-----------------+-----------------+  
| user_id  |    date     | city  | age  | sex  |    last_visit_date     | cost  | max_dwell_time  | min_dwell_time  |  
+----------+-------------+-------+------+------+------------------------+-------+-----------------+-----------------+  
| 10000    | 2017-10-01  | Beijing | 20   | 0    | 2017-10-01 07:00:00.0  | 70    | 10              | 2               |  
| 10001    | 2017-10-01  | Beijing | 30   | 1    | 2017-10-01 17:05:45.0  | 4     | 22              | 22              |  
| 10002    | 2017-10-02  | Shanghai| 20   | 1    | 2017-10-02 12:59:12.0  | 400   | 5               | 5               |  
| 10003    | 2017-10-02  | Guangzhou| 32   | 0    | 2017-10-02 11:20:00.0  | 60    | 11              | 11              |  
| 10004    | 2017-10-01  | Shenzhen| 35   | 0    | 2017-10-01 10:00:15.0  | 200   | 3               | 3               |  
| 10004    | 2017-10-03  | Shenzhen| 35   | 0    | 2017-10-03 10:20:22.0  | 22    | 6               | 6               |  
+----------+-------------+-------+------+------+------------------------+-------+-----------------+-----------------+  
6 rows selected (0.068 seconds)

```
