---
{
  "title": "SHOW BUILD INDEX",
  "language": "ja",
  "description": "インデックスビルドタスクのステータスを確認します。"
}
---
## 説明

インデックス構築タスクのステータスを確認します。

## 構文

```sql
SHOW BUILD INDEX [ (FROM | IN) <database_name>
[ where_clause ] [ sort_clause ] [ limit_clause ] ] 
```
ここで：

```sql
where_clause
  : WHERE <output_column_name = value>
```
ここで：

```sql
sort_clause
  :
   ORDER BY <output_column_name>
```
どこで:

```sql
limit_clause
  :
   LIMIT <n>
```
## オプションパラメータ

**`<database_name>`**

> データベースの識別子（名前）を指定します。この識別子はクラスター内で一意である必要があります。
>
> 識別子は文字で始まる必要があり（unicode名前サポートが有効な場合は任意の言語文字）、識別子文字列全体がバッククォートで囲まれていない限り（例：`My Object`）、スペースや特殊文字を含むことはできません。
>
> 識別子は予約キーワードを使用できません。
>
> 詳細については、識別子要件と予約キーワードを参照してください。

**`<WHERE output_column_name = value>`**

> 出力フィルター条件を指定します。output_column_nameは出力フィールドリストに含まれている必要があります。

**`<ORDER BY output_column_name>`**

> 出力ソート列を指定します。output_column_nameは出力フィールドリストに含まれている必要があります。

**`LIMIT <n>`**

> 出力行数の制限を指定します。nは数値である必要があります。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限      | オブジェクト | 備考 |
| :-------- | :----------- | :--- |
| SHOW_PRIV | Database     |      |

## 使用上の注意

- 現在、inverted indexでのみ有効で、bloomfilter indexなどの他のインデックスでは無効です。
- 現在、integrated storage and computing modeでのみ有効で、separated storage and computing modeでは無効です。

## 例

- すべてのインデックス構築タスクを表示

  ```sql
  SHOW BUILD INDEX
  ```
- データベース database1 のインデックス構築タスクを表示する

  ```sql
  SHOW BUILD INDEX FROM database1
  ```
- テーブルtable1のインデックス構築タスクを表示する

  ```sql
  SHOW BUILD INDEX WHERE TableName = 'table1'
  ```
- テーブルtable1のインデックス構築タスクを表示し、JobIdでソートして最初の10行を取得

  ```sql
  SHOW BUILD INDEX WHERE TableName = 'table1' ORDER BY JobId LIMIT 10
  ```
