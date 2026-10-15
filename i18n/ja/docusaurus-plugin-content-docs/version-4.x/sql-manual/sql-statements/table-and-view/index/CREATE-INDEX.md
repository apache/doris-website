---
{
    "title": "CREATE INDEX",
    "language": "ja",
    "description": "テーブルに新しいインデックスを作成します。テーブル名とインデックス名は必須です。インデックスの種類、プロパティ、コメントは任意で指定できます。"
}
---

## 説明

テーブルに新しいインデックスを作成します。テーブル名とインデックス名は必須です。インデックスの種類、プロパティ、コメントは任意で指定できます。

## 構文


```sql
CREATE INDEX [IF NOT EXISTS] <index_name> 
             ON <table_name> (<column_name> [, ...])
             [USING {INVERTED | NGRAM_BF | ANN}]
             [PROPERTIES ("<key>" = "<value>"[ , ...])]
             [COMMENT '<index_comment>']
```

## 必須パラメータ

**1. `<index_name>`**

> インデックスの識別子（名前）を指定します。所属するテーブル内で一意である必要があります。
>
> 識別子は英字で始める必要があります（Unicode 名が有効な場合は任意の言語の文字でも可）。全体をバッククォートで囲まない限り、空白や特殊文字は使用できません（例: `My Object`）。
>
> 識別子には予約語を使用できません。
>
> 詳細は識別子の要件と予約語を参照してください。

**2. `<table_name>`**

> テーブルの識別子（名前）を指定します。所属するデータベース内で一意である必要があります。
>
> 識別子は英字で始める必要があります（Unicode 名が有効な場合は任意の言語の文字でも可）。全体をバッククォートで囲まない限り、空白や特殊文字は使用できません（例: `My Object`）。
>
> 識別子には予約語を使用できません。
>
> 詳細は識別子の要件と予約語を参照してください。

**3. `<column_name> [, ...]`**

> インデックスを作成する列を指定します（現在サポートするのは単一列のみ）。列はテーブル内で一意である必要があります。
>
> 識別子は英字で始める必要があります（Unicode 名が有効な場合は任意の言語の文字でも可）。全体をバッククォートで囲まない限り、空白や特殊文字は使用できません（例: `My Object`）。
>
> 識別子には予約語を使用できません。
>
> 詳細は識別子の要件と予約語を参照してください。

## 任意パラメータ

**1. `USING {INVERTED | NGRAM_BF}`**

> インデックスの種類を指定します。現在は **INVERTED**（転置インデックス）と **NGRAM_BF**（NGram BloomFilter インデックス）の二種類に対応します。

**2. `PROPERTIES ("<key>" = "<value>"[ ,  ...])`**

> 一般的な PROPERTIES 形式でインデックスのパラメータを指定します。各インデックスがサポートするパラメータとその意味は、該当するインデックスのドキュメントを参照してください。

**3. `COMMENT '<index_comment>'`**

> 保守しやすいようにインデックスのコメントを指定します。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限  | 対象 | 説明                                                |
| ---------- | ------ | ---------------------------------------------------------- |
| ALTER_PRIV | Table  | CREATE INDEX はテーブルに対する ALTER 操作として扱われます |

## 使用上の注意

- **INVERTED** 転置インデックスは新たに挿入したデータには即座に有効になります。既存データには BUILD INDEX 操作でインデックスを構築する必要があります。
- **NGRAM_BF** NGram BloomFilter インデックスは作成後、すべてのデータに対してバックグラウンドでスキーマ変更を行い、インデックスを構築します。進捗は SHOW ALTER TABLE COLUMN で確認できます。

## 例

- 転置インデックス `index1` を `table1` に作成します

  

  ```sql
  CREATE INDEX index1 ON table1(col1) USING INVERTED;
  ```

- NGram BloomFilter インデックス `index2` を `table1` に作成します

  

  ```sql
  CREATE INDEX index2 ON table1(col1) USING NGRAM_BF PROPERTIES("gram_size"="3", "bf_size"="1024");
  ```


- ANN インデックス `index3` を `table1` のベクトル列 `embedding` に作成します。


  ```sql
  CREATE INDEX index3 ON table1 (`embedding`) USING ANN PROPERTIES(
    "index_type"="hnsw",
    "metric_type"="l2_distance",
    "dim"="128"
  );
    ```
