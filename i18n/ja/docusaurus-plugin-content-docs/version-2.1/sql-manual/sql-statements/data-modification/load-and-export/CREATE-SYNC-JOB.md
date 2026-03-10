---
{
  "title": "同期ジョブを作成",
  "language": "ja",
  "description": "データ同期（Sync Job）機能により、ユーザーは永続的なデータ同期ジョブを送信することができます。"
}
---
## 説明

データ同期（Sync Job）機能により、ユーザーは永続的なデータ同期ジョブを送信できます。指定されたリモートソースからBinlogを読み取ることで、MySQLデータベースからのデータ更新操作のCDC（Change Data Capture）を増分同期します。現在、同期ジョブはCanalへの接続をサポートし、Canalサーバーから解析されたBinlogデータを取得してDorisにインポートします。

ユーザーは[SHOW SYNC JOB](../../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-SYNC-JOB)を通じて同期ジョブのステータスを確認できます。

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

> 現在のデータベース内での同期ジョブの一意な名前を指定します。同じ`<job_name>`を持つジョブは同時に1つしか実行できません。

**2. `<channel_desc>`**

> MySQLソーステーブルとDorisターゲットテーブル間のマッピング関係を記述します。
>
>
> - **`<mysql_db.src_tbl>`**: MySQL内のソーステーブル（データベース名を含む）を指定します。
> - **`<des_tbl>`**: Doris内のターゲットテーブルを指定します。ターゲットテーブルは一意である必要があり、バッチ削除機能が有効になっている必要があります。
> - **`<columns_mapping>`**（オプション）: ソーステーブルとターゲットテーブルのカラム間のマッピングを定義します。省略した場合、カラムは順番に一対一でマッピングされます。`col_name = expr`の形式はサポートされていないことに注意してください。

**3. `<binlog_desc>`**

> Binlogのリモートデータソースを記述します。
>
> Canalデータソースのプロパティ（`canal.`でプレフィックスされたキー）には以下が含まれます：
>
> - **`canal.server.ip`**: Canalサーバーのアドレス。
> - **`canal.server.port`**: Canalサーバーのポート。
> - **`canal.destination`**: Canalインスタンスの識別子。
> - **`canal.batchSize`**: 取得する最大バッチサイズ（デフォルトは8192）。
> - **`canal.username`**: Canalインスタンスのユーザー名。
> - **`canal.password`**: Canalインスタンスのパスワード。
> - **`canal.debug`**（オプション）: trueに設定すると、詳細なバッチと行の情報を出力します。

## 使用上の注意

- 現在、同期ジョブはCanalサーバーへの接続のみをサポートしています。
- データベース内では同じ`<job_name>`を持つ同期ジョブは1つしか同時実行できません。
- `<channel_desc>`で指定されるターゲットテーブルは、バッチ削除機能が有効になっている必要があります。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：
| 権限 | オブジェクト | 注記                |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV        | Table   | この操作は、インポート対象テーブルに対してLOAD_PRIV権限を持つユーザーまたはロールのみが実行できます。 |

## 例

1. **シンプルな同期ジョブの作成**

   `test_db`データベース内で`job1`という名前の同期ジョブを作成し、MySQLソーステーブル`mysql_db1.tbl1`をDorisターゲットテーブル`test_tbl`にマッピングし、ローカルのCanalサーバーに接続します。

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
2. **複数のチャネルと明示的なカラムマッピングを使用した同期ジョブの作成**

   `test_db`データベース内で、複数のMySQLソーステーブルと一対一のマッピング、および明示的に指定されたカラム順序を持つ`job1`という名前の同期ジョブを作成します。

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
