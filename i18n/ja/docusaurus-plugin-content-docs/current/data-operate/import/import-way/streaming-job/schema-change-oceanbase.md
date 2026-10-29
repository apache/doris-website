---
{
    "title": "OceanBase Schema Change 同期",
    "language": "ja",
    "sidebar_label": "Schema Change 同期",
    "description": "CDC 自動テーブル作成同期でサポートされる OceanBase のスキーマ変更、Doris での適用方法、および制限事項について説明します。",
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

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during OceanBase Auto Table Creation Sync -->

OceanBase Schema Change Sync は、継続データロード中に上流の列変更を Doris のターゲットテーブルへ自動的に適用します。この機能は [Auto Table Creation を使用した OceanBase CDC](./continuous-load-oceanbase-database.md) にのみ適用されます。

:::caution 実験的機能

OceanBase Schema Change Sync は Doris 4.1.4 以降で実験的機能として利用でき、MySQL 互換モードのみをサポートします。

:::

OceanBase は MySQL CDC のスキーマ変更処理パスを使用するため、サポートされる変更と動作は MySQL と同じです。

## サポートされるスキーマ変更 {#supported-schema-changes}

| OceanBase の操作 | Doris の動作 |
| --- | --- |
| `ADD COLUMN` | 同じ名前の列を追加し、型には [OceanBase データ型マッピング](./data-type-mapping-oceanbase.md) で定義された型を使用して、列コメントをコピーします。DEFAULT と `NOT NULL` の制約はコピーされず、履歴行へのバックフィルも行われません。以降の行では、OceanBase が binlog に書き込んだ実際の値が使用されます。 |
| `DROP COLUMN` | 同じ名前の列を削除します。 |

## 考慮事項 {#considerations}

- 追加対象の列がすでに存在するか、削除対象の列が存在しない場合、Doris はジョブの再試行が失敗しないよう、その操作をスキップします。
- `FIRST` と `AFTER` で指定した列位置は Doris に同期されません。新しい列は既存の Doris 列の後ろに追加されます。
- `CHANGE COLUMN`、`MODIFY COLUMN`、`RENAME COLUMN`、DEFAULT の変更、および `NULL` / `NOT NULL` 制約の変更は自動的に同期されません。
- 主キー、インデックス、パーティション、テーブル名、その他のテーブルレベルのスキーマ変更は自動的に同期されません。
- サポートされていないスキーマ変更を行う前に、継続データロードのジョブを一時停止し、Doris のターゲットテーブルを手動で変更して、両方のスキーマに互換性があることを確認してから、ジョブを再開してください。
- Auto Table Creation Sync では Schema Change Sync がデフォルトで有効になります。現在の Doris には、これを無効にする SQL プロパティはありません。

## 例 {#example}

OceanBase ソーステーブルに列を追加します：

```sql
ALTER TABLE source_db.users ADD COLUMN city VARCHAR(50);
INSERT INTO source_db.users VALUES (2, 'Alice', 'Hangzhou');
```

ジョブが増分データを処理すると、`city` 列が Doris のターゲットテーブルに表示されます：

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

- [Auto Table Creation を使用した OceanBase CDC](./continuous-load-oceanbase-database.md)
- [OceanBase データ型マッピング](./data-type-mapping-oceanbase.md)
- [継続データロードの概要](./continuous-load-overview.md)
