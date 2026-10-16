---
{
    "title": "SHOW BUILD INDEX",
    "language": "ja",
    "description": "インデックス構築タスクの状態を確認します。"
}
---

## 説明

インデックス構築タスクの状態を確認します。

## 構文

```sql
SHOW BUILD INDEX [ (FROM | IN) <database_name>
[ where_clause ] [ sort_clause ] [ limit_clause ] ] 
```

各要素は次のとおりです。

```sql
where_clause
  : WHERE <output_column_name = value>
```

各要素は次のとおりです。

```sql
sort_clause
  :
   ORDER BY <output_column_name>
```

各要素は次のとおりです。

```sql
limit_clause
  :
   LIMIT <n>
```
## 任意パラメータ

**`<database_name>`**

> データベースの識別子（名前）を指定します。クラスター内で一意である必要があります。
>
> 識別子は英字で始める必要があります（Unicode 名が有効な場合は任意の言語の文字でも可）。全体をバッククォートで囲まない限り、空白や特殊文字は使用できません（例: `My Object`）。
>
> 識別子には予約語を使用できません。
>
> 詳細は「識別子の要件と予約語」を参照してください。


**`<WHERE output_column_name = value>`**

> 出力のフィルター条件を指定します。output_column_name は出力フィールド一覧に含まれる必要があります。

**`<ORDER BY output_column_name>`**

> 出力の並べ替え列を指定します。output_column_name は出力フィールド一覧に含まれる必要があります。

**`LIMIT <n>`**

> 出力行数の上限を指定します。n には数値を指定する必要があります。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象   | 説明 |
| :-------- | :------- | :---- |
| SHOW_PRIV | Database |       |

## 使用上の注意

- 現在は転置インデックスのみで有効です。BloomFilter インデックスなどには適用できません。
- 現在はストレージとコンピュートの一体型モードでのみ有効で、分離型モードでは使用できません。

## 例

- すべてのインデックス構築タスクを表示します

  ```sql
  SHOW BUILD INDEX
  ```

- データベース database1 のインデックス構築タスクを表示します

  ```sql
  SHOW BUILD INDEX FROM database1
  ```

- テーブル table1 のインデックス構築タスクを表示します

  ```sql
  SHOW BUILD INDEX WHERE TableName = 'table1'
  ```

- テーブル table1 のインデックス構築タスクを JobId 順に並べ、先頭の 10 行を表示します

  ```sql
  SHOW BUILD INDEX WHERE TableName = 'table1' ORDER BY JobId LIMIT 10
  ```