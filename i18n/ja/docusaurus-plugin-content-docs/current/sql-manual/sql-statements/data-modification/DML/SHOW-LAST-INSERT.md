---
{
    "title": "SHOW LAST INSERT",
    "language": "ja",
    "description": "現在のセッション接続で直近に実行した INSERT 操作の結果を表示するための構文です"
}
---

## 説明

この構文は、現在のセッション接続で直近に実行した INSERT 操作の結果を表示するために使用します。

## 構文

```sql
SHOW LAST INSERT
```

返される結果の例：

```
     TransactionId: 64067
             Label: insert_ba8f33aea9544866-8ed77e2844d0cc9b
          Database: default_cluster:db1
             Table: t1
TransactionStatus: VISIBLE
        LoadedRows: 2
      FilteredRows: 0
```

## 戻り値

* TransactionId: トランザクション ID
* Label: INSERT タスクに対応するラベル
* Database: INSERT に対応するデータベース
* Table: INSERT に対応するテーブル
* TransactionStatus: トランザクションの状態
   * PREPARE: 準備段階
   * PRECOMMITTED: 事前コミット段階
   * COMMITTED: トランザクションは成功したが、データはまだ参照できない状態
   * VISIBLE: トランザクションが成功し、データを参照できる状態
   * ABORTED: トランザクションが失敗した状態
* LoadedRows: 取り込まれた行数
* FilteredRows: フィルタリングされた行数

## 例

## キーワード

    SHOW, LAST, INSERT

## ベストプラクティス
