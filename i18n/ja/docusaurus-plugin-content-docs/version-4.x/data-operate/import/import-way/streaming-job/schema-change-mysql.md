---
{
    "title": "MySQL スキーマ変更の同期",
    "language": "ja",
    "sidebar_label": "スキーマ変更の同期",
    "description": "MySQL CDC の自動テーブル作成同期でサポートされるスキーマ変更と同期動作について説明します。",
    "keywords": [
        "MySQL スキーマ変更",
        "MySQL CDC",
        "自動テーブル作成同期",
        "継続的データロード",
        "Streaming Job",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

:::caution 試験的機能

Doris の継続的データロードは試験的機能であり、Doris 4.1.5 以降でサポートされます。

:::

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during MySQL Auto Table Creation Sync -->

MySQL スキーマ変更の同期では、継続的データロード中に、上流の MySQL で行われたカラムの変更を Doris に自動的に反映します。この機能は [MySQL CDC の自動テーブル作成](./continuous-load-mysql-database.md) にのみ適用されます。[MySQL CDC の SQL マッピング](./continuous-load-mysql-table.md) ではサポートされません。

## サポートされるスキーマ変更 {#supported-schema-changes}

| MySQL の操作 | Doris の動作 |
| --- | --- |
| `ADD COLUMN` | 同じ名前のカラムを追加します。型には [MySQL データ型マッピング](./data-type-mapping-mysql.md) で定義された型を使用し、カラムのコメントもコピーします。DEFAULT と `NOT NULL` の制約はコピーされず、既存の行にも値は遡って補完されません。その後の行には、MySQL が binlog に書き込んだ実際の値が使用されます。 |
| `DROP COLUMN` | 同じ名前のカラムを削除します。 |

## 注意事項 {#considerations}

- 追加するカラムがすでに存在する場合や、削除するカラムが存在しない場合、Doris はその操作をスキップします。これにより、再試行時にジョブが失敗するのを防ぎます。
- `FIRST` と `AFTER` で指定したカラムの位置は Doris に同期されません。新しいカラムは、Doris の既存カラムの後ろに追加されます。
- `CHANGE COLUMN`、`MODIFY COLUMN`、`RENAME COLUMN`、DEFAULT の変更、`NULL` / `NOT NULL` 制約の変更は自動的に同期されません。これらの操作を行う前に、継続的データロードのジョブを一時停止し、Doris の対象テーブルを手動で変更して、両方のスキーマに互換性があることを確認してから、ジョブを再開してください。
- 主キー、インデックス、パーティション、テーブル名、その他のテーブルレベルのスキーマ変更は自動的に同期されません。
- 自動テーブル作成同期では、スキーマ変更の同期がデフォルトで有効になります。Doris 4.1 には、これを無効にする SQL プロパティはありません。`cdc_stream()` テーブル関数（SQL マッピング同期）では、内部的にスキーマ変更の同期が無効になります。

## 関連ドキュメント {#related-docs}

- [MySQL CDC の自動テーブル作成](./continuous-load-mysql-database.md)
- [MySQL データ型マッピング](./data-type-mapping-mysql.md)
- [継続的データロードの概要](./continuous-load-overview.md)
