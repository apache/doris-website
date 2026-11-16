---
{
    "title": "PostgreSQL から Doris への移行",
    "language": "ja",
    "description": "JDBC を使用して PostgreSQL のデータをバッチ移行し、CDC、型マッピング、検証方法を選択します。"
}
---

このガイドでは、PostgreSQL JDBC Catalog を使用して、安定したスナップショットを Doris の内部テーブルにコピーします。一度限り、または定期的なバッチ移行に適していますが、その後の更新、削除、DDL は自動的には反映されません。継続的な同期については、後述の CDC の選択肢を参照してください。

## 前提条件 {#prerequisites}

- `migration_source` という名前の PostgreSQL データベースと、サンプルテーブルに対する SELECT 権限を持つ移行元アカウント。
- すべての Doris FE/BE から移行元への接続。[PostgreSQL Catalog](../lakehouse/catalogs/jdbc-pg-catalog.md) と [ドライバーのデプロイ](../lakehouse/catalogs/jdbc-catalog-overview.md) の説明に従い、`postgresql-42.5.6.jar` をインストールしてください。この例ではドライバーのファイル名を指定するため、すべての FE/BE ノードの `jdbc_drivers_dir` に Jar が必要です。
- Catalog、データベース、テーブルを作成し、外部テーブルを読み取り、移行先へデータロードする権限を持つ Doris アカウント。[権限の設定](../admin-manual/auth/authorization/internal.md)を参照してください。
- 移行元のセットアップは `migration_source` 内で実行し、移行先には空のテーブルを使用してください。サンプルのホスト名、ユーザー名、パスワードは置き換えてください。

## 基本的な使い方 {#basic-usage}

### 1. 移行元テーブルを準備する {#1-prepare-the-source-table}

CREATE 権限と INSERT 権限を持つアカウントを使用して、移行元データベースに次のサンプルを作成します。Catalog からの接続には、前述の読み取り用アカウントを使用します。

```sql
CREATE TABLE public.migration_demo (
    id BIGINT PRIMARY KEY,
    amount DECIMAL(12,2),
    note VARCHAR(100)
);
INSERT INTO public.migration_demo VALUES (1, 12.50, 'first'), (2, NULL, NULL);
```

結果: テーブルが作成され、2 行のデータが入ります。

### 2. Doris で Catalog を作成して確認する {#2-create-and-inspect-the-catalog-in-doris}

```sql
CREATE CATALOG migration_pg PROPERTIES (
    'type' = 'jdbc',
    'user' = 'migration_reader',
    'password' = '<source_password>',
    'jdbc_url' = 'jdbc:postgresql://pg-host:5432/migration_source',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);
DESC migration_pg.public.migration_demo;
```

外部テーブルのスキーマには `id`、`amount`、`note` が含まれるはずです。移行先テーブルを作成する前に、実際にマッピングされた型を確認してください。

### 3. 移行先テーブルを作成してデータをコピーする {#3-create-the-target-and-copy-the-data}

```sql
CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.pg_demo (
    id BIGINT NOT NULL,
    amount DECIMAL(12,2),
    note STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.pg_demo (id, amount, note)
SELECT id, amount, note FROM migration_pg.public.migration_demo;

SELECT id, amount, note FROM migration_target.pg_demo ORDER BY id;
```

```text
+------+--------+-------+
| id   | amount | note  |
+------+--------+-------+
|    1 |  12.50 | first |
|    2 |   NULL | NULL  |
+------+--------+-------+
```

この例では、ローカル環境で検証しやすいよう、レプリカとバケットをそれぞれ単一にしています。本番環境では、利用可能な BE と信頼性の要件に合わせてテーブルを設計してください。INSERT を繰り返すと、重複する行が追加されます。
## 接続オプション {#connection-options}

