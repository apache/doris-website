---
{
  "title": "インデックスの構築",
  "language": "ja",
  "description": "テーブル全体またはテーブルパーティションに対してインデックスを構築します。テーブル名とインデックス名を指定する必要があり、オプションでパーティションリストを指定できます。"
}
---
## 説明

テーブル全体またはテーブルパーティションのインデックスを構築します。テーブル名とインデックス名を指定する必要があり、オプションでパーティションリストを指定できます。

## 構文

```sql
BUILD INDEX <index_name> ON <table_name> [partition_list]
```
ここで：

```sql
partition_list
  : PARTITION (<partition_name1>[ , parition_name2 ][ ... ])
```
## 必須パラメータ

**<index_name>**

> indexの識別子（名前）を指定します。テーブル内で一意である必要があります。
>
> 識別子は文字で始まる必要があり（unicode名前サポートが有効な場合は任意の言語文字）、識別子文字列全体がバッククォートで囲まれていない限り（例：`My Object`）、スペースや特殊文字を含むことはできません。
>
> 識別子は予約キーワードを使用することはできません。
>
> 詳細については、Identifier Requirements and Reserved Keywordsを参照してください。

**<table_name>**

> テーブルの識別子（名前）を指定します。データベース内で一意である必要があります。
>
> 識別子は文字で始まる必要があり（unicode名前サポートが有効な場合は任意の言語文字）、識別子文字列全体がバッククォートで囲まれていない限り（例：`My Object`）、スペースや特殊文字を含むことはできません。
>
> 識別子は予約キーワードを使用することはできません。
>
> 詳細については、Identifier Requirements and Reserved Keywordsを参照してください。

## オプションパラメータ

**<partition_list>**

> カンマで区切られたパーティション識別子（名前）のリストを指定します。テーブル内で一意である必要があります。
>
> 識別子は文字で始まる必要があり（unicode名前サポートが有効な場合は任意の言語文字）、識別子文字列全体がバッククォートで囲まれていない限り（例：`My Object`）、スペースや特殊文字を含むことはできません。
>
> 識別子は予約キーワードを使用することはできません。
>
> 詳細については、Identifier Requirements and Reserved Keywordsを参照してください。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限       | オブジェクト | 備考                                    |
| :--------- | :----------- | :-------------------------------------- |
| ALTER_PRIV | Table        | BUILD INDEXはテーブルに対するALTER操作です |

## 使用上の注意

- 現在はinverted indexに対してのみ有効で、BloomFilter indexなどの他のindexは無効です。
- 現在は計算・ストレージ統合モードに対してのみ有効で、計算・ストレージ分離モードには無効です。
- BUILD INDEXの進捗はSHOW BUILD INDEXで確認できます

## 例

- テーブル全体table1にindex1をビルドします。

  ```sql
  BUILD INDEX index1 ON table1
  ```
- table1のパーティションp1とp2にインデックスindex1を構築します。

  ```sql
  BUILD INDEX index1 ON table1 PARTITION(p1, p2)
  ```
