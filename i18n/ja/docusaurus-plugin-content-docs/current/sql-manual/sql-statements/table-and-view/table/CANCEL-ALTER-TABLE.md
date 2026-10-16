---
{
    "title": "CANCEL-ALTER-TABLE",
    "language": "ja",
    "description": "このステートメントは、実行中の ALTER TABLE 操作を取り消すために使用します。"
}
---

## 説明

このステートメントは、実行中の ALTER TABLE 操作を取り消すために使用します。ALTER TABLE 操作の実行中に、このコマンドで操作を終了できます。

## 構文

```sql
CANCEL ALTER TABLE { COLUMN | MATERIALIZED VIEW | ROLLUP } FROM <db_name>.<table_name> [ <job_id1> [ , <job_id2> ... ]]
```

## 必須パラメータ
**1. `{ COLUMN | MATERIALIZED VIEW | ROLLUP }`**
>取り消す変更の種類を指定します。いずれか一つを選択する必要があります。
>- `COLUMN`：テーブルのカラムに対する変更操作を取り消します。
>- `ROLLUP`：ビューに対する変更操作を取り消します。
>- `MATERIALIZED VIEW`：マテリアライズドビューに対する変更操作を取り消します。

**2.`<db_name>`**
> データベースの識別子（名前）を指定します。
>
> 識別子は英字で始める必要があります（Unicode 名のサポートが有効な場合は、任意の言語の文字を使用できます）。識別子全体を引用符で囲む場合（例：`My Database`）を除き、空白や特殊文字を含めることはできません。
>
> 識別子に予約語を使用することはできません。
>
> 詳細については、識別子の要件と予約語を参照してください。

**3.`<table_name>`**
> データベース（Database）内のテーブルの識別子（名前）を指定します。
>
> 識別子は英字で始める必要があります（Unicode 名のサポートが有効な場合は、任意の言語の文字を使用できます）。識別子全体を引用符で囲む場合（例：`My Object`）を除き、空白や特殊文字を含めることはできません。
>
> 識別子に予約語を使用することはできません。
>
> 詳細については、識別子の要件と予約語を参照してください。

## オプションパラメータ
**1. `<job_id>`**
> 取り消すジョブの ID を指定します。
>
> ジョブ ID を指定した場合は、そのジョブのみを取り消します。指定しない場合は、テーブルで実行中の、指定した種類（COLUMN または ROLLUP）の変更をすべて取り消します。
>
> 複数のジョブ ID をカンマで区切って指定できます。
>
> ジョブ ID は `SHOW ALTER TABLE COLUMN` または `SHOW ALTER TABLE ROLLUP` コマンドで取得できます。


## 権限制御
この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。


| 権限 | オブジェクト | 備考                    |
| :---------------- | :------------- | :---------------------------- |
| ALTER_PRIV        | テーブル   | CANCEL ALTER TABLE はテーブルの ALTER 操作に該当します |


## 注意事項
- このコマンドは非同期で実行されます。実際の実行結果は、`SHOW ALTER TABLE COLUMN` または `SHOW ALTER TABLE ROLLUP` でジョブの状態を確認してください。

## 例

1. ALTER TABLE COLUMN 操作を取り消す

```sql
CANCEL ALTER TABLE COLUMN
FROM db_name.table_name
```

2. ALTER TABLE ROLLUP 操作を取り消す  


```sql
CANCEL ALTER TABLE ROLLUP
FROM db_name.table_name
```

3. ジョブ ID に基づいて ALTER TABLE ROLLUP 操作を一括で取り消す


```sql
CANCEL ALTER TABLE ROLLUP
FROM db_name.table_name (jobid,...)
```