| パラメーター | 型 | 必須 / デフォルト | 説明 |
| --- | --- | --- | --- |
| `type` | STRING | 必須、デフォルトなし | `jdbc` を使用 |
| `user` / `password` | STRING | 必須、デフォルトなし | 移行元データベースの認証情報 |
| `jdbc_url` | STRING | 必須、デフォルトなし | データベース名を含む、移行元への JDBC 接続 URL |
| `driver_url` | STRING | 必須、デフォルトなし | すべての FE/BE からアクセスできる Jar。この例では、事前にインストールしたファイルの名前を使用 |
| `driver_class` | STRING | 必須、デフォルトなし | 選択したドライバーの Java クラス |

接続プール、名前のマッピング、ドライバーの配置場所に関する設定については、[JDBC の完全なリファレンス](../lakehouse/catalogs/jdbc-catalog-overview.md)を参照してください。

## 型とバージョンによる違い {#data-type-mapping}

- JDBC では、PostgreSQL の `json/jsonb` は `STRING` にマッピングされ、`VARIANT` には自動的に変換されません。移行先で別の型を使用する場合は、明示的に変換して検証してください。
- この Catalog では、PostgreSQL の `time`、`timetz`、`interval` を文字列型にマッピングします。これは、Doris に TIME 型がないという意味ではありません。
- 使用可能な精度が指定されていない、またはサポートされる decimal の範囲外にある `numeric` は、`STRING` にマッピングされる場合があります。数値計算の前に外部テーブルの型を確認してください。
- 4.1 系列では 4.1.5 以降、`timestamptz` は `TIMESTAMPTZ` に、`bytea` は `VARBINARY` にマッピングされます。それより前のバージョンでは、マッピングと設定が異なります。Dev では現在のマッピングが使用されます。タイムゾーン、精度、バイナリデータがバイト単位で一致することを確認してください。
- 配列の次元を推定するには移行元のデータが必要で、使用可能なデータがない場合は未サポートの型と報告されることがあります。各列を [PostgreSQL のマッピングリファレンス](../lakehouse/catalogs/jdbc-pg-catalog.md)と照らして検証してください。

## 継続的な同期 {#continuous-synchronization}

初期スナップショットから引き継いで、その後の更新や削除も反映する必要がある場合は、[Flink CDC による同期](../connection-integration/data-integration/flink-doris-connector/cdc-sync.md)を使用してください。Flink、CDC、Doris Connector のバージョンは、それぞれの最低バージョン要件を組み合わせて判断せず、Connector のリファレンスに記載された互換性に基づいて選択してください。

<version since="dev">

</version>

Dev では[ネイティブ PostgreSQL CDC](../data-operate/import/import-way/streaming-job/continuous-load-postgresql-database.md)も提供されています。このテーブル自動作成方式では移行元の主キーが必要で、現在は少なくとも一度のセマンティクスを提供します。ログに関する権限、レプリケーションリソース、監視についてはリンク先を参照し、このページの JDBC の型マッピングを適用しないでください。

## 検証とエラー {#validation-and-errors}

同じスナップショットと範囲を対象に、移行元の `migration_pg.public.migration_demo` と移行先の `migration_target.pg_demo` で `COUNT(*)`、`COUNT(amount)`、`SUM(amount)` を実行してください。この例では、結果はそれぞれ `2`、`1`、`12.50` になるはずです。サンプルの値、NULL、精度、タイムゾーンも確認してください。移行全体の検証と切り替えについては、[移行の概要](./overview.md)を参照してください。

接続に失敗した場合は、すべての FE/BE ノードからの接続、ドライバーファイル、移行元の権限、ドライバーの配置場所に関する制限を確認してください。型に互換性がない場合は `DESC` で確認し、明示的に変換してください。データの取り込みに失敗した後は、再試行する前に書き込み済みの範囲を特定してください。INSERT 全体を無条件に繰り返さないでください。

## ベストプラクティス {#best-practices}

まず、この小さなテーブルで環境を検証し、その後、安定したキーまたは時間範囲に基づいて大規模な移行をバッチに分けて実行してください。継続的なレプリケーションには、更新、削除、再実行に対応できる移行先のテーブルモデルが必要です。スナップショット用テーブルと継続的に同期するテーブルは、それぞれ設計してください。
