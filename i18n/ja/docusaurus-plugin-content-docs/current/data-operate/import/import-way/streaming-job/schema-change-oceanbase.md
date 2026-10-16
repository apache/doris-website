---
{
    "title": "OceanBase のスキーマ変更の同期",
    "language": "ja",
    "sidebar_label": "スキーマ変更の同期",
    "description": "CDC の自動テーブル作成同期でサポートされる OceanBase のスキーマ変更、Doris での適用方法、および制限事項について説明します。",
    "keywords": [
        "OceanBase のスキーマ変更",
        "OceanBase CDC",
        "自動テーブル作成同期",
        "継続的なロード",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during OceanBase Auto Table Creation Sync -->

OceanBase のスキーマ変更の同期では、継続的なロード中に上流で行われた列の変更が Doris のターゲットテーブルに自動的に適用されます。この機能は、[自動テーブル作成を伴う OceanBase CDC](./continuous-load-oceanbase-database.md) にのみ適用されます。

:::caution 実験的な機能

OceanBase のスキーマ変更の同期は Doris 4.1.4 以降で実験的な機能として利用でき、MySQL 互換モードのみをサポートします。

:::

OceanBase は MySQL CDC のスキーマ変更処理経路を使用するため、サポートされる変更とその動作は MySQL と同じです。

## サポートされるスキーマ変更 {#supported-schema-changes}

| OceanBase での操作 | Doris での動作 |
| --- | --- |
| `ADD COLUMN` | 同じ名前の列を追加します。列の型は [OceanBase のデータ型マッピング](./data-type-mapping-oceanbase.md) に従って決まり、列のコメントもコピーされます。DEFAULT と `NOT NULL` 制約はコピーされず、既存の行に値が補完されることもありません。その後の行には、OceanBase が binlog に書き込んだ実際の値が使用されます。 |
| `DROP COLUMN` | 同じ名前の列を削除します。 |

## 注意事項 {#considerations}

- 追加する列がすでに存在する場合や、削除する列が存在しない場合、Doris はその操作をスキップします。これにより、再試行時にジョブが失敗することを防ぎます。
- `FIRST` および `AFTER` で指定した列の位置は Doris に同期されません。新しい列は Doris の既存の列の後ろに追加されます。
- `CHANGE COLUMN`、`MODIFY COLUMN`、`RENAME COLUMN`、DEFAULT の変更、`NULL` / `NOT NULL` 制約の変更は自動的には同期されません。
- 主キー、インデックス、パーティション、テーブル名、その他のテーブルレベルのスキーマ変更は自動的には同期されません。
- サポートされないスキーマ変更を行う前に、継続的なロードジョブを一時停止し、Doris のターゲットテーブルを手動で変更してください。両方のスキーマに互換性があることを確認してから、ジョブを再開してください。
- 自動テーブル作成同期では、スキーマ変更の同期がデフォルトで有効になります。現時点で、Doris にはこれを無効にする SQL プロパティはありません。

## 例 {#example}

OceanBase のソーステーブルに列を追加します。

```sql
ALTER TABLE source_db.users ADD COLUMN city VARCHAR(50);
INSERT INTO source_db.users VALUES (2, 'Alice', 'Hangzhou');
```

ジョブが増分データを処理すると、Doris のターゲットテーブルに `city` 列が表示されます。

```sql
DESC target_db.users;
```

```text
+-------+--------------+------+-------+---------+-------+
| Field | Type         | Null | Key   | Default | Extra |
+-------+--------------+------+-------+---------+-------+
| id    | int          | No   | true  | NULL    |       |
| name  | varchar(100) | Yes  | false | NULL    | NONE  |
| city  | varchar(50)  | Yes  | false | NULL    | NONE  |
+-------+--------------+------+-------+---------+-------+
```

## 関連ドキュメント {#related-documents}

- [自動テーブル作成を伴う OceanBase CDC](./continuous-load-oceanbase-database.md)
- [OceanBase のデータ型マッピング](./data-type-mapping-oceanbase.md)
- [継続的なロードの概要](./continuous-load-overview.md)
