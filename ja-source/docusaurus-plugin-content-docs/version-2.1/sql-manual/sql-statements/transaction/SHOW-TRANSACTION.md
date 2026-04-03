---
{
  "title": "SHOW TRANSACTION",
  "language": "ja",
  "description": "この構文は、指定されたtransaction idまたはlabelのトランザクション詳細を表示するために使用されます。"
}
---
## 説明

この構文は、指定されたトランザクションIDまたはラベルのトランザクション詳細を表示するために使用されます。

## 構文

```sql
SHOW TRANSACTION
[FROM <db_name>]
WHERE
[id = <transaction_id> | label = <label_name>];
```
## 必須パラメータ

**1. `<transaction_id>`**

詳細を表示するトランザクションID。

**2. `<label_name>`**

トランザクション詳細を表示するラベル。

## オプションパラメータ

**1. `<db_name>`**

トランザクション詳細を表示するデータベース。

## 戻り値

| カラム名            | 説明 |
|---|---|
| TransactionId       | トランザクションID | 
| Label               | インポートタスクに関連付けられたラベル | 
| Coordinator         | トランザクションを調整する責任を持つノード | 
| TransactionStatus   | トランザクションのステータス | 
| PREPARE             | 準備フェーズ | 
| COMMITTED           | トランザクションは成功したが、データはまだ表示されない | 
| VISIBLE             | トランザクションは成功し、データが表示される  | 
| ABORTED             | トランザクションが失敗 | 
| LoadJobSourceType   | インポートタスクのタイプ | 
| PrepareTime         | トランザクションの開始時刻 | 
| CommitTime          | トランザクションが正常にコミットされた時刻 | 
| FinishTime          | データが表示可能になった時刻 | 
| Reason              | エラーメッセージ | 
| ErrorReplicasCount  | エラーのあるレプリカ数 | 
| ListenerId          | 関連するインポートジョブのID | 
| TimeoutMs           | トランザクションタイムアウト時間（ミリ秒） |

## アクセス制御要件

| 権限 | オブジェクト | 備考 |
|:----------| :----------- | :------------------------ |
| LOAD_PRIV | Database |  |

## 例

1. id 4005のトランザクションを表示:

   ```sql
   SHOW TRANSACTION WHERE ID=4005;
   ```
2. 指定されたdbで、id 4005のトランザクションを表示します：

   ```sql
   SHOW TRANSACTION FROM db WHERE ID=4005;
   ```
3. label_nameというラベルのトランザクションを表示する:

   ```sql
   SHOW TRANSACTION WHERE LABEL = 'label_name';
   ```
