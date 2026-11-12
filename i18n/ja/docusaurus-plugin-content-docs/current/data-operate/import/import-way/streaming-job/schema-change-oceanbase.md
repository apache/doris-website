---
{
    "title": "OceanBase Schema Change Sync",
    "language": "ja",
    "sidebar_label": "Schema Change Sync",
    "description": "CDC Auto Table Creation Sync でサポートされる OceanBase のスキーマ変更、Doris による適用方法、およびその制限について説明します。",
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

:::caution 実験的機能

Doris の継続データロードは実験的機能であり、Doris 4.1.5 以降でサポートされます。

:::

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during OceanBase Auto Table Creation Sync -->

OceanBase Schema Change Sync は、継続データロード中に上流の列変更を Doris のターゲットテーブルへ自動的に適用します。この機能は、[Auto Table Creation を使用する OceanBase CDC](./continuous-load-oceanbase-database.md) にのみ適用されます。

OceanBase Schema Change Sync は MySQL 互換モードのみをサポートします。

OceanBase は MySQL CDC のスキーマ変更処理パスを使用するため、サポートされる変更と動作は MySQL と同じです。

## サポートされるスキーマ変更 {#supported-schema-changes}

| OceanBase の操作 | Doris の動作 |
| --- | --- |
| `ADD COLUMN` | 同じ名前の列を追加し、型は [OceanBase データ型マッピング](./data-type-mapping-oceanbase.md) で定義されたものを使用し、列コメントをコピーします。DEFAULT と `NOT NULL` 制約はコピーされず、既存の行へのバックフィルも行われません。後続の行には、OceanBase が binlog に書き込んだ実際の値が使用されます。 |
| `DROP COLUMN` | 同じ名前の列を削除します。 |

## 考慮事項 {#considerations}

- 追加する列がすでに存在する場合、または削除する列が存在しない場合、Doris は操作をスキップして、再試行によってジョブが失敗しないようにします。
- `FIRST` と `AFTER` で指定した列位置は Doris に同期されません。新しい列は既存の Doris 列の後ろに追加されます。
- `CHANGE COLUMN`、`MODIFY COLUMN`、`RENAME COLUMN`、DEFAULT の変更、および `NULL` / `NOT NULL` 制約の変更は自動的には同期されません。
- 主キー、インデックス、パーティション、テーブル名、その他のテーブルレベルのスキーマ変更は自動的には同期されません。
- サポートされていないスキーマ変更の前に、継続データロードジョブを一時停止し、Doris のターゲットテーブルを手動で変更して、両方のスキーマに互換性があることを確認してから、ジョブを再開してください。
- Auto Table Creation Sync では Schema Change Sync がデフォルトで有効になります。現在、Doris にはこれを無効にする SQL プロパティはありません。

## 例 {#example}

OceanBase のソーステーブルに列を追加します。

```sql
ALTER TABLE source_db.users ADD COLUMN city VARCHAR(50);
INSERT INTO source_db.users VALUES (2, 'Alice', 'Hangzhou');
```

ジョブが増分データを処理した後、`city` 列が Doris のターゲットテーブルに表示されます。

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

- [Auto Table Creation を使用する OceanBase CDC](./continuous-load-oceanbase-database.md)
- [OceanBase データ型マッピング](./data-type-mapping-oceanbase.md)
- [継続データロードの概要](./continuous-load-overview.md)
