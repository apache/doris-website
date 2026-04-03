---
{
  "title": "SHOW CREATE TABLE",
  "language": "ja",
  "description": "このステートメントは、データテーブルの作成ステートメントを表示するために使用されます。"
}
---
## 説明

このステートメントは、データテーブルの作成ステートメントを表示するために使用されます。

## 構文

```sql
SHOW [BRIEF] CREATE TABLE [<db_name>.]<table_name>
```
## 必須パラメータ
**1.`<table_name>`**
> テーブル識別子（名前）を指定します。これは、それが配置されているデータベース内で一意である必要があります。
>
> 識別子はアルファベット文字で始まる必要があり（unicode name supportが有効な場合は任意の言語の文字）、識別子文字列全体がバッククォートで囲まれていない限り、スペースや特殊文字を含むことはできません（例：`My Object`）。
>
> 識別子は予約キーワードを使用できません。
>
> 詳細については、Identifier RequirementsとReserved Keywordsを参照してください。

## オプションパラメータ
**1.`BRIEF`**
> 列定義を除く、テーブルの基本情報のみを表示します。

**2.`<db_name>`**
> データベースの識別子（つまり名前）を指定します。
>
> 識別子はアルファベット文字で始まる必要があり（unicode name supportが有効な場合は指定された言語の任意の文字）、識別子文字列全体がバッククォートで囲まれていない限り、スペースや特殊文字を含むことはできません（例：`My Database`）。
>
> 識別子は予約キーワードを使用できません。
>
> 詳細については、Identifier RequirementsとReserved Keywordsを参照してください。

## 戻り値
| column name | description |
| -- |-------------|
| Table | テーブル名          |
| Create Table | テーブル作成文        |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege         | Object    | Notes                           |
|:------------------|:----------|:--------------------------------|
| Select_priv       | Table     | SHOW CREATE TABLEはテーブルのSELECT操作に属します |


## 例

1. テーブルの作成文を表示する

   ```sql
   SHOW CREATE TABLE demo.test_table;
   ```
2. テーブルの簡略化されたテーブル作成文を表示する

   ```sql
   SHOW BRIEF CREATE TABLE demo.test_table;
   ```
