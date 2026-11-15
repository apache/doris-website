---
{
    "title": "Elasticsearch から Doris への移行",
    "language": "ja",
    "description": "ES Catalog を通じてインデックスをコピーし、フィールド、ドキュメント ID、検索セマンティクスを検証します。"
}
---

ES Catalog を使用して Elasticsearch のインデックスをクエリし、`INSERT INTO ... SELECT` で選択したカラムを Doris の内部テーブルにコピーします。この例は小規模な一度限りの移行であり、その後の更新や削除は継続的に反映されません。検索ワークロードについては、アナライザー、スコアリング、ネストされたオブジェクト、クエリのセマンティクスも個別に検証する必要があります。

## 前提条件 {#prerequisites}

この例では、Elasticsearch 7.x または 8.x のタイプレスマッピング API を使用します。ほかのソースバージョンではインデックスの設定を調整し、Catalog の対応バージョンを確認してください。

- アクセス可能な Elasticsearch クラスターと、サンプルインデックスの作成、書き込み、読み取りができるアカウント。本番環境の移行用アカウントには Catalog のメタデータに対する権限も必要です。詳しくは [ES Catalog](../lakehouse/catalogs/es-catalog.md) を参照してください。
- すべての Doris FE/BE から ES への接続、および Catalog、データベース、テーブルの作成、外部テーブルの読み取り、移行先へのデータロードが許可された Doris アカウント。
- 空の移行先テーブル。接続先アドレスと認証情報は実際の値に置き換えてください。単一レプリカと単一バケットは、例を簡潔にするためだけに使用しています。

## 基本的な使い方 {#basic-usage}

### 1. 移行元のインデックスを準備する {#1-prepare-the-source-index}

Elasticsearch Dev Tools または同等の HTTP クライアントで実行します。

```http
PUT /migration_demo
{
  "mappings": {
    "properties": {
      "title": { "type": "keyword" }
    }
  }
}

PUT /migration_demo/_doc/one?refresh=true
{ "title": "first" }

PUT /migration_demo/_doc/two?refresh=true
{ "title": "second" }
```

期待される結果: インデックスには、ID が `one` と `two` の検索可能なドキュメントが二件含まれます。

### 2. Catalog を作成してドキュメント ID を保持する {#2-create-the-catalog-and-preserve-document-ids}

```sql
CREATE CATALOG migration_es PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://es-host:9200',
    'user' = '<es_user>',
    'password' = '<es_password>',
    'mapping_es_id' = 'true'
);
DESC migration_es.default_db.migration_demo;

CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.es_demo (
    doc_id VARCHAR(512),
    title STRING
)
DUPLICATE KEY(doc_id)
DISTRIBUTED BY HASH(doc_id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.es_demo (doc_id, title)
SELECT _id, title FROM migration_es.default_db.migration_demo;

SELECT doc_id, title FROM migration_target.es_demo ORDER BY doc_id;
```

```text
+--------+--------+
| doc_id | title  |
+--------+--------+
| one    | first  |
| two    | second |
+--------+--------+
```

## オプション一覧 {#options-reference}

| パラメーター | 型 | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| `hosts` | STRING | はい | なし | すべての FE/BE から到達可能な ES の HTTP アドレス |
| `user` / `password` | STRING | ES の認証方式による | 空 | Basic 認証を有効にしている場合の認証情報 |
| `mapping_es_id` | boolean | いいえ | `false` | ドキュメントの `_id` を公開する。この例では有効 |
| `enable_docvalue_scan` | boolean | いいえ | `true` | 対応するフィールドで doc values による読み取りを試みる |
| `nodes_discovery` | boolean | いいえ | `true` | ノードを検出する。隔離されたネットワークでは無効化が必要な場合がある |

すべてのパラメーター、認証、配列のアノテーションについては、[ES Catalog](../lakehouse/catalogs/es-catalog.md) を参照してください。

## 型と検索セマンティクス {#types-and-search-semantics}

- ES Catalog は `object` と `nested` を JSON にマッピングします。VARIANT には自動的にマッピングされません。異なる移行先の型を使用する前に、明示的に変換してテストしてください。
- ES のフィールドにはスカラー値と配列の両方が含まれる場合があります。ドキュメントに従って `_meta.doris.array_fields` を設定し、`DESC` と実際のサンプルを確認してください。一件のドキュメントだけからカラム全体を推測しないでください。
- 日付の形式、タイムゾーン、数値の範囲、欠損フィールドを検証してください。解析対象の `text` フィールドは、完全一致に使用する `keyword` フィールドとは異なります。
- Doris の[転置インデックス](../table-design/index/inverted-index/overview.md) は全文検索に対応していますが、ES DSL、スコアリング、ネストされたクエリ、アナライザーが自動的に同等になるわけではありません。構文を機械的に置き換えるだけでなく、実際のクエリ結果をテストしてください。

## 検証とエラー {#validation-and-errors}

移行元への書き込みがない時間帯に、ドキュメント数と重複を除いた `_id` の数を比較してください。この例では、どちらも 2 になるはずです。元の `_source` のサンプルと移行先のカラムを比較し、欠損値、JSON 配列、日付も確認してください。

メタデータのエラーが発生した場合は、インデックスの読み取り、クラスター状態、ノードの HTTP に関する権限を確認してください。ページングに失敗した場合は、移行元ノードへの接続とノード検出の設定を確認してください。移行中にインデックスが変更されると、整合性に影響する場合があります。安定したスナップショットを用意するか、書き込みを停止する時間帯を明確に定めてください。INSERT を繰り返すと行が追加されるため、再開する前にインポート済みの範囲を特定してください。

## ベストプラクティス {#best-practices}

バッチ処理に拡大する前に、フィールドの読み取りと検索セマンティクスを検証してください。継続的なミラーリングには、ドキュメント ID に基づく更新、削除、順序制御、再実行を別途設計する必要があります。Catalog は CDC タスクではありません。切り替えの指針については、[移行の概要](./overview.md) を参照してください。
