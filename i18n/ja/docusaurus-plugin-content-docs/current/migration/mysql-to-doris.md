---
{
    "title": "MySQL から Doris への移行",
    "language": "ja",
    "description": "JDBC を使用して MySQL のデータをバッチ移行し、CDC、型マッピング、検証方法を選択します。"
}
---

このガイドでは、MySQL JDBC Catalog を使用して、安定したスナップショットを Doris の内部テーブルにコピーします。一度限り、または定期的なバッチ移行に適しています。移行後の更新、削除、DDL は自動的には反映されません。継続的な同期については、後述の CDC の選択肢を参照してください。

## 前提条件 {#prerequisites}

- `migration_source` という名前の MySQL データベースと、サンプルテーブルに対する SELECT 権限を持つソース側のアカウントが必要です。
- すべての Doris FE/BE からソースに接続できる必要があります。`mysql-connector-j-8.3.0.jar` は、[MySQL Catalog](../lakehouse/catalogs/jdbc-mysql-catalog.md) と[ドライバーの配置](../lakehouse/catalogs/jdbc-catalog-overview.md)の説明に従ってインストールしてください。この例ではドライバーのファイル名を指定するため、すべての FE/BE ノードの `jdbc_drivers_dir` に Jar ファイルが必要です。
- Catalog、データベース、テーブルの作成、外部テーブルの読み取り、ターゲットへのデータロードに必要な権限を持つ Doris アカウントが必要です。[権限設定](../admin-manual/auth/authorization/internal.md)を参照してください。
- ソース側の準備は `migration_source` 内で実行し、空のターゲットテーブルを使用してください。サンプルのホスト、ユーザー名、パスワードは置き換えてください。

## 基本的な使い方 {#basic-usage}

### 1. ソーステーブルを準備する {#1-prepare-the-source-table}

CREATE と INSERT の権限を持つアカウントで、ソースデータベースに次のサンプルを作成します。Catalog の接続には、前述のソース側の読み取り用アカウントを使用します。

```sql
CREATE TABLE migration_demo (
    id BIGINT PRIMARY KEY,
    amount DECIMAL(12,2),
    note VARCHAR(100)
);
INSERT INTO migration_demo VALUES (1, 12.50, 'first'), (2, NULL, NULL);
```

結果: テーブルが作成され、2 行のデータが入ります。

### 2. Doris で Catalog を作成して確認する {#2-create-and-inspect-the-catalog-in-doris}

```sql
CREATE CATALOG migration_mysql PROPERTIES (
    'type' = 'jdbc',
    'user' = 'migration_reader',
    'password' = '<source_password>',
    'jdbc_url' = 'jdbc:mysql://mysql-host:3306/migration_source',
    'driver_url' = 'mysql-connector-j-8.3.0.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);
DESC migration_mysql.migration_source.migration_demo;
```

外部テーブルのスキーマには `id`、`amount`、`note` が含まれるはずです。ターゲットを作成する前に、実際にマッピングされた型を確認してください。

### 3. ターゲットを作成してデータをコピーする {#3-create-the-target-and-copy-the-data}

```sql
CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.mysql_demo (
    id BIGINT NOT NULL,
    amount DECIMAL(12,2),
    note STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.mysql_demo (id, amount, note)
SELECT id, amount, note FROM migration_mysql.migration_source.migration_demo;

SELECT id, amount, note FROM migration_target.mysql_demo ORDER BY id;
```

```text
+------+--------+-------+
| id   | amount | note  |
+------+--------+-------+
|    1 |  12.50 | first |
|    2 |   NULL | NULL  |
+------+--------+-------+
```

この例ではレプリカとバケットをそれぞれ一つにして、ローカル環境で検証しやすくしています。本番環境では、利用可能な BE と信頼性の要件に合わせてテーブルの規模を設定してください。INSERT を繰り返すと、重複する行が追加されます。
## 接続オプション {#connection-options}

