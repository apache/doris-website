---
{
    "title": "SHOW TRANSACTION",
    "language": "ja",
    "description": "指定したトランザクション ID またはラベルの詳細を表示する構文です。"
}
---

## 説明

この構文を使用して、指定したトランザクション ID またはラベルの詳細を表示します。

## 構文

```sql
SHOW TRANSACTION
[FROM <db_name>]
WHERE
[id = <transaction_id> | label = <label_name>];
```

## 必須パラメータ

**1. `<transaction_id>`**

詳細を表示するトランザクションの ID です。

**2. `<label_name>`**

詳細を表示するトランザクションのラベルです。

## オプションパラメータ

**1. `<db_name>`**

トランザクションの詳細を表示するデータベースです。

## 戻り値

| 列名                | 説明 |
|---|---|
| TransactionId       | トランザクション ID |
| Label               | インポートタスクに関連付けられたラベル |
| Coordinator         | トランザクションの調整を担当するノード |
| TransactionStatus   | トランザクションの状態 |
| PREPARE             | 準備段階 |
| COMMITTED           | トランザクションは成功しましたが、データはまだ参照できません |
| VISIBLE             | トランザクションは成功し、データを参照できます |
| ABORTED             | トランザクションは失敗しました |
| LoadJobSourceType   | インポートタスクの種類 |
| PrepareTime         | トランザクションの開始時刻 |
| CommitTime          | トランザクションが正常にコミットされた時刻 |
| FinishTime          | データが参照可能になった時刻 |
| Reason              | エラーメッセージ |
| ErrorReplicasCount  | エラーが発生したレプリカの数 |
| ListenerId          | 関連するインポートジョブの ID |
| TimeoutMs           | トランザクションのタイムアウト時間（ミリ秒） |

## 必要な権限

| 権限 | オブジェクト | 備考 |
|:----------| :----------- | :------------------------ |
| LOAD_PRIV | データベース |  |

## 例

1. ID が 4005 のトランザクションを表示します。

   ```sql
   SHOW TRANSACTION WHERE ID=4005;
   ```

2. 指定したデータベース内で、ID が 4005 のトランザクションを表示します。

   ```sql
   SHOW TRANSACTION FROM db WHERE ID=4005;
   ```

3. ラベルが label_name のトランザクションを表示します。

   ```sql
   SHOW TRANSACTION WHERE LABEL = 'label_name';
   ```
