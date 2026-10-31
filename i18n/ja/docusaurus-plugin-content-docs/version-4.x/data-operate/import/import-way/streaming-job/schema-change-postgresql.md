---
{
    "title": "PostgreSQL スキーマ変更同期",
    "language": "ja",
    "sidebar_label": "スキーマ変更同期",
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

PostgreSQL スキーマ変更同期は、継続的データロード中に、上流 PostgreSQL の列変更を Doris に自動適用します。この機能は [Auto Table Creation を使用する PostgreSQL CDC](./continuous-load-postgresql-database.md) にのみ適用されます。[SQL Mapping を使用する PostgreSQL CDC](./continuous-load-postgresql-table.md) ではサポートされません。

:::tip

PostgreSQL スキーマ変更同期は Doris 4.1.0 以降でサポートされます。

:::

## サポートされるスキーマ変更 {#supported-schema-changes}

| PostgreSQL 操作 | Doris の動作 |
| --- | --- |
| `ADD COLUMN` | 同じ名前の列を、[PostgreSQL データ型マッピング](./data-type-mapping-postgresql.md) で定義された型で追加します。DEFAULT と `NOT NULL` の制約はコピーされず、履歴行へのバックフィルも行われません。後続の行では、PostgreSQL が WAL に書き込んだ実際の値が使用されます。 |
| `DROP COLUMN` | 同じ名前の列を削除します。 |

## 考慮事項 {#considerations}

- DDL のみを実行した場合、PostgreSQL のスキーマ変更は直ちには反映されません。Doris は、変更されたテーブルが後続の INSERT、UPDATE、または DELETE を受信した後に新しいスキーマを検出して適用します。
- フルスナップショットフェーズ中は、自動スキーマ変更同期はサポートされません。フルスナップショットが完了し、ジョブが増分フェーズに入った後で上流スキーマを変更してください。
- 追加された列がすでに存在する場合、または削除対象の列が存在しない場合、再試行でジョブが失敗しないよう、Doris はその操作をスキップします。
- 同じスキーマ変更で列の追加と削除が同時に行われる場合、Doris はそれを列の名前変更の可能性として扱い、ターゲットテーブルを自動的には変更しません。これにより、意図しないデータ損失を防ぎます。
- 列名の変更、列型の変更、DEFAULT の変更、および `NULL` / `NOT NULL` 制約の変更は自動同期されません。継続的データロードジョブを一時停止し、Doris のターゲットテーブルを手動で変更して、両方のスキーマに互換性があることを確認してから、ジョブを再開してください。
- Auto Table Creation Sync では、Schema Change Sync がデフォルトで有効になります。Doris 4.1 では、これを無効にする SQL プロパティは提供されていません。`cdc_stream()` テーブル関数（SQL Mapping Sync）では、Schema Change Sync が内部的に無効になります。

:::caution 動作変更 (4.1.4)

4.1.4 以降、PostgreSQL のスキーマ変更検出は Relation イベントによって駆動されます：

- 認識されるのは `ADD COLUMN` と `DROP COLUMN` のみです。
- 列の追加と削除を同時に行う変更（`RENAME` の可能性があります）はスキップされ、ターゲットテーブルは変更されません。
- 列型の変更はスキップされます。
- 追加された列には、**上流列の `DEFAULT` 値が引き継がれなくなりました**。
- この機能は Auto Table Creation Sync（at-least-once）パスにのみ適用されます。SQL Mapping（TVF / exactly-once）パスではサポートされません。

:::

## 関連ドキュメント {#related-docs}

- [Auto Table Creation を使用する PostgreSQL CDC](./continuous-load-postgresql-database.md)
- [PostgreSQL データ型マッピング](./data-type-mapping-postgresql.md)
- [継続的データロードの概要](./continuous-load-overview.md)
