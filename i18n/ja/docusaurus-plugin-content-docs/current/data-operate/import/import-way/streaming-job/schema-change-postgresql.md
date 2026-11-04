---
{
    "title": "PostgreSQL スキーマ変更同期",
    "language": "ja",
    "sidebar_label": "スキーマ変更同期",
    "description": "継続データロード中に PostgreSQL CDC Auto Table Creation Sync でサポートされるスキーマ変更と同期動作について説明します。",
    "keywords": [
        "PostgreSQL Schema Change",
        "PostgreSQL CDC",
        "Auto Table Creation Sync",
        "Continuous Load",
        "Streaming Job",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

:::caution 実験的機能

Doris の継続データロードは実験的機能であり、Doris 4.1.5 以降でサポートされます。

:::

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during PostgreSQL Auto Table Creation Sync -->

PostgreSQL Schema Change Sync は、継続データロード中に上流 PostgreSQL の列変更を Doris に自動的に適用します。この機能は [自動テーブル作成を使用した PostgreSQL CDC](./continuous-load-postgresql-database.md) にのみ適用されます。[SQL マッピングを使用した PostgreSQL CDC](./continuous-load-postgresql-table.md) ではサポートされません。

## サポートされるスキーマ変更 {#supported-schema-changes}

| PostgreSQL 操作 | Doris の動作 |
| --- | --- |
| `ADD COLUMN` | 同じ名前の列を追加し、型には [PostgreSQL データ型マッピング](./data-type-mapping-postgresql.md) で定義されたものを使用します。DEFAULT と `NOT NULL` の制約はコピーされず、履歴行へのバックフィルも行われません。後続の行には、PostgreSQL が WAL に書き込んだ実際の値が使用されます。 |
| `DROP COLUMN` | 同じ名前の列を削除します。 |

## 考慮事項 {#considerations}

- DDL のみを実行した場合、PostgreSQL のスキーマ変更はすぐには伝播しません。Doris は、変更されたテーブルが後続の INSERT、UPDATE、または DELETE を受け取った後に新しいスキーマを検出して適用します。
- フルスナップショットフェーズ中の自動スキーマ変更同期はサポートされません。上流のスキーマ変更は、フルスナップショットが完了してジョブが増分フェーズに入った後に行ってください。
- 追加対象の列がすでに存在する場合、または削除対象の列が存在しない場合、Doris は再試行でジョブが失敗しないようにその操作をスキップします。
- 一つのスキーマ変更で列の追加と削除が同時に行われる場合、Doris はそれを列名の変更の可能性として扱い、ターゲットテーブルを自動的に変更しません。これにより、意図しないデータ損失を防ぎます。
- 列名の変更、列の型の変更、DEFAULT の変更、`NULL` / `NOT NULL` 制約の変更は自動同期されません。継続データロードジョブを一時停止し、Doris のターゲットテーブルを手動で変更し、両方のスキーマに互換性があることを確認してから、ジョブを再開してください。
- Auto Table Creation Sync は、デフォルトで Schema Change Sync を有効にします。現在、Doris にはこれを無効にする SQL プロパティが用意されていません。`cdc_stream()` テーブル関数（SQL Mapping Sync）は、内部的に Schema Change Sync を無効にします。

:::caution スキーマ変更の動作

PostgreSQL のスキーマ変更検出は Relation イベントによって行われます。

- `ADD COLUMN` と `DROP COLUMN` のみが認識されます。
- 列の追加と削除を同時に行う変更（`RENAME` の可能性があります）はスキップされ、ターゲットテーブルは変更されません。
- 列の型の変更はスキップされます。
- 追加された列には、**上流列の `DEFAULT` 値は引き継がれません**。
- この機能は Auto Table Creation Sync（at-least-once）パスにのみ適用されます。SQL Mapping（TVF / exactly-once）パスではサポートされません。

:::

## 関連ドキュメント {#related-docs}

- [自動テーブル作成を使用した PostgreSQL CDC](./continuous-load-postgresql-database.md)
- [PostgreSQL データ型マッピング](./data-type-mapping-postgresql.md)
- [継続データロードの概要](./continuous-load-overview.md)
