---
{
    "title": "OceanBase の Schema Change 同期",
    "language": "ja",
    "sidebar_label": "Schema Change 同期",
    "description": "OceanBase CDC による自動テーブル作成同期でサポートされるスキーマ変更、Doris での適用方法、および制限事項について説明します。",
    "keywords": [
        "OceanBase Schema Change",
        "OceanBase CDC",
        "Auto Table Creation Sync",
        "continuous load",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

:::caution 実験的な機能

Doris の継続的なデータロードは実験的な機能であり、Doris 4.1.5 以降でサポートされます。

:::

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during OceanBase Auto Table Creation Sync -->

OceanBase の Schema Change 同期は、継続的なデータロード中に、上流の列変更を Doris のターゲットテーブルに自動的に適用します。この機能は、[OceanBase CDC による自動テーブル作成](./continuous-load-oceanbase-database.md)にのみ適用されます。

OceanBase の Schema Change 同期は、MySQL 互換モードでのみサポートされます。

OceanBase は MySQL CDC のスキーマ変更処理経路を使用するため、サポートされる変更とその動作は MySQL と同じです。

## サポートされるスキーマ変更 {#supported-schema-changes}

| OceanBase の操作 | Doris の動作 |
| --- | --- |
| `ADD COLUMN` | 同じ名前の列を、[OceanBase のデータ型マッピング](./data-type-mapping-oceanbase.md)で定義された型で追加し、列のコメントをコピーします。DEFAULT と `NOT NULL` の制約はコピーされず、既存の行に値は補完されません。それ以降の行では、OceanBase が binlog に書き込んだ実際の値が使用されます。 |
| `DROP COLUMN` | 同じ名前の列を削除します。 |

## 注意事項 {#considerations}

- 追加する列がすでに存在する場合、または削除する列が存在しない場合、Doris はその操作をスキップします。これにより、再試行時にジョブが失敗することを防ぎます。
- `FIRST` と `AFTER` で指定した列の位置は Doris に同期されません。新しい列は、Doris の既存の列の後に追加されます。
- `CHANGE COLUMN`、`MODIFY COLUMN`、`RENAME COLUMN`、DEFAULT の変更、および `NULL` / `NOT NULL` 制約の変更は、自動的には同期されません。
- 主キー、インデックス、パーティション、テーブル名、およびその他のテーブルレベルのスキーマ変更は、自動的には同期されません。
- サポートされていないスキーマ変更を行う前に、継続的なデータロードのジョブを一時停止し、Doris のターゲットテーブルを手動で変更してください。両方のスキーマに互換性があることを確認してから、ジョブを再開してください。
- 自動テーブル作成同期では、Schema Change 同期がデフォルトで有効です。現在、Doris にはこれを無効にする SQL プロパティはありません。

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

- [OceanBase CDC による自動テーブル作成](./continuous-load-oceanbase-database.md)
- [OceanBase のデータ型マッピング](./data-type-mapping-oceanbase.md)
- [継続的なデータロードの概要](./continuous-load-overview.md)
