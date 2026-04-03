---
{
  "title": "ごみ箱から復元",
  "language": "ja",
  "description": "誤操作による災害を避けるため、Dorisは誤って削除されたデータベース、テーブル、およびパーティションの復旧をサポートしています。"
}
---
## Recycle Binからの復旧

誤操作による災害を避けるため、DorisはうっかりしてDELETEしたデータベース、テーブル、およびパーティションの復旧をサポートしています。テーブルまたはデータベースを削除した後、Dorisは即座にデータを物理的に削除しません。ユーザが`FORCE`を使用せずに`DROP DATABASE/TABLE/PARTITION`コマンドを実行すると、Dorisは削除されたデータベース、テーブル、またはパーティションをrecycle binに移動します。`RECOVER`コマンドを使用して、削除されたデータベース、テーブル、またはパーティションのすべてのデータをrecycle binから復元し、再び表示可能にすることができます。

**注意：** 削除が`DROP FORCE`を使用して実行された場合、データは即座に削除され、復旧することはできません。

### Recycle Binのクエリ

次のコマンドでRecycle Binをクエリできます：

```sql
SHOW CATALOG RECYCLE BIN [WHERE NAME [= "name" | LIKE "name_matcher"]];
```
より詳細な構文とベストプラクティスについては、[SHOW-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/recycle/SHOW-CATALOG-RECYCLE-BIN)コマンドマニュアルを参照してください。MySQLクライアントのコマンドラインで`help SHOW CATALOG RECYCLE BIN`と入力することで、より多くのヘルプを取得することもできます。


### データ復旧の開始

削除されたデータを復旧するには、以下のコマンドを使用できます：

1. `example_db`という名前の*データベースを復旧*：

```sql
RECOVER DATABASE example_db;
```
2. `example_tbl`という名前の*テーブルを復旧*します：

```sql
RECOVER TABLE example_db.example_tbl;
```
3. table example_tbl内のp1という名前の*パーティションを復旧*する：

```sql
RECOVER PARTITION p1 FROM example_tbl;
```
RECOVERの詳細な構文とベストプラクティスについては、[RECOVER](../../sql-manual/sql-statements/recycle/RECOVER)コマンドマニュアルを参照してください。また、MySqlクライアントのコマンドラインで`HELP RECOVER`と入力することで、より詳しいヘルプを表示することもできます。
