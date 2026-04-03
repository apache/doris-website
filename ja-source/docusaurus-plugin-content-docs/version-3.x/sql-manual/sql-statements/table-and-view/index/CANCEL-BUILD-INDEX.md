---
{
  "title": "BUILD INDEXをキャンセル",
  "description": "インデックス構築のバックグラウンドタスクをキャンセルします。",
  "language": "ja"
}
---
## デスクリプション

インデックス構築のバックグラウンドタスクをキャンセルします。

## Syntax

```sql
CANCEL BUILD INDEX ON <table_name> [ job_list ]
```
その中で：

```sql
job_list
  : (<job_id1>[ , job_id2 ][ ... ])
```
## 必須パラメータ

**<table_name>**

> Tableの識別子（つまり、名前）を指定します。この識別子はデータベース（Database）内で一意である必要があります。
>
> 識別子は文字で始まる必要があり（unicode名前サポートが有効な場合は任意の言語文字）、スペースや特殊文字を含むことはできません。ただし、識別子文字列全体がバッククォートで囲まれている場合は例外です（例：`My Object`）。
>
> 識別子は予約キーワードを使用できません。
>
> 詳細については、Identifier RequirementsとReserved Keywordsを参照してください。

## オプションパラメータ

**<job_list>**

> インデックス構築タスクの識別子のリストを指定します。カンマで区切り、括弧で囲みます。
>
> 識別子は数字である必要があり、SHOW BUILD INDEXで確認できます。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限       | オブジェクト | 注記                                                         |
| :--------- | :----------- | :----------------------------------------------------------- |
| ALTER_PRIV | Table        | CANCEL BUILD INDEXはTableに対するALTER操作とみなされます  |

## 使用上の注意

- 現在は転置インデックスにのみ有効で、bloomfilter indexなどの他のインデックスには有効ではありません。
- 現在は統合型ストレージ・コンピューティングモードにのみ有効で、分離型ストレージ・コンピューティングモードには有効ではありません。
- BUILD INDEXの進行状況とインデックス構築タスクはSHOW BUILD INDEXで確認できます。

## 例

- Tabletable1のすべてのインデックス構築タスクをキャンセルする

  ```sql
  CANCEL BUILD INDEX ON table1
  ```
- Tabletable1上のインデックス構築タスクjobid1とjobid2をキャンセルする

  ```sql
  CANCEL BUILD INDEX ON table1(jobid1, jobid2)
  ```
