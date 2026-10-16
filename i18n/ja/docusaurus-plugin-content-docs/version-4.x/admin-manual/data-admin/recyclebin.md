---
{
    "title": "ごみ箱からの復元",
    "language": "ja",
    "description": "Doris のごみ箱を使用して、DROP で誤って削除したデータベース、テーブル、パーティションを復元し、データの損失を防ぎます。このページでは、確認から復元までの手順を説明します。",
    "keywords": [
        "Doris のごみ箱",
        "データ復旧",
        "誤削除からの復旧",
        "RECOVER",
        "SHOW CATALOG RECYCLE BIN",
        "DROP DATABASE からの復旧",
        "DROP TABLE からの復旧",
        "DROP PARTITION からの復旧",
        "DROP FORCE",
        "ごみ箱",
        "データ復旧",
        "データベースの誤削除",
        "パーティションの復元"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Database / table / partition accidental-deletion recovery / disaster recovery -->

誤操作によるデータ損失を防ぐため、Doris は誤って削除したデータベース、テーブル、パーティションを復元できるごみ箱を提供しています。

Doris で `DROP DATABASE/TABLE/PARTITION` を `FORCE` キーワードなしで実行した場合、データはすぐには物理的に削除されません。代わりに、データベース、テーブル、パーティションをごみ箱に移動します。後で `RECOVER` コマンドを使ってオブジェクトを復元し、再び参照できるようにします。

:::warning 注意
`DROP ... FORCE` を実行すると、データはすぐに物理的に削除され、ごみ箱から復元できません。
:::

## 適用場面

| 場面 | 復元可能か | 推奨する操作 |
| --- | --- | --- |
| `DROP DATABASE example_db` を誤って実行した | はい | `RECOVER DATABASE example_db` |
| `DROP TABLE example_db.example_tbl` を誤って実行した | はい | `RECOVER TABLE example_db.example_tbl` |
| `ALTER TABLE ... DROP PARTITION p1` を誤って実行した | はい | `RECOVER PARTITION p1 FROM example_tbl` |
| `DROP ... FORCE` を誤って実行した | いいえ | バックアップから復元する |

## 前提条件

- 現在のユーザーに、復元するオブジェクトに対する `ALTER_PRIV` などの必要な権限があること。
- `DROP` コマンドを `FORCE` なしで実行したこと。
- ごみ箱内のオブジェクトが手動で完全削除されていないこと（[DROP-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/recycle/DROP-CATALOG-RECYCLE-BIN) を参照）。

## 復元手順の概要

1. `SHOW CATALOG RECYCLE BIN` を実行し、ごみ箱内の復元可能なオブジェクトを確認します。
2. オブジェクトの種類（DATABASE / TABLE / PARTITION）に応じた `RECOVER` コマンドを選びます。
3. 復元後、オブジェクトが再び参照可能になり、データが失われていないことを確認します。

## ごみ箱を確認する

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Confirm that the target object exists in the recycle bin before recovery -->

復元操作を実行する前に、対象のオブジェクトがまだごみ箱にあることを確認します。

```sql
SHOW CATALOG RECYCLE BIN [WHERE NAME [= "name" | LIKE "name_matcher"]];
```

パラメータの説明:

| パラメータ | 説明 |
| --- | --- |
| `NAME = "name"` | ごみ箱内のオブジェクトを名前の完全一致で絞り込みます |
| `NAME LIKE "name_matcher"` | ワイルドカードパターンでごみ箱内のオブジェクトを絞り込みます（`%` と `_` を使用できます） |

構文とベストプラクティスの詳細は、[SHOW-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/recycle/SHOW-CATALOG-RECYCLE-BIN) コマンドのマニュアルを参照してください。MySQL クライアントのコマンドラインで `HELP SHOW CATALOG RECYCLE BIN` を実行して確認することもできます。

## データを復元する

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data restoration after database / table / partition accidental deletion -->

復元するオブジェクトの種類に応じて、次のいずれかのコマンドを選びます。

### データベースを復元する

`example_db` という名前のデータベースを復元します:

```sql
RECOVER DATABASE example_db;
```

### テーブルを復元する

`example_tbl` という名前のテーブルを `example_db` 内に復元します:

```sql
RECOVER TABLE example_db.example_tbl;
```

### パーティションを復元する

パーティション `p1` を `example_tbl` テーブルに復元します:

```sql
RECOVER PARTITION p1 FROM example_tbl;
```

`RECOVER` の構文とベストプラクティスの詳細は、[RECOVER](../../sql-manual/sql-statements/recycle/RECOVER) コマンドのマニュアルを参照してください。MySQL クライアントのコマンドラインで `HELP RECOVER` を実行して確認することもできます。

## よくある質問

### Q: `RECOVER` でオブジェクトが存在しないと報告された場合は？

そのオブジェクトは `DROP ... FORCE` で削除されたため、ごみ箱に入っておらず、そこから復元できません。バックアップからデータを復元してください。

### Q: `SHOW CATALOG RECYCLE BIN` で対象のオブジェクトが返されない場合は？

そのオブジェクトは `DROP CATALOG RECYCLE BIN` によってすでに完全削除されており、復元できません。バックアップからデータを復元してください。

### Q: 復元時に権限エラーが報告された場合は？

現在のユーザーには必要な権限がありません。適切な権限を持つユーザーに権限を付与してもらうか、代わりに復元を実行してもらってください。

### Q: 復元後にデータが返されない場合は？

同じ名前の新しいオブジェクトが作成され、復元したオブジェクトより優先されています。まず新しいオブジェクトを `RENAME` するか削除し、その後で復元を再実行してください。
