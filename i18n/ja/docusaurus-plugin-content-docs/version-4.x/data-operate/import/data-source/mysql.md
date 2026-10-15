---
{
    "title": "MySQL",
    "language": "ja",
    "description": "Doris では、JDBC Catalog による単発のロード、Streaming Job による全量・増分データの継続的な同期、Flink Doris Connector による CDC 同期など、複数の方法で MySQL からデータをロードできます。"
}
---

Doris では、次の方法で MySQL からデータをロードできます。

- **JDBC Catalog を使用した MySQL データのロード**

Doris は JDBC Catalog を使用して MySQL を外部カタログとしてマッピングし、MySQL データを SQL で直接クエリできるようにします。`INSERT INTO` または `CREATE TABLE AS SELECT` と組み合わせることで、一度限りの移行や定期的なバッチロードに適しています。

- **Streaming Job を使用した MySQL データの継続的な同期**

Doris は Streaming Job を使用して、MySQL から Doris へ全量データと増分データを継続的に同期します。[Flink CDC](https://github.com/apache/flink-cdc) の読み取り機能を統合することで、Doris はジョブを実行し続け、MySQL の Binlog を読み取って Doris テーブルに exactly-once セマンティクスで書き込みます。SQL マッピングによる同期と自動テーブル作成による同期の二つのモードをサポートします。Doris 4.1.0 以降で利用できます。

- **Flink Doris Connector を使用した MySQL データのロード**

Flink Doris Connector と Flink MySQL CDC を組み合わせて、リアルタイムに同期します。Flink による追加のストリーム処理ロジックが必要な場合に適しています。このコネクタには、データベース全体をワンクリックで同期するツールも用意されています。詳細は [Flink Doris Connector](../../../connection-integration/data-integration/flink-doris-connector.md) を参照してください。

- **サードパーティーツールを使用した MySQL データのロード**

[DataX](../../../connection-integration/data-integration/datax.md)、[SeaTunnel](../../../connection-integration/data-integration/seatunnel.md)、[CloudCanal](../../../connection-integration/data-integration/cloudcanal.md) などのデータ統合ツールも、MySQL から Doris へのデータ同期をサポートします。

多くの場合、一度限りのデータ移行には JDBC Catalog を直接使用できます。全量データと増分データの継続的な同期が必要な場合は、Streaming Job を推奨します。

## JDBC Catalog を使用した MySQL データのロード

JDBC Catalog を使用して MySQL を外部カタログとしてマッピングし、`INSERT INTO` または `CREATE TABLE AS SELECT` でデータをロードします。構文の詳細は [JDBC MySQL Catalog](../../../lakehouse/catalogs/jdbc-mysql-catalog.md) を参照してください。

### ステップ 1: MySQL にデータを用意する

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

### ステップ 2: Doris に Catalog を作成する

```sql
CREATE CATALOG mysql_catalog PROPERTIES (
    "type"         = "jdbc",
    "user"         = "root",
    "password"     = "123456",
    "jdbc_url"     = "jdbc:mysql://127.0.0.1:3306/test",
    "driver_url"   = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver"
);
```

### ステップ 3: Doris にターゲットテーブルを作成する

```sql
CREATE DATABASE IF NOT EXISTS doris_db;

CREATE TABLE doris_db.students (
    id     INT,
    name   VARCHAR(64),
    age    INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

### ステップ 4: INSERT INTO でデータをロードする

```sql
INSERT INTO doris_db.students
SELECT id, name, age FROM mysql_catalog.test.students;
```

ターゲットテーブルがまだ存在しない場合は、`CREATE TABLE AS SELECT` を使用して、テーブルの作成とデータのロードを一つのステップで行うこともできます。

```sql
CREATE TABLE doris_db.students
PROPERTIES ("replication_num" = "1")
AS
SELECT * FROM mysql_catalog.test.students;
```

### ステップ 5: ロードしたデータを確認する

```sql
SELECT * FROM doris_db.students;
+----+-------+------+
| id | name  | age  |
+----+-------+------+
|  1 | Emily |   25 |
|  2 | Bob   |   30 |
+----+-------+------+
```

## Streaming Job を使用した MySQL データの継続的な同期

Streaming Job は Flink CDC を介して MySQL の Binlog を継続的に読み取り、Doris に書き込みます。次の二つのモードをサポートします。

- [自動テーブル作成による MySQL CDC](../import-way/streaming-job/continuous-load-mysql-database.md): 初回同期時に Doris が同期先のテーブルを自動作成します（`include_tables` を使用して一つ、複数、またはすべてのテーブルを同期できます）。at-least-once セマンティクスを提供します。
- [SQL マッピングによる MySQL CDC](../import-way/streaming-job/continuous-load-mysql-table.md): Doris にターゲットテーブルを事前に作成する必要があります。柔軟なカラムマッピング、データ変換、および exactly-once セマンティクスをサポートします。

### 制限事項

1. 主キーテーブル（Unique Key）のみをサポートします。
2. Load 権限が必要です。自動テーブル作成による同期では、初回実行時に同期先のテーブルを自動作成するため、Create 権限も必要です。
3. Doris 4.1.0 以降で利用できます。

### 前提条件

Streaming Job を送信する前に、MySQL 側で Binlog を有効にし、ユーザーに対応する REPLICATION 権限を付与する必要があります。環境ごとのセットアップ手順については、次を参照してください。

- [Amazon RDS MySQL のセットアップガイド](../import-way/streaming-job/prerequisites/amazon-rds-mysql.md)
- [Amazon Aurora MySQL のセットアップガイド](../import-way/streaming-job/prerequisites/amazon-aurora-mysql.md)
- 各モードの注意事項と必要な権限については、[継続的なロードの概要](../import-way/streaming-job/continuous-load-overview.md) を参照してください。

### 操作例: 自動テーブル作成による同期

自動テーブル作成による同期では、`FROM MYSQL ... TO DATABASE ...` 構文を使用します。同期先は Doris のデータベースであり、初回同期時に同期先のテーブルが自動的に作成されます。

#### ステップ 1: MySQL にデータを用意する

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### ステップ 2: Doris にターゲットデータベースを作成する

自動テーブル作成による同期では、**テーブルを事前に作成する必要はありません**。ただし、テーブルの作成先となるデータベースは存在している必要があります。

```sql
CREATE DATABASE IF NOT EXISTS doris_db;
```

#### ステップ 3: Streaming Job を作成する

次の例では、`include_tables` を使用して `students` テーブルのみを同期します（複数のテーブルはカンマで区切り、空にするとデータベース全体を同期します）。

```sql
CREATE JOB mysql_db_sync
ON STREAMING
FROM MYSQL (
    "jdbc_url"       = "jdbc:mysql://127.0.0.1:3306",
    "driver_url"     = "mysql-connector-java-8.0.25.jar",
    "driver_class"   = "com.mysql.cj.jdbc.Driver",
    "user"           = "root",
    "password"       = "123456",
    "database"       = "test",
    "include_tables" = "students",
    "offset"         = "initial"
)
TO DATABASE doris_db (
    "table.create.properties.replication_num" = "1"  -- set to 1 in single-BE deployments
);
```

#### ステップ 4: ジョブの状態を確認する

```sql
SELECT * FROM jobs("type"="insert") WHERE ExecuteType = "STREAMING";
```

#### ステップ 5: 自動作成された Doris テーブルとロードしたデータを確認する

```sql
SHOW TABLES FROM doris_db;
SELECT * FROM doris_db.students;
```

よく使うその他の操作とパラメーターの一覧については、[自動テーブル作成による MySQL CDC](../import-way/streaming-job/continuous-load-mysql-database.md) を参照してください。

### 操作例: SQL マッピングによる同期

#### ステップ 1: MySQL にデータを用意する

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### ステップ 2: Doris にターゲットテーブルを作成する

SQL マッピングによる同期では、ターゲットテーブルを事前に作成する必要があります。

```sql
CREATE DATABASE IF NOT EXISTS doris_db;

CREATE TABLE doris_db.students (
    id     INT,
    name   VARCHAR(64),
    age    INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

#### ステップ 3: Streaming Job を作成する

[CREATE STREAMING JOB](../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) と `INSERT INTO ... SELECT * FROM cdc_stream(...)` 構文を使用します。

```sql
CREATE JOB mysql_students_sync
ON STREAMING
DO
INSERT INTO doris_db.students
SELECT * FROM cdc_stream(
    "type"         = "mysql",
    "jdbc_url"     = "jdbc:mysql://127.0.0.1:3306",
    "driver_url"   = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user"         = "root",
    "password"     = "123456",
    "database"     = "test",
    "table"        = "students",
    "offset"       = "initial"
);
```

#### ステップ 4: ジョブの状態を確認する

```sql
SELECT * FROM jobs("type"="insert") WHERE ExecuteType = "STREAMING";
```

#### ステップ 5: ロードしたデータを確認する

```sql
SELECT * FROM doris_db.students;
```

よく使うその他の操作（一時停止、再開、削除、タスクの確認など）とパラメーターの一覧については、[SQL マッピングによる MySQL CDC](../import-way/streaming-job/continuous-load-mysql-table.md) を参照してください。