| パラメーター | 型 | 必須 / デフォルト | 説明 |
| --- | --- | --- | --- |
| `type` | STRING | 必須、デフォルトなし | `jdbc` を使用します |
| `user` / `password` | STRING | 必須、デフォルトなし | ソースデータベースの認証情報 |
| `jdbc_url` | STRING | 必須、デフォルトなし | データベース名を含むソースの JDBC 接続 URL |
| `driver_url` | STRING | 必須、デフォルトなし | すべての FE/BE からアクセスできる Jar。この例では、事前にインストールしたファイルの名前を使用します |
| `driver_class` | STRING | 必須、デフォルトなし | 選択したドライバーの Java クラス |

接続プール、名前のマッピング、ドライバーの配置場所に関する設定については、[JDBC の完全なリファレンス](../lakehouse/catalogs/jdbc-catalog-overview.md)を参照してください。

## 型とバージョンによる違い {#data-type-mapping}

- 符号なし整数には、より広い型を使用してください。たとえば、`INT UNSIGNED` は `BIGINT` に、`BIGINT UNSIGNED` は `LARGEINT` にマッピングされます。対応する符号付き型をそのままコピーしないでください。
- MySQL JDBC Catalog では、JSON は自動的に `VARIANT` になるのではなく、`STRING` にマッピングされます。`TIME`、`ENUM`、`SET` には Catalog のマッピングを適用してください。JDBC と CDC が必ずしも同じ規則を使うとは限りません。
- `TINYINT(1)` の JDBC メタデータはドライバーの設定によって異なります。すべての TINYINT を Boolean とみなさず、`DESC` で確認してください。
- 4.1 系列では 4.1.5 以降、`TIMESTAMP` に `TIMESTAMPTZ`、バイナリ型に `VARBINARY` が使用されます。`DATETIME` は引き続きタイムゾーンを持たない日時型です。それ以前のバージョンではマッピングと設定が異なります。Dev では現行のマッピングを使用します。
- バッチ INSERT では、主キーの動作、AUTO_INCREMENT、インデックス、ソースの制約はコピーされません。完全な規則については、[MySQL のマッピングに関するリファレンス](../lakehouse/catalogs/jdbc-mysql-catalog.md)を参照してください。

## 継続的な同期 {#continuous-synchronization}

初期スナップショットから継続的な同期に引き継ぎ、その後の更新と削除を反映する必要がある場合は、[Flink CDC による同期](../connection-integration/data-integration/flink-doris-connector/cdc-sync.md)を使用してください。Flink、CDC、Doris Connector の互換性のあるバージョンを Connector のリファレンスに従って選択してください。それぞれに示された最低バージョンを単純に組み合わせないでください。

<version since="dev">

</version>

Dev では[ネイティブ MySQL CDC](../data-operate/import/import-way/streaming-job/continuous-load-mysql-database.md)も利用できます。この自動テーブル作成方式ではソースの主キーが必要で、現在は少なくとも一回の処理を保証するセマンティクスを提供します。ログに関する権限、レプリケーション用のリソース、監視については、そのリファレンスに従ってください。このページの JDBC 型マッピングを適用しないでください。

## 検証とエラー対応 {#validation-and-errors}

同じスナップショットと限定した範囲を対象に、ソースの `migration_mysql.migration_source.migration_demo` とターゲットの `migration_target.mysql_demo` の両方で `COUNT(*)`、`COUNT(amount)`、`SUM(amount)` を実行してください。この例では、それぞれ `2`、`1`、`12.50` が返されるはずです。サンプルの値、NULL、精度、タイムゾーンも詳しく確認してください。検証と切り替えの全体像については、[移行の概要](./overview.md)を参照してください。

接続に失敗した場合は、すべての FE/BE ノードからの接続、ドライバーファイル、ソース側の権限、ドライバーの配置場所に関する制限を確認してください。型に互換性がない場合は、`DESC` で確認して明示的に変換してください。インポートに失敗した後は、再試行する前に、どの範囲が書き込まれたかを確認してください。INSERT 全体を無条件に繰り返さないでください。

## ベストプラクティス {#best-practices}

まず、この小さなテーブルで環境を検証し、その後、大規模な移行を安定したキーまたは時間範囲で分割して実行してください。継続的なレプリケーションには、更新、削除、再実行を処理できるターゲットモデルが必要です。スナップショット用のテーブルと継続的な同期用のテーブルは、それぞれ設計してください。
