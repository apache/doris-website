---
{
  "title": "SHOW BUILD INDEX",
  "description": "インデックス構築タスクのステータスを確認します。",
  "language": "ja"
}
---
## 説明

インデックス構築タスクのステータスを確認します。

## 構文

```sql
SHOW BUILD INDEX [ (FROM | IN) <database_name>
[ where_clause ] [ sort_clause ] [ limit_clause ] ] 
```
説明:

```sql
where_clause
  : WHERE <output_column_name = value>
```
ここで:

```sql
sort_clause
  :
   ORDER BY <output_column_name>
```
ここで：

```sql
limit_clause
  :
   LIMIT <n>
```
## オプションパラメータ

**`<database_name>`**

> データベースの識別子（名前）を指定します。この識別子はクラスタ内で一意である必要があります。
>
> 識別子は文字（unicode名前サポートが有効な場合は任意の言語文字）で始まる必要があり、識別子文字列全体がバッククォートで囲まれていない限り（例：`My Object`）、スペースや特殊文字を含めることはできません。
>
> 識別子は予約キーワードを使用できません。
>
> 詳細については、Identifier RequirementsとReserved Keywordsを参照してください。

**`<WHERE output_column_name = value>`**

> 出力フィルター条件を指定します。output_column_nameは出力フィールドリストに含まれている必要があります。

**`<ORDER BY output_column_name>`**

> 出力ソート列を指定します。output_column_nameは出力フィールドリストに含まれている必要があります。

**`LIMIT <n>`**

> 出力行数の制限を指定します。nは数値である必要があります。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、最低限以下の権限を持つ必要があります：

| 権限 | オブジェクト | 備考 |
| :-------- | :------- | :---- |
| SHOW_PRIV | Database |       |

## 使用上の注意

- 現在は転置インデックスでのみ有効で、bloomfilterインデックスなどの他のインデックスでは無効です。
- 現在はストレージとコンピューティング統合モードでのみ有効で、ストレージとコンピューティング分離モードでは無効です。

## 例

- すべてのインデックス構築タスクを表示

  ```sql
  SHOW BUILD INDEX
  ```
- データベース database1 のインデックス構築タスクを表示

  ```sql
  SHOW BUILD INDEX FROM database1
  ```
- Table table1 のビューインデックス構築タスクを表示する

  ```sql
  SHOW BUILD INDEX WHERE TableName = 'table1'
  ```
- Table table1 のビューインデックスビルドタスクを表示し、JobId でソートして最初の10行を取得する

  ```sql
  SHOW BUILD INDEX WHERE TableName = 'table1' ORDER BY JobId LIMIT 10
  ```
