---
{
  "title": "SHOW ROUTINE LOAD",
  "description": "この文は Routine Load ジョブの実行ステータスを表示するために使用されます。特定のジョブまたはすべてのジョブのステータス情報を確認することができます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、Routine Loadジョブの実行ステータスを表示するために使用されます。特定のジョブまたはすべてのジョブのステータス情報を表示できます。

## Syntax

```sql
SHOW [ALL] ROUTINE LOAD [FOR <jobName>];
```
## オプションパラメータ

**1. `[ALL]`**

> オプションパラメータ。指定した場合、すべてのジョブ（停止またはキャンセルされたジョブを含む）が表示されます。指定しない場合、現在実行中のジョブのみが表示されます。

**2. `[FOR <jobName>]`**

> オプションパラメータ。表示するジョブ名を指定します。指定しない場合、現在のデータベース配下のすべてのジョブが表示されます。
>
> 以下の形式をサポートします：
>
> - `<job_name>`：現在のデータベース内の指定した名前のジョブを表示
> - `<db_name>.<job_name>`：指定したデータベース内の指定した名前のジョブを表示

## 戻り値

| フィールド名           | 説明                                                        |
| :------------------- | :---------------------------------------------------------- |
| Id                   | ジョブID                                                     |
| Name                 | ジョブ名                                                     |
| CreateTime           | ジョブ作成時刻                                                |
| PauseTime            | 最新のジョブ一時停止時刻                                       |
| EndTime              | ジョブ終了時刻                                                |
| DbName               | 対応するデータベース名                                         |
| TableName            | 対応するTable名（複数Tableの場合は'multi-table'と表示）      |
| IsMultiTbl           | マルチTableジョブかどうか                                    |
| State                | ジョブ実行状態                                                |
| DataSourceType       | データソースタイプ：KAFKA                                      |
| CurrentTaskNum       | 現在のサブタスク数                                             |
| JobProperties        | ジョブ設定詳細                                                |
| DataSourceProperties | データソース設定詳細                                           |
| CustomProperties     | カスタム設定                                                  |
| Statistic            | ジョブ実行統計                                                |
| Progress             | ジョブ実行進捗                                                |
| Lag                  | ジョブ遅延状態                                                |
| ReasonOfStateChanged | ジョブ状態変更理由                                             |
| ErrorLogUrls         | 品質チェックに失敗したフィルタリングデータを確認するURL           |
| OtherMsg             | その他のエラーメッセージ                                        |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限が必要です：

| 権限         | オブジェクト | 備考                                              |
| :----------- | :--------- | :----------------------------------------------- |
| LOAD_PRIV    | Table      | SHOW ROUTINE LOADにはTableに対するLOAD権限が必要    |

## 注意事項

- State の説明：
  - NEED_SCHEDULE：ジョブはスケジュール待ち
  - RUNNING：ジョブは実行中
  - PAUSED：ジョブは一時停止中
  - STOPPED：ジョブは終了済み
  - CANCELLED：ジョブはキャンセル済み

- Progress の説明：
  - Kafkaデータソースの場合、各パーティションの消費済みオフセットを表示
  - 例：{"0":"2"}はKafkaパーティション0の消費進捗が2であることを意味

- Lag の説明：
  - Kafkaデータソースの場合、各パーティションの消費遅延を表示
  - 例：{"0":10}はKafkaパーティション0の消費遅延が10であることを意味

## 例

- test1という名前のすべてのroutine loadジョブを表示（停止またはキャンセルされたものを含む）

    ```sql
    SHOW ALL ROUTINE LOAD FOR test1;
    ```
- test1という名前で現在実行中のroutine loadジョブを表示する

    ```sql
    SHOW ROUTINE LOAD FOR test1;
    ```
- example_db内のすべてのroutine loadジョブ（停止またはキャンセルされたものを含む）を表示します。結果は1行または複数行になる場合があります。

    ```sql
    use example_db;
    SHOW ALL ROUTINE LOAD;
    ```
- example_db内で現在実行中のすべてのroutine load jobsを表示する

    ```sql
    use example_db;
    SHOW ROUTINE LOAD;
    ```
- example_db内のtest1という名前で現在実行中のroutine load jobを表示する

    ```sql
    SHOW ROUTINE LOAD FOR example_db.test1;
    ```
- example_db内のtest1という名前のすべてのルーチンロードジョブ（停止またはキャンセルされたものを含む）を表示します。結果は1行または複数行になる場合があります。

    ```sql
    SHOW ALL ROUTINE LOAD FOR example_db.test1;
    ```
