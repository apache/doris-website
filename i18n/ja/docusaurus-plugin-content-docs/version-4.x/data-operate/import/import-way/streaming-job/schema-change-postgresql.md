---
{
    "title": "PostgreSQL のスキーマ変更の同期",
    "language": "ja",
    "sidebar_label": "スキーマ変更の同期",
    "description": "PostgreSQL CDC の自動テーブル作成による同期でサポートされるスキーマ変更と、その同期動作について説明します。",
    "keywords": [
        "PostgreSQL のスキーマ変更",
        "PostgreSQL CDC",
        "自動テーブル作成による同期",
        "継続的なデータロード",
        "Streaming Job",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

:::caution 実験的機能

Doris の継続的なデータロードは実験的機能であり、Doris 4.1.5 以降でサポートされます。

:::

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during PostgreSQL Auto Table Creation Sync -->

PostgreSQL のスキーマ変更の同期では、継続的なデータロード中に、上流の PostgreSQL テーブルの列変更が Doris に自動的に適用されます。この機能は [PostgreSQL CDC の自動テーブル作成](./continuous-load-postgresql-database.md) にのみ適用されます。[PostgreSQL CDC の SQL マッピング](./continuous-load-postgresql-table.md) ではサポートされません。

## サポートされるスキーマ変更 {#supported-schema-changes}

| PostgreSQL の操作 | Doris の動作 |
| --- | --- |
| `ADD COLUMN` | 同じ名前の列を、[PostgreSQL のデータ型マッピング](./data-type-mapping-postgresql.md) に従った型で追加します。DEFAULT と `NOT NULL` 制約はコピーされず、既存の行に値は補完されません。その後の行には、PostgreSQL が WAL に書き込んだ実際の値が使用されます。 |
| `DROP COLUMN` | 同じ名前の列を削除します。 |

## 注意事項 {#considerations}

- PostgreSQL で DDL を実行しただけでは、スキーマ変更はすぐには反映されません。変更されたテーブルにその後の INSERT、UPDATE、または DELETE が発生すると、Doris が新しいスキーマを検出して適用します。
- フルスナップショットフェーズでは、スキーマ変更の自動同期はサポートされません。上流のスキーマ変更は、フルスナップショットが完了し、ジョブが増分フェーズに入ってから行ってください。
- 追加する列がすでに存在する場合、または削除する列が存在しない場合、Doris はその操作をスキップします。これにより、再試行時にジョブが失敗することを防ぎます。
- 同じスキーマ変更で列の追加と削除が同時に行われた場合、Doris は列名の変更の可能性があると判断し、対象テーブルを自動的には変更しません。これにより、意図しないデータ損失を防ぎます。
- 列名の変更、列の型の変更、DEFAULT の変更、および `NULL` / `NOT NULL` 制約の変更は、自動的には同期されません。継続的なデータロードジョブを一時停止し、Doris の対象テーブルを手動で変更して、両方のスキーマに互換性があることを確認してから、ジョブを再開してください。
- 自動テーブル作成による同期では、スキーマ変更の同期がデフォルトで有効です。Doris 4.1 には、これを無効にする SQL プロパティはありません。`cdc_stream()` テーブル関数を使用する SQL マッピングによる同期では、内部的にスキーマ変更の同期が無効になります。

:::caution スキーマ変更時の動作

PostgreSQL のスキーマ変更は、Relation イベントによって検出されます。

- 認識されるのは `ADD COLUMN` と `DROP COLUMN` のみです。
- 列の追加と削除が同時に行われる変更（`RENAME` の可能性がある変更）はスキップされ、対象テーブルは変更されません。
- 列の型の変更はスキップされます。
- 追加された列には、**上流の列の `DEFAULT` 値は引き継がれません**。
- この機能は、自動テーブル作成による同期の経路（at-least-once）にのみ適用されます。SQL マッピングの経路（TVF / exactly-once）ではサポートされません。

:::

## 関連ドキュメント {#related-docs}

- [PostgreSQL CDC の自動テーブル作成](./continuous-load-postgresql-database.md)
- [PostgreSQL のデータ型マッピング](./data-type-mapping-postgresql.md)
- [継続的なデータロードの概要](./continuous-load-overview.md)
