---
{
    "title": "PostgreSQL Schema Change Sync",
    "language": "ja",
    "sidebar_label": "Schema Change Sync",
    "description": "PostgreSQL CDC Auto Table Creation Sync でサポートされるスキーマ変更と同期動作について説明します。",
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

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during PostgreSQL Auto Table Creation Sync -->

PostgreSQL Schema Change Sync は、継続データロード中に上流 PostgreSQL の列変更を Doris に自動的に適用します。この機能は [PostgreSQL CDC with Auto Table Creation](./continuous-load-postgresql-database.md) にのみ適用されます。[PostgreSQL CDC with SQL Mapping](./continuous-load-postgresql-table.md) ではサポートされません。

:::tip

PostgreSQL Schema Change Sync は Doris 4.1.0 以降でサポートされます。

:::

## サポートされるスキーマ変更 {#supported-schema-changes}

| PostgreSQL の操作 | Doris の動作 |
| --- | --- |
| `ADD COLUMN` | 同じ名前の列を追加し、型には [PostgreSQL Data Type Mapping](./data-type-mapping-postgresql.md) で定義された型を使用します。DEFAULT と `NOT NULL` の制約はコピーされず、既存行へのバックフィルも行われません。後続の行には、PostgreSQL が WAL に書き込んだ実際の値が使用されます。 |
| `DROP COLUMN` | 同じ名前の列を削除します。 |

## 考慮事項 {#considerations}

- DDL のみを実行しても、PostgreSQL のスキーマ変更は直ちには反映されません。Doris は、変更されたテーブルが後続の INSERT、UPDATE、または DELETE を受信した後に新しいスキーマを検出して適用します。
- フルスナップショットフェーズでは、自動スキーマ変更同期はサポートされません。上流のスキーマ変更は、フルスナップショットが完了し、ジョブが増分フェーズに入った後に実行してください。
- 追加対象の列がすでに存在する場合、または削除対象の列が存在しない場合、Doris はリトライでジョブが失敗しないよう、その操作をスキップします。
- 同一のスキーマ変更で列の追加と削除が同時に発生した場合、Doris はそれを列名変更の可能性があるものとして扱い、ターゲットテーブルを自動変更しません。これにより、意図しないデータ損失を防ぎます。
- 列名の変更、列型の変更、DEFAULT の変更、および `NULL` / `NOT NULL` 制約の変更は自動的に同期されません。継続データロードジョブを一時停止し、Doris のターゲットテーブルを手動で変更して、両方のスキーマに互換性があることを確認してから、ジョブを再開してください。
- Auto Table Creation Sync では、Schema Change Sync がデフォルトで有効です。Doris には現在、これを無効にする SQL プロパティはありません。`cdc_stream()` テーブル関数（SQL Mapping Sync）では、Schema Change Sync が内部的に無効化されます。

:::caution Behavior change (4.1.4)

バージョン 4.1.4 以降、PostgreSQL のスキーマ変更検出は Relation イベントに基づいて行われます。

- 認識されるのは `ADD COLUMN` と `DROP COLUMN` のみです。
- 列の追加と削除を同時に行う変更（`RENAME` の可能性を含む）はスキップされ、ターゲットテーブルは変更されません。
- 列型の変更はスキップされます。
- 追加された列には、**上流列の `DEFAULT` 値が付与されなくなりました**。
- この機能は Auto Table Creation Sync（at-least-once）パスにのみ適用されます。SQL Mapping（TVF / exactly-once）パスではサポートされません。

:::

## 関連ドキュメント {#related-docs}

- [PostgreSQL CDC with Auto Table Creation](./continuous-load-postgresql-database.md)
- [PostgreSQL Data Type Mapping](./data-type-mapping-postgresql.md)
- [Continuous Load Overview](./continuous-load-overview.md)
