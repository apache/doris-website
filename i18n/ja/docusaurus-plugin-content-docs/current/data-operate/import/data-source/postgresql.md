---
{
    "title": "PostgreSQL",
    "language": "ja",
    "description": "Doris では、JDBC Catalog を使用した単発のデータ取り込み、Streaming Job による継続的な全量・増分同期、Flink Doris Connector による CDC 同期など、複数の方法で PostgreSQL からデータを取り込めます。"
}
---

Doris では、以下の方法で PostgreSQL からデータを取り込めます。

- **JDBC Catalog を使用した PostgreSQL データの取り込み**

Doris は JDBC Catalog を使用して PostgreSQL を外部カタログとして登録し、PostgreSQL のデータを SQL で直接クエリできます。`INSERT INTO` または `CREATE TABLE AS SELECT` と組み合わせることで、一度限りの移行や定期的なバッチ取り込みに利用できます。

- **Streaming Job による PostgreSQL データの継続的な同期**

Doris は Streaming Job を使用して、PostgreSQL から全量データと増分データを継続的に同期します。[Flink CDC](https://github.com/apache/flink-cdc) の読み取り機能を統合し、ジョブを継続実行して PostgreSQL の WAL を読み取り、exactly-once のセマンティクスで Doris テーブルに書き込みます。SQL マッピング同期と自動テーブル作成同期の二つのモードをサポートしています。Doris 4.1.0 以降で利用できます。

- **Flink Doris Connector を使用した PostgreSQL データの取り込み**

Flink Doris Connector と Flink Postgres CDC を組み合わせて、リアルタイムに同期できます。Flink によるストリーム処理を追加する必要がある場合に適しています。コネクタには、データベース全体をワンクリックで同期するツールも用意されています。詳細は [Flink Doris Connector](../../../connection-integration/data-integration/flink-doris-connector/cdc-sync.md) を参照してください。

- **サードパーティーツールを使用した PostgreSQL データの取り込み**

[DataX](../../../connection-integration/data-integration/datax.md)、[SeaTunnel](../../../connection-integration/data-integration/seatunnel.md)、[CloudCanal](../../../connection-integration/data-integration/cloudcanal.md) などのデータ統合ツールも、PostgreSQL から Doris へのデータ同期をサポートしています。

一度限りのデータ移行では、通常 JDBC Catalog を直接利用できます。全量データと増分データの継続的な同期が必要な場合は、Streaming Job を推奨します。

## JDBC Catalog を使用した PostgreSQL データの取り込み

JDBC Catalog を使用して PostgreSQL を外部カタログとして登録し、`INSERT INTO` または `CREATE TABLE AS SELECT` でデータを取り込みます。構文の詳細は [JDBC PostgreSQL Catalog](../../../lakehouse/catalogs/jdbc-pg-catalog.md) を参照してください。

### ステップ 1：PostgreSQL にデータを用意する

```sql
CREATE TABLE public.students (
    id    INT PRIMARY KEY,
    name  VARCHAR(64),
    age   INT
);

INSERT INTO public.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

### ステップ 2：Doris で Catalog を作成する

```sql
CREATE CATALOG pg_catalog PROPERTIES (
    "type"         = "jdbc",
    "user"         = "postgres",
    "password"     = "postgres",
    "jdbc_url"     = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url"   = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver"
);
```

### ステップ 3：Doris に取り込み先テーブルを作成する

```sql
CREATE DATABASE IF NOT EXISTS doris_db;

CREATE TABLE doris_db.students (
    id    INT,
    name  VARCHAR(64),
    age   INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

### ステップ 4：INSERT INTO でデータを取り込む

```sql
INSERT INTO doris_db.students
SELECT id, name, age FROM pg_catalog.postgres.public.students;
```

取り込み先テーブルがまだ存在しない場合は、`CREATE TABLE AS SELECT` を使用して、テーブルの作成とデータの取り込みを一度に行うこともできます。

```sql
CREATE TABLE doris_db.students
PROPERTIES ("replication_num" = "1")
AS
SELECT * FROM pg_catalog.postgres.public.students;
```

### ステップ 5：取り込んだデータを確認する

```sql
SELECT * FROM doris_db.students;
+----+-------+------+
| id | name  | age  |
+----+-------+------+
|  1 | Emily |   25 |
|  2 | Bob   |   30 |
+----+-------+------+
```

## Streaming Job による PostgreSQL データの継続的な同期

Streaming Job は、Flink CDC を介して PostgreSQL の WAL を継続的に読み取り、Doris に書き込みます。次の二つのモードをサポートしています。

- [自動テーブル作成による PostgreSQL CDC](../import-way/streaming-job/continuous-load-postgresql-database.md)：初回の同期時に Doris が同期先テーブルを自動作成します（`include_tables` で単一、複数、またはすべてのテーブルを同期できます）。at-least-once のセマンティクスを提供します。
- [SQL マッピングによる PostgreSQL CDC](../import-way/streaming-job/continuous-load-postgresql-table.md)：Doris に取り込み先テーブルを事前に作成する必要があります。柔軟なカラムマッピング、データ変換、exactly-once のセマンティクスをサポートします。

### 制限事項

1. 主キーを持つテーブル（Unique Key）のみをサポートします。
2. Load 権限が必要です。自動テーブル作成同期で初回実行時に同期先テーブルを自動作成する場合は、Create 権限も必要です。
3. Doris 4.1.0 以降で利用できます。

### 前提条件

Streaming Job を登録する前に、PostgreSQL 側で論理レプリケーション（`wal_level=logical`）を有効にし、ユーザーに対応する REPLICATION 権限を付与する必要があります。環境別の設定手順は、以下を参照してください。

- [Amazon RDS PostgreSQL の設定ガイド](../import-way/streaming-job/prerequisites/amazon-rds-postgresql.md)
- [Amazon Aurora PostgreSQL の設定ガイド](../import-way/streaming-job/prerequisites/amazon-aurora-postgresql.md)
- 各モードの注意事項と必要な権限については、[継続的なデータ取り込みの概要](../import-way/streaming-job/continuous-load-overview.md) を参照してください。

### 操作例：自動テーブル作成同期

自動テーブル作成同期では、`FROM POSTGRES ... TO DATABASE ...` 構文を使用します。同期先は Doris のデータベースで、初回の同期時に同期先テーブルが自動作成されます。

#### ステップ 1：PostgreSQL にデータを用意する

```sql
CREATE TABLE public.students (
    id    INT PRIMARY KEY,
    name  VARCHAR(64),
    age   INT
);

INSERT INTO public.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### ステップ 2：Doris に取り込み先データベースを作成する

自動テーブル作成同期では、**テーブルを事前に作成する必要はありません**。ただし、テーブルの作成先となるデータベースは必要です。

```sql
CREATE DATABASE IF NOT EXISTS doris_db;
```

#### ステップ 3：Streaming Job を作成する

以下の例では、`include_tables` を使用して `students` テーブルだけを同期します。複数のテーブルを指定する場合はコンマで区切り、データベース全体を同期する場合は空にします。

```sql
CREATE JOB pg_db_sync
ON STREAMING
FROM POSTGRES (
    "jdbc_url"       = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url"     = "postgresql-42.5.1.jar",
    "driver_class"   = "org.postgresql.Driver",
    "user"           = "postgres",
    "password"       = "postgres",
    "database"       = "postgres",
    "schema"         = "public",
    "include_tables" = "students",
    "offset"         = "initial"
)
TO DATABASE doris_db (
    "table.create.properties.replication_num" = "1"  -- set to 1 in single-BE deployments
);
```

#### ステップ 4：ジョブの状態を確認する

```sql
SELECT * FROM jobs("type"="insert") WHERE ExecuteType = "STREAMING";
```

#### ステップ 5：自動作成された Doris テーブルと取り込んだデータを確認する

```sql
SHOW TABLES FROM doris_db;
SELECT * FROM doris_db.students;
```

よく使う操作とすべてのパラメーターについては、[自動テーブル作成による PostgreSQL CDC](../import-way/streaming-job/continuous-load-postgresql-database.md) を参照してください。

### 操作例：SQL マッピング同期

#### ステップ 1：PostgreSQL にデータを用意する

```sql
CREATE TABLE public.students (
    id    INT PRIMARY KEY,
    name  VARCHAR(64),
    age   INT
);

INSERT INTO public.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### ステップ 2：Doris に取り込み先テーブルを作成する

SQL マッピング同期では、取り込み先テーブルを事前に作成する必要があります。

```sql
CREATE DATABASE IF NOT EXISTS doris_db;

CREATE TABLE doris_db.students (
    id    INT,
    name  VARCHAR(64),
    age   INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

#### ステップ 3：Streaming Job を作成する

[CREATE STREAMING JOB](../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) を使用し、`INSERT INTO ... SELECT * FROM cdc_stream(...)` 構文を指定します。

```sql
CREATE JOB pg_students_sync
ON STREAMING
DO
INSERT INTO doris_db.students
SELECT * FROM cdc_stream(
    "type"         = "postgres",
    "jdbc_url"     = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url"   = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver",
    "user"         = "postgres",
    "password"     = "postgres",
    "database"     = "postgres",
    "schema"       = "public",
    "table"        = "students",
    "offset"       = "initial"
);
```

#### ステップ 4：ジョブの状態を確認する

```sql
SELECT * FROM jobs("type"="insert") WHERE ExecuteType = "STREAMING";
```

#### ステップ 5：取り込んだデータを確認する

```sql
SELECT * FROM doris_db.students;
```

一時停止、再開、削除、タスクの確認などのよく使う操作とすべてのパラメーターについては、[SQL マッピングによる PostgreSQL CDC](../import-way/streaming-job/continuous-load-postgresql-table.md) を参照してください。
