---
{
  "title": "SYNC JOBの作成",
  "description": "データ同期（Sync Job）機能により、ユーザーは永続的なデータ同期ジョブを送信できます。",
  "language": "ja"
}
---
## 説明

データ同期（Sync Job）機能により、ユーザーは永続的なデータ同期ジョブを送信できます。この機能は、指定されたリモートソースからBinlogを読み取ることで、MySQLデータベースからのデータ更新操作のCDC（Change Data Capture）を増分的に同期します。現在、同期ジョブはCanalへの接続をサポートし、Canalサーバーから解析済みのBinlogデータを取得してDorisにインポートします。

ユーザーは[SHOW SYNC JOB](../../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-SYNC-JOB)で同期ジョブのステータスを確認できます。

## 構文

```sql
CREATE SYNC [<db>.]<job_name>
(<channel_desc> [, ... ])
<binlog_desc>
```
ここで：

```sql
channel_desc
  : FROM <mysql_db>.<src_tbl> INTO <des_tbl> [ <columns_mapping> ]
```
```sql
binlog_desc
  : FROM BINLOG ("<key>" = "<value>" [, ... ])
```
## 必須パラメータ

**1. `<job_name>`**

> 現在のデータベース内の同期ジョブの一意名を指定します。同じ`<job_name>`を持つジョブは同時に1つのみ実行できます。

**2. `<channel_desc>`**

> MySQLソースTableとDorisターゲットTable間のマッピング関係を記述します。
>
>
> - **`<mysql_db.src_tbl>`**: MySQL内のソースTableを指定します（データベース名を含む）。
> - **`<des_tbl>`**: Doris内のターゲットTableを指定します。ターゲットTableは一意である必要があり、バッチ削除機能が有効化されている必要があります。
> - **`<columns_mapping>`**（オプション）: ソースTableとターゲットTableの列間のマッピングを定義します。省略された場合、列は順序に従って一対一でマッピングされます。なお、`col_name = expr`の形式はサポートされていません。

**3. `<binlog_desc>`**

> Binlogのリモートデータソースを記述します。
>
> Canalデータソースのプロパティ（キーに`canal.`の接頭辞が付く）には以下が含まれます：
>
> - **`canal.server.ip`**: CanalサーバーのアドレスNAME。
> - **`canal.server.port`**: Canalサーバーのポート。
> - **`canal.destination`**: Canalインスタンスの識別子。
> - **`canal.batchSize`**: 取得する最大バッチサイズ（デフォルトは8192）。
> - **`canal.username`**: Canalインスタンスのユーザー名。
> - **`canal.password`**: Canalインスタンスのパスワード。
> - **`canal.debug`**（オプション）: trueに設定すると、詳細なバッチと行情報を出力します。

## 使用上の注意

- 現在、同期ジョブはCanalサーバーへの接続のみをサポートしています。
- データベース内で同じ`<job_name>`を持つ同期ジョブは同時に1つのみ実行できます。
- `<channel_desc>`で指定されたターゲットTableは、バッチ削除機能が有効化されている必要があります。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：
| 権限 | オブジェクト | 注記                |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV        | Table   | この操作は、インポートTableに対するLOAD_PRIV権限を持つユーザーまたはロールのみが実行できます。 |

## 例

1. **シンプルな同期ジョブを作成する**

   `test_db`データベース内で、MySQLソースTable`mysql_db1.tbl1`をDorisターゲットTable`test_tbl`にマッピングし、ローカルのCanalサーバーに接続する`job1`という名前の同期ジョブを作成します。

   ```sql
   CREATE SYNC `test_db`.`job1`
   (
     FROM `mysql_db1`.`tbl1` INTO `test_tbl`
   )
   FROM BINLOG
   (
     "type" = "canal",
     "canal.server.ip" = "127.0.0.1",
     "canal.server.port" = "11111",
     "canal.destination" = "example",
     "canal.username" = "",
     "canal.password" = ""
   );
   ```
2. **複数のチャンネルと明示的なカラムマッピングを使用した同期ジョブの作成**

   一対一マッピングを持つ複数のMySQLソースTableに対して、明示的に指定されたカラム順序で`test_db`データベース内に`job1`という名前の同期ジョブを作成します。

   ```sql
   CREATE SYNC `test_db`.`job1`
   (
     FROM `mysql_db`.`t1` INTO `test1` (k1, k2, v1),
     FROM `mysql_db`.`t2` INTO `test2` (k3, k4, v2)
   )
   FROM BINLOG
   (
     "type" = "canal",
     "canal.server.ip" = "xx.xxx.xxx.xx",
     "canal.server.port" = "12111",
     "canal.destination" = "example",
     "canal.username" = "username",
     "canal.password" = "password"
   );
   ```
