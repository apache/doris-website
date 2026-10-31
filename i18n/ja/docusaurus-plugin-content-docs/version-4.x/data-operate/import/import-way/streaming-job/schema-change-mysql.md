---
{
    "title": "MySQL Schema Change 同期",
    "language": "ja",
    "sidebar_label": "Schema Change 同期",
    "description": "MySQL CDC 自動テーブル作成同期でサポートされるスキーマ変更と同期動作について説明します。",
    "keywords": [
        "MySQL Schema Change",
        "MySQL CDC",
        "Auto Table Creation Sync",
        "Continuous Load",
        "Streaming Job",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during MySQL Auto Table Creation Sync -->

MySQL Schema Change 同期は、データロード中に上流 MySQL の列変更を Doris に自動的に適用します。この機能は [自動テーブル作成による MySQL CDC](./continuous-load-mysql-database.md) にのみ適用されます。[SQL マッピングによる MySQL CDC](./continuous-load-mysql-table.md) ではサポートされません。

:::tip

MySQL Schema Change 同期は Doris 4.1.4 以降でサポートされます。

:::

## サポートされるスキーマ変更 {#supported-schema-changes}

| MySQL 操作 | Doris の動作 |
| --- | --- |
| `ADD COLUMN` | 同じ名前の列を追加します。型は [MySQL データ型マッピング](./data-type-mapping-mysql.md) で定義されたものを使用し、列コメントをコピーします。DEFAULT と `NOT NULL` の制約はコピーされず、履歴行へのバックフィルも行われません。後続の行では、MySQL が binlog に書き込んだ実際の値が使用されます。 |
| `DROP COLUMN` | 同じ名前の列を削除します。 |

## 考慮事項 {#considerations}

- 追加する列がすでに存在する場合、または削除する列が存在しない場合、Doris は操作をスキップし、再試行でジョブが失敗しないようにします。
- `FIRST` と `AFTER` で指定された列位置は Doris に同期されません。新しい列は既存の Doris 列の後ろに追加されます。
- `CHANGE COLUMN`、`MODIFY COLUMN`、`RENAME COLUMN`、DEFAULT の変更、および `NULL` / `NOT NULL` 制約の変更は自動的に同期されません。これらの操作を実行する前に、継続データロードのジョブを一時停止し、Doris のターゲットテーブルを手動で変更して、両方のスキーマに互換性があることを確認してから、ジョブを再開してください。
- 主キー、インデックス、パーティション、テーブル名、その他のテーブルレベルのスキーマ変更は自動的に同期されません。
- 自動テーブル作成同期では Schema Change Sync がデフォルトで有効です。Doris 4.1 には、これを無効にする SQL プロパティがありません。`cdc_stream()` テーブル関数（SQL マッピング同期）では、Schema Change Sync が内部的に無効になります。

## 関連ドキュメント {#related-docs}

- [自動テーブル作成による MySQL CDC](./continuous-load-mysql-database.md)
- [MySQL データ型マッピング](./data-type-mapping-mysql.md)
- [継続データロードの概要](./continuous-load-overview.md)
