---
{
    "title": "TRUNCATE 操作",
    "language": "ja",
    "description": "Doris の TRUNCATE でテーブルやパーティションのデータをすばやく消去する方法を説明します。構文、パラメータ、利用シナリオ、使用上の制約、データの復元、DELETE との違いを扱います。",
    "keywords": [
        "Doris TRUNCATE",
        "テーブルデータの消去",
        "パーティションデータの消去",
        "TRUNCATE TABLE",
        "TRUNCATE PARTITION",
        "FORCE による消去",
        "RECOVER によるデータ復元"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Data cleanup / Test environment reset / Partition data rebuild -->

`TRUNCATE` は、指定したテーブルまたはパーティションの全データを一度に消去し、テーブル構造とパーティション定義は残します。`DELETE` と異なり、削除バージョンが生成されず、後続のクエリ性能にも影響しません。そのため、大量のデータを消去する場合に適しています。

## クイックナビゲーション {#quick-navigation}

- [TRUNCATE を選ぶ場面](#when-to-choose-truncate): 主な利用シナリオ
- [構文とパラメータ](#syntax-and-parameters): コマンドの形式
- [使用例](#usage-examples): 一般的な操作例
- [使用上の制約](#usage-constraints): 実行前に確認すべき制約
- [データの復元](#data-recovery): 誤操作からの復元方法
- [TRUNCATE と DELETE の比較](#truncate-vs-delete): 使い分け
- [よくある質問](#faq): よくある質問と回答

## TRUNCATE を選ぶ場面 {#when-to-choose-truncate}

`TRUNCATE` は、大量のデータを一度に消去する必要がある場合に適しています。

- **テスト環境のリセット**: テストデータを消去し、再インポートに備えます。
- **パーティションデータの再構築**: 指定したパーティションを消去してから、修正済みのデータを書き込みます。
- **大量のデータの消去**: `DELETE` と異なり、バージョンが蓄積せず、クエリ性能にも影響しません。
- **履歴データのアーカイブ後の消去**: アーカイブ完了後、元のテーブルまたはパーティションを消去します。

## 構文とパラメータ {#syntax-and-parameters}

### コマンド形式 {#command-format}

```sql
TRUNCATE TABLE [db.]tbl [PARTITION(p1, p2, ...)] [FORCE];
```

### パラメータの説明 {#parameter-description}

| パラメータ      | 必須 | 説明 |
| --------------- | ---- | ---- |
| `db.`           | いいえ | データベース名。省略すると現在のデータベースを使用します。 |
| `tbl`           | はい | データを消去するテーブルの名前。 |
| `PARTITION(..)` | いいえ | パーティション名の一覧を指定します。指定したパーティションだけを消去します。省略するとテーブル全体を消去します。 |
| `FORCE`         | いいえ | データを直接物理削除します。**RECOVER では復元できません。** 慎重に使用してください。 |

## 使用例 {#usage-examples}

### 1. テーブル全体を消去する {#1-clear-an-entire-table}

`tbl` テーブル（`example_db` 内）の全データを消去します。

```sql
TRUNCATE TABLE example_db.tbl;
```

### 2. 指定したパーティションを消去する {#2-clear-specified-partitions}

`p1` と `p2` の各パーティション（`tbl` テーブル内）だけを消去します。

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```

### 3. 強制的に消去する（復元不可） {#3-force-clear-non-recoverable}

ごみ箱を経由せず、`example_db.tbl` のデータを直接物理削除します。

```sql
TRUNCATE TABLE example_db.tbl FORCE;
```

:::caution
`FORCE` を使用すると、`RECOVER` ではデータを復元できません。実行前に確認してください。
:::

## 使用上の制約 {#usage-constraints}

`TRUNCATE` を実行する前に、次の点を確認してください。

- **データだけを消去し、構造は残す**: テーブル構造とパーティション定義は残り、データだけが消去されます。
- **フィルター条件は指定できない**: テーブル全体または指定したパーティションだけを消去できます。`WHERE` 条件は追加できません。
- **テーブルの状態が NORMAL であること**: `SCHEMA CHANGE` の実行中は、そのテーブルのデータを消去できません。
- **進行中のインポートに影響する**: 実行中のインポートタスクが失敗する場合があります。インポートがない時間帯に実行してください。
- **デフォルトでは復元可能**: `FORCE` を使用しなければ、保持期間内に [RECOVER](../../sql-manual/sql-statements/recycle/RECOVER) でデータを復元できます。

## データの復元 {#data-recovery}

`TRUNCATE` を `FORCE` なしで実行した場合、消去したデータはごみ箱に入り、保持期間内であれば復元できます。

```sql
RECOVER TABLE [db_name.]table_name;
```

詳しくは、[RECOVER ステートメントの説明](../../sql-manual/sql-statements/recycle/RECOVER)を参照してください。

:::tip
ごみ箱の保持期間は、FE の設定項目 `catalog_trash_expire_second` で制御します。期限を過ぎたデータは完全に削除されます。
:::

## TRUNCATE と DELETE の比較 {#truncate-vs-delete}

どちらもデータの削除に使用できますが、適した場面は大きく異なります。

| 比較項目 | TRUNCATE | DELETE |
| ------- | -------- | ------ |
| 削除の単位 | テーブル全体またはパーティション全体 | 行単位。`WHERE` 条件を指定可能 |
| フィルターの指定 | 不可 | 可能 |
| クエリ性能への影響 | なし | 削除バージョンが生成され、クエリ性能に影響する |
| 実行速度 | 非常に速い（メタデータレベルの操作） | 条件に一致する行数に依存する |
| デフォルトで復元可能か | `RECOVER` で復元可能（FORCE を使用しない場合） | 直接は復元できない |
| 主な利用シナリオ | 大量のデータの消去、パーティションの再構築 | 少量のデータの正確な削除 |

**使い分けの目安**:

- テーブル全体またはパーティション全体を消去する場合は、`TRUNCATE` を優先します。
- 条件に基づいて一部のデータを削除する場合は、`DELETE` を使用します。

## よくある質問 {#faq}

### TRUNCATE はテーブル構造も削除しますか？ {#does-truncate-delete-the-table-structure}

いいえ。`TRUNCATE` が消去するのはデータだけです。テーブル構造、パーティション定義、インデックスなどのメタデータはすべて残ります。

### TRUNCATE 後にデータを復元できますか？ {#can-data-be-recovered-after-truncate}

- **`FORCE` を指定しない場合**: 保持期間内であれば、`RECOVER` で復元できます。
- **`FORCE` を指定した場合**: データは物理削除され、復元できません。

### SCHEMA CHANGE の実行中に TRUNCATE を実行できますか？ {#can-truncate-be-performed-while-a-table-is-undergoing-schema-change}

いいえ。テーブルの状態が `NORMAL` である必要があります。それ以外の場合、コマンドはエラーになります。SCHEMA CHANGE の完了後に実行してください。

### TRUNCATE は進行中のインポートタスクに影響しますか？ {#does-truncate-affect-ongoing-import-tasks}

進行中のインポートタスクが失敗する場合があります。インポートがない時間帯に実行するか、関連するインポートを先に一時停止してください。

### TRUNCATE と DROP TABLE の違いは何ですか？ {#what-is-the-difference-between-truncate-and-drop-table}

- `TRUNCATE`: テーブル構造を残し、データだけを消去します。
- `DROP TABLE`: テーブル自体を構造とデータも含めて削除します。

### パーティション内の一部のデータだけを消去できますか？ {#can-only-part-of-the-data-in-a-partition-be-cleared}

いいえ。`TRUNCATE` で消去できるのは、テーブル全体または指定したパーティション全体だけです。行単位のフィルタリングはできません。条件に基づいて削除する場合は、[DELETE](./delete-manual)を使用してください。

## 関連ドキュメント {#related-documents}

- [RECOVER ステートメント](../../sql-manual/sql-statements/recycle/RECOVER): 消去したデータを復元します。
- [DELETE 操作](./delete-manual): 条件に基づいてデータを削除します。
