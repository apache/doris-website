---
{
  "title": "ごみ箱から復元",
  "language": "ja",
  "description": "誤操作による災害を回避するため、Dorisは誤って削除されたデータベース、テーブル、およびパーティションの復旧をサポートしています。"
}
---
## Recycle Binからの復旧

誤操作による災害を避けるため、Dorisは誤って削除されたデータベース、テーブル、パーティションの復旧をサポートしています。テーブルやデータベースを削除した後、Dorisは即座にデータを物理的に削除しません。ユーザーが`FORCE`を使用せずに`DROP DATABASE/TABLE/PARTITION`コマンドを実行した場合、Dorisは削除されたデータベース、テーブル、またはパーティションをrecycle binに移動します。`RECOVER`コマンドを使用してrecycle binから削除されたデータベース、テーブル、またはパーティションのすべてのデータを復元し、再び表示することができます。

**注意：** `DROP FORCE`を使用して削除が実行された場合、データは即座に削除され復旧できません。

### Recycle Binのクエリ

以下のコマンドでRecycle Binをクエリできます：

```sql
SHOW CATALOG RECYCLE BIN [WHERE NAME [= "name" | LIKE "name_matcher"]];
```
より詳細な構文とベストプラクティスについては、[SHOW-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/recycle/SHOW-CATALOG-RECYCLE-BIN)コマンドマニュアルを参照してください。MySqlクライアントのコマンドラインで`help SHOW CATALOG RECYCLE BIN`と入力することでも、より多くのヘルプを得ることができます。


### データリカバリの開始

削除されたデータをリカバリするには、以下のコマンドを使用できます：

1. `example_db`という名前の*データベースをリカバリする*：

```sql
RECOVER DATABASE example_db;
```
2. `example_tbl`という名前の*テーブルを復旧する*:

```sql
RECOVER TABLE example_db.example_tbl;
```
3. テーブル example_tbl 内の p1 という名前の*パーティションを復旧*する：

```sql
RECOVER PARTITION p1 FROM example_tbl;
```
RECOVERで使用されるより詳細な構文とベストプラクティスについては、[RECOVER](../../sql-manual/sql-statements/recycle/RECOVER)コマンドマニュアルを参照してください。また、MySqlクライアントのコマンドラインで`HELP RECOVER`と入力することで、より多くのヘルプを得ることができます。
