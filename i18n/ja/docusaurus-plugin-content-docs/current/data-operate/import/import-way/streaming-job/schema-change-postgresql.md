---
{
    "title": "PostgreSQL スキーマ変更の同期",
    "language": "ja",
    "sidebar_label": "スキーマ変更の同期",
    "description": "PostgreSQL CDC のテーブル自動作成による同期でサポートされるスキーマ変更と、その同期時の動作を説明します。",
    "keywords": [
        "PostgreSQL のスキーマ変更",
        "PostgreSQL CDC",
        "テーブル自動作成による同期",
        "継続ロード",
        "ストリーミングジョブ",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during PostgreSQL Auto Table Creation Sync -->

PostgreSQL スキーマ変更の同期は、継続ロード中に上流の PostgreSQL で行われたカラム変更を Doris に自動的に反映します。この機能は [PostgreSQL CDC のテーブル自動作成による同期](./continuous-load-postgresql-database.md) にのみ適用されます。[PostgreSQL CDC の SQL マッピングによる同期](./continuous-load-postgresql-table.md) ではサポートされません。

:::tip

PostgreSQL スキーマ変更の同期は Doris 4.1.0 以降でサポートされます。

:::

## サポートされるスキーマ変更

| PostgreSQL の操作 | Doris の動作 |
| --- | --- |
| `ADD COLUMN` | 同じ名前のカラムを追加します。型は [PostgreSQL データ型のマッピング](./data-type-mapping-postgresql.md) に従います。DEFAULT と `NOT NULL` 制約は引き継がれず、既存の行にも値は補完されません。以降の行には、PostgreSQL が WAL に書き込んだ実際の値が使われます。 |
| `DROP COLUMN` | 同じ名前のカラムを削除します。 |

## 注意事項

- PostgreSQL で DDL を実行しただけでは、スキーマ変更はすぐには反映されません。変更したテーブルでその後に INSERT、UPDATE、または DELETE が行われると、Doris が新しいスキーマを検出して適用します。
- 全量スナップショットフェーズでは、スキーマ変更の自動同期はサポートされません。上流のスキーマ変更は、全量スナップショットが完了し、ジョブが増分フェーズに入ってから行ってください。
- 追加するカラムが既に存在する場合や、削除するカラムが存在しない場合、Doris はその操作をスキップします。これにより、再試行時にジョブが失敗するのを防ぎます。
- 一度のスキーマ変更でカラムの追加と削除が同時に行われた場合、Doris はカラム名の変更の可能性があるとみなし、ターゲットテーブルを自動的には変更しません。これにより、意図しないデータ損失を防ぎます。
- カラム名の変更、カラム型の変更、DEFAULT の変更、および `NULL` / `NOT NULL` 制約の変更は、自動的には同期されません。継続ロードジョブを一時停止し、Doris のターゲットテーブルを手動で変更してください。両方のスキーマに互換性があることを確認してから、ジョブを再開してください。
- テーブル自動作成による同期では、スキーマ変更の同期がデフォルトで有効です。現在、Doris にはこれを無効にする SQL プロパティはありません。`cdc_stream()` テーブル関数（SQL マッピングによる同期）では、内部的にスキーマ変更の同期が無効になります。

:::caution 動作の変更（4.1.4）

バージョン 4.1.4 以降、PostgreSQL のスキーマ変更は Relation イベントに基づいて検出されます。

- 認識されるのは `ADD COLUMN` と `DROP COLUMN` のみです。
- カラムの追加と削除が同時に行われる変更（`RENAME` の可能性がある変更）はスキップされ、ターゲットテーブルは変更されません。
- カラム型の変更はスキップされます。
- 追加されたカラムには、上流カラムの `DEFAULT` 値が**引き継がれなくなりました**。
- この機能は、テーブル自動作成による同期（at-least-once）の経路にのみ適用されます。SQL マッピング（TVF / exactly-once）の経路ではサポートされません。

:::

## 関連ドキュメント

- [PostgreSQL CDC のテーブル自動作成による同期](./continuous-load-postgresql-database.md)
- [PostgreSQL データ型のマッピング](./data-type-mapping-postgresql.md)
- [継続ロードの概要](./continuous-load-overview.md)
