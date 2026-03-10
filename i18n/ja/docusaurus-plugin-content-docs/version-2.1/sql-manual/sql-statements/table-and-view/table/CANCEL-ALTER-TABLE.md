---
{
  "title": "ALTER TABLE のキャンセル",
  "language": "ja",
  "description": "このステートメントは、実行中のALTER TABLE操作をキャンセル（取り消し）するために使用されます。"
}
---
## 説明

このステートメントは、実行中のALTER TABLE操作をキャンセル（取り消し）するために使用されます。このコマンドを使用して、ALTER TABLE操作の実行中にそれを終了することができます。

## 構文

```sql
CANCEL ALTER TABLE { COLUMN | MATERIALIZED VIEW | ROLLUP } FROM <db_name>.<table_name> [ <job_id1> [ , <job_id2> ... ]]
```
## 必須パラメータ
**1. `{ COLUMN | MATERIALIZED VIEW | ROLLUP }`**
>キャンセルする変更の種類を指定します。以下のいずれかを選択する必要があります
>- `COLUMN`: テーブル列の変更操作をキャンセル
>- `ROLLUP`: ビューの変更操作をキャンセル
>- `MATERIALIZED VIEW`: マテリアライズドビューの変更操作をキャンセル

**2.`<db_name>`**
> データベースの識別子（名前）を指定します。
>
> 識別子はアルファベット文字で始まる必要があり（Unicode名前サポートが有効な場合、任意の言語文字が許可されます）、識別子文字列全体が引用符で囲まれている場合を除き、スペースや特殊文字を含めることはできません（例：`My Database`）。
>
> 識別子は予約キーワードを使用できません。
>
> 詳細については、識別子要件と予約キーワードを参照してください。

**3.`<table_name>`**
> データベース（Database）内のテーブルの識別子（名前）を指定します。
>
> 識別子はアルファベット文字で始まる必要があり（Unicode名前サポートが有効な場合、任意の言語文字が許可されます）、識別子文字列全体が引用符で囲まれている場合を除き、スペースや特殊文字を含めることはできません（例：`My Object`）。
>
> 識別子は予約キーワードを使用できません。
>
> 詳細については、識別子要件と予約キーワードを参照してください。

## オプションパラメータ
**1. `<job_id>`**
> キャンセルする特定のジョブIDです。
>
> ジョブIDが指定された場合、指定されたジョブのみがキャンセルされます。指定されていない場合、テーブル上の指定された種類（COLUMNまたはROLLUP）の進行中のすべての変更がキャンセルされます。
>
> 複数のジョブIDをカンマ区切りで指定できます。
>
> ジョブIDは`SHOW ALTER TABLE COLUMN`または`SHOW ALTER TABLE ROLLUP`コマンドを使用して取得できます。


## 権限制御
このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：


| 権限 | オブジェクト | 備考                    |
| :---------------- | :------------- | :---------------------------- |
| ALTER_PRIV        | Table   | CANCEL ALTER TABLEはテーブルのALTER操作に属します |


## 注記
- このコマンドは非同期操作であり、実際の実行結果は`SHOW ALTER TABLE COLUMN`または`SHOW ALTER TABLE ROLLUP`を使用してタスクのステータスを確認することで確認する必要があります。

## 例

1. ALTER TABLE COLUMN操作をキャンセル

```sql
CANCEL ALTER TABLE COLUMN
FROM db_name.table_name
```
2. ALTER TABLE ROLLUP操作をキャンセルする

```sql
CANCEL ALTER TABLE ROLLUP
FROM db_name.table_name
```
3. ジョブIDに基づいてALTER TABLE ROLLUP操作をバッチでキャンセルする

```sql
CANCEL ALTER TABLE ROLLUP
FROM db_name.table_name (jobid,...)
```
4. ALTER CLUSTER操作のキャンセル

```sql
(To be implemented...)
```
