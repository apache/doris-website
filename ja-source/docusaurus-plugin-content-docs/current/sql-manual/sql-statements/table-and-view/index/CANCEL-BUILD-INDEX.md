---
{
  "title": "BUILD INDEXをキャンセル",
  "language": "ja",
  "description": "インデックス構築のバックグラウンドタスクをキャンセルします。"
}
---
## 説明

インデックス構築のバックグラウンドタスクをキャンセルします。

## 構文

```sql
CANCEL BUILD INDEX ON <table_name> [ job_list ]
```
そのうち：

```sql
job_list
  : (<job_id1>[ , job_id2 ][ ... ])
```
## 必須パラメータ

**<table_name>**

> テーブルの識別子（名前）を指定します。この識別子は、そのDatabase内で一意である必要があります。
>
> 識別子は文字で開始する必要があり（unicode name supportが有効な場合は任意の言語文字）、識別子文字列全体がバッククォートで囲まれていない限り（例：`My Object`）、スペースや特殊文字を含むことはできません。
>
> 識別子は予約キーワードを使用できません。
>
> 詳細については、Identifier RequirementsおよびReserved Keywordsを参照してください。

## オプションパラメータ

**<job_list>**

> インデックス構築タスクの識別子のリストをカンマで区切り、括弧で囲んで指定します。
>
> 識別子は数値である必要があり、SHOW BUILD INDEXで確認できます。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege  | Object | Notes                                                        |
| :--------- | :----- | :----------------------------------------------------------- |
| ALTER_PRIV | Table  | CANCEL BUILD INDEXはテーブルに対するALTER操作とみなされます |

## 使用上の注意

- 現在、inverted indexにのみ有効で、bloomfilter indexなどの他のインデックスには有効ではありません。
- 現在、integrated storage and computing modeにのみ有効で、separated storage and computing modeには有効ではありません。
- BUILD INDEXの進行状況とインデックス構築タスクは、SHOW BUILD INDEXで確認できます。

## 例

- テーブルtable1のすべてのインデックス構築タスクをキャンセル

  ```sql
  CANCEL BUILD INDEX ON table1
  ```
- テーブル table1 上のインデックス構築タスク jobid1 と jobid2 をキャンセルする

  ```sql
  CANCEL BUILD INDEX ON table1(jobid1, jobid2)
  ```
