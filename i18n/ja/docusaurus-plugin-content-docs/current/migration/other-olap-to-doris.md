---
{
    "title": "その他の OLAP システムから Doris への移行",
    "language": "ja",
    "description": "ClickHouse、Greenplum、データレイクのテーブルについて、移行経路と検証方法を選択します。"
}
---

ClickHouse、Greenplum、データレイクのテーブルは、それぞれに対応する Catalog を通じて Doris にコピーできます。移行先のテーブルモデルを選ぶ前に、スナップショット、更新、集約のセマンティクスを定義してください。移行元のストレージエンジンに、自動的かつ完全に対応する Doris の機能はありません。

## 移行経路と前提条件 {#routes-and-prerequisites}

| 移行元 | 接続とオプションのリファレンス | 移行前の確認事項 |
| --- | --- | --- |
| ClickHouse | [ClickHouse JDBC Catalog](../lakehouse/catalogs/jdbc-clickhouse-catalog.md) | ドライバー、符号なし整数、日時、複合型のマッピング |
| Greenplum | [PostgreSQL JDBC Catalog](../lakehouse/catalogs/jdbc-pg-catalog.md) | 互換性のあるドライバー、実際のメタデータ、分散エクスポートの一貫性 |
| Hive | [Hive Catalog](../lakehouse/catalogs/hive-catalog.mdx) | Metastore、ファイルストレージ、認証、パーティション |
| Iceberg | [Iceberg Catalog](../lakehouse/catalogs/iceberg-catalog.mdx) | メタデータサービス、ストレージの権限、一貫したスナップショット |
| Hudi | [Hudi Catalog](../lakehouse/catalogs/hudi-catalog.md) | テーブルの種類、参照可能なビュー、基になるファイル、クエリの制限 |

すべての FE/BE から、必要なサービス、ドライバー、ストレージにアクセスできる必要があります。該当するリファレンスに従って Catalog を設定し、外部テーブルの読み取りと移行先の作成・データロードを許可された Doris アカウントを使用してください。

## ClickHouse {#clickhouse}

JDBC Catalog を使用し、`INSERT INTO ... SELECT` では列を明示的に指定してください。まず `DESC` を実行します。推奨される移行先の設計が、実際の JDBC マッピングを示しているとは限りません。たとえば、Catalog は ClickHouse の `FixedString` が CHAR に直接マッピングされることを保証していません。Map/Tuple などの複合型がサポートされるかどうかは、実際に使用するドライバーと Doris のバージョンで検証してください。

`ReplacingMergeTree`、`CollapsingMergeTree`、集約状態を保持するテーブルについては、最終的に参照可能な行、バージョン列、削除マーカー、マージ規則を確認してください。Doris の Unique Key テーブルは、移行元エンジンのセマンティクスをすべて自動的に再現するわけではありません。NULL、最大値や最小値が同じ場合、配列の展開、JSON 文字列の抽出に関する SQL の違いも検証してください。

## Greenplum {#greenplum}

[PostgreSQL の移行](./postgresql-to-doris.md)に記載されたバッチ処理の手順に従い、実際の Greenplum のマッピングを確認してください。並列エクスポートと SQL バッチでは、移行元の一貫したビューを共有する必要があります。並行処理だけでは、テーブル間で一貫したスナップショットは確保できません。

## データレイク {#data-lake}

それぞれに対応する Hive、Iceberg、Hudi の Catalog を使用してください。Iceberg では、移行中に使用するスナップショットを固定します。Hudi では、どのビューを読み取るか、導入済みのバージョンがどの種類のテーブルをサポートするかを確認してください。Catalog を作成すると外部データにアクセスできるようになりますが、Doris 内にコピーが作成されるわけではありません。

## 基本的な使い方 {#basic-usage}

`source_catalog` が前述のとおりに設定され、`analytics.migration_demo` に `id BIGINT` と `value DECIMAL(12,2)` が含まれ、移行元のスナップショットが固定されているとします。`DESC` でこれらの型を確認してから、Doris で次を実行します。

```sql
CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.olap_demo (
    id BIGINT,
    `value` DECIMAL(12,2)
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.olap_demo (id, `value`)
SELECT id, `value` FROM source_catalog.analytics.migration_demo;

SELECT COUNT(*), SUM(`value`) FROM source_catalog.analytics.migration_demo;
SELECT COUNT(*), SUM(`value`) FROM migration_target.olap_demo;
```

期待される結果は、空の移行先テーブルに移行元スナップショットから選択した両方の列のデータが格納され、検証用の両クエリで行数と合計値が一致することです。レプリカとバケットをそれぞれ単一にした設定は例示用です。本番環境では、リソースと信頼性の要件に応じてテーブルの規模を設定してください。入力を固定した完全な例については、[MySQL](./mysql-to-doris.md) または [PostgreSQL](./postgresql-to-doris.md) を参照してください。

## その他のデータロード方法 {#other-loading-methods}

直接接続できない場合は、サポートされる形式のファイルをエクスポートし、[S3 Load](../data-operate/import/data-source/amazon-s3.md) または [Broker Load](../data-operate/import/import-way/broker-load-manual.md) を使用してください。データロードの規模を拡大する前に、ファイル形式、エンコーディング、NULL の表現、精度、タイムゾーンを確認してください。

[Spark Connector](../connection-integration/data-integration/spark-doris-connector.md) または [Flink Connector](../connection-integration/data-integration/flink-doris-connector/overview.md) も使用できます。バッチ処理とストリーミング処理の機能、互換性のあるバージョン、セマンティクスについては、各 Connector のリファレンスに従ってください。

## エラーとベストプラクティス {#errors-and-best-practices}

バッチサイズや並行処理数を増やす前に、範囲を限定したサンプルで検証してください。サポートされない型は列を省略せずに明示的に変換し、精度が失われないか確認してください。Duplicate Key の移行先に対して INSERT を繰り返すと、重複行が追加されます。再開する前に、処理済みの範囲を確認してください。切り替え前に[移行の概要](./overview.md)に記載されたシステム間の検証を完了し、移行元のデータとロールバック手段を保持してください。
