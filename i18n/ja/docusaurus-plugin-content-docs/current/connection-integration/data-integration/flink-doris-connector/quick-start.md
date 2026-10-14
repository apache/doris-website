---
{
    "title": "クイックスタート",
    "language": "ja",
    "description": "Flink クラスターをデプロイし、FlinkSQL と Flink Doris Connector を使用して Doris テーブルのデータを読み書きする手順を説明します。"
}
---

# クイックスタート {#quick-start}

このページでは、Flink クラスターのデプロイから FlinkSQL を使用した Doris データの読み書きまで、一連の手順を例で説明します。始める前に、[バージョンに関する注意事項](./overview.md#version-notes)を参照して Flink と Doris のバージョンに合う Connector のリリースを選び、[インストール](./overview.md#installation)に従って Jar パッケージを入手してください。

## 1. Flink クラスターのデプロイ {#1-deploy-a-flink-cluster}

Standalone クラスターを例に説明します。

1. [Flink 1.18.1](https://archive.apache.org/dist/flink/flink-1.18.1/flink-1.18.1-bin-scala_2.12.tgz) のインストールパッケージをダウンロードします。
2. 展開後、Flink Doris Connector の Jar パッケージを `<FLINK_HOME>/lib` に配置します。
3. `<FLINK_HOME>` ディレクトリに移動し、`bin/start-cluster.sh` を実行して Flink クラスターを起動します。
4. `jps` コマンドで Flink クラスターが正常に起動したことを確認します。

## 2. Doris テーブルの初期化 {#2-initialize-the-doris-table}

次の SQL を実行して Doris テーブルを作成し、テストデータを書き込みます。

```sql
CREATE DATABASE test;

CREATE TABLE test.student (
    `id` INT,
    `name` VARCHAR(256),
    `age` INT
)
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);

INSERT INTO test.student values(1, "James", 18);
INSERT INTO test.student values(2, "Emily", 28);

CREATE TABLE test.student_trans (
    `id` INT,
    `name` VARCHAR(256),
    `age` INT
)
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

## 3. FlinkSQL ジョブの実行 {#3-run-a-flinksql-job}

FlinkSQL クライアントを起動します。

```shell
bin/sql-client.sh
```

次の FlinkSQL を実行します。

```sql
CREATE TABLE Student (
    id STRING,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student',
    'username' = 'root',
    'password' = ''
);

CREATE TABLE StudentTrans (
    id STRING,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student_trans',
    'username' = 'root',
    'password' = '',
    'sink.label-prefix' = 'doris_label'
);

INSERT INTO StudentTrans SELECT id, concat('prefix_', name), age + 1 FROM Student;
```

## 4. 結果の確認 {#4-query-the-result}

```text
mysql> select * from test.student_trans;
+------+--------------+------+
| id   | name         | age  |
+------+--------------+------+
|    1 | prefix_James |   19 |
|    2 | prefix_Emily |   29 |
+------+--------------+------+
2 rows in set (0.02 sec)
```

## 次のステップ {#next-steps}

- [Doris からのデータの読み取り](./read.md)と[Doris へのデータの書き込み](./write.md)：読み取りプロトコル、書き込みモード、およびそれぞれのオプションを説明します。
- [データベース全体の同期](./cdc-sync.md)：単一のコマンドで MySQL などのデータベースを Doris に同期します。
