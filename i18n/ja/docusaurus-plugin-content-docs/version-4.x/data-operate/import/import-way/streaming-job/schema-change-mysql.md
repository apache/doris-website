---
{
    "title": "MySQL スキーマ変更の同期",
    "language": "ja",
    "sidebar_label": "スキーマ変更の同期",
    "description": "MySQL CDC のテーブル自動作成同期でサポートされるスキーマ変更と、その同期動作について説明します。",
    "keywords": [
        "MySQL スキーマ変更",
        "MySQL CDC",
        "テーブル自動作成同期",
        "継続ロード",
        "ストリーミングジョブ",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during MySQL Auto Table Creation Sync -->

MySQL スキーマ変更の同期では、継続ロード中に上流の MySQL で行われたカラム変更を Doris に自動的に適用します。この機能は [テーブル自動作成を使用する MySQL CDC](./continuous-load-mysql-database.md) にのみ適用されます。[SQL マッピングを使用する MySQL CDC](./continuous-load-mysql-table.md) ではサポートされません。

:::tip

MySQL スキーマ変更の同期は Doris 4.1.4 以降でサポートされます。

:::

## サポートされるスキーマ変更

| MySQL の操作 | Doris の動作 |
| --- | --- |
| `ADD COLUMN` | 同じ名前のカラムを追加し、[MySQL データ型マッピング](./data-type-mapping-mysql.md) に従って型を設定するとともに、カラムのコメントをコピーします。DEFAULT と `NOT NULL` 制約はコピーされず、既存の行には値が埋め戻されません。それ以降の行には、MySQL が binlog に書き込んだ実際の値が使用されます。 |
| `DROP COLUMN` | 同じ名前のカラムを削除します。 |

## 注意事項

- 追加するカラムがすでに存在する場合、または削除するカラムが存在しない場合、Doris はその操作をスキップします。これにより、再試行によってジョブが失敗することを防ぎます。
- `FIRST` と `AFTER` で指定したカラムの位置は Doris に同期されません。新しいカラムは Doris の既存のカラムの後ろに追加されます。
- `CHANGE COLUMN`、`MODIFY COLUMN`、`RENAME COLUMN`、DEFAULT の変更、および `NULL` / `NOT NULL` 制約の変更は自動的には同期されません。これらの操作を行う前に継続ロードジョブを一時停止し、Doris の対象テーブルを手動で変更してください。その後、両方のスキーマに互換性があることを確認してからジョブを再開してください。
- 主キー、インデックス、パーティション、テーブル名、およびその他のテーブルレベルのスキーマ変更は自動的には同期されません。
- テーブル自動作成同期では、スキーマ変更の同期がデフォルトで有効です。Doris 4.1 にはこれを無効にする SQL プロパティがありません。`cdc_stream()` テーブル関数（SQL マッピング同期）では、内部的にスキーマ変更の同期が無効になっています。

## 関連ドキュメント

- [テーブル自動作成を使用する MySQL CDC](./continuous-load-mysql-database.md)
- [MySQL データ型マッピング](./data-type-mapping-mysql.md)
- [継続ロードの概要](./continuous-load-overview.md)
