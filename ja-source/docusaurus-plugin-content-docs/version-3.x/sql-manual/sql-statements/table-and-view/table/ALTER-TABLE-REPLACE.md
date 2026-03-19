---
{
  "title": "ALTER TABLE REPLACE",
  "description": "2つのtableのアトミックな置換。この操作はOLAPTableにのみ適用されます。",
  "language": "ja"
}
---
## デスクリプション

2つのtableのアトミック置換。この操作はOLAPTableにのみ適用されます。

```sql
ALTER TABLE [db.]tbl1 REPLACE WITH TABLE tbl2
[PROPERTIES('swap' = 'true')];
```
Table tbl1 をTable tbl2 で置き換えます。

`swap` パラメータが `true` の場合、置き換え後に `tbl1` という名前のTableのデータは、元の `tbl2` という名前のTableのデータになります。`tbl2` という名前のTableのデータは、元の `tbl1` Tableのデータになります。つまり、2つのTableのデータが交換されます。

`swap` パラメータが `false` の場合、置き換え後に `tbl1` Tableのデータは `tbl2` Tableのデータになります。`tbl2` という名前のTableは削除されます。

#### 原理

replace table機能は、実際には以下の一連の操作をアトミックな操作に変換します。

TableAをTableBで置き換えたい場合で、`swap` が `true` の場合は、以下を実行します：

1. TableBをTableAとしてリネームします。
2. TableAをTableBとしてリネームします。

`swap` が `false` の場合は、以下のように実行します：

1. TableAを削除します。
2. TableBをTableAとしてリネームします。

#### 注意
1. デフォルトの `swap` パラメータは `true` です。つまり、Table置き換え操作は2つのTable間でのデータ交換と同等です。
2. `swap` パラメータを false に設定した場合、置き換えられるTable（TableA）は削除され、復元できません。
3. 置き換え操作は2つのOLAPTable間でのみ実行でき、2つのTableのTable構造が一致しているかどうかはチェックしません。
4. 元の権限設定は変更されません。権限チェックはTable名に基づいて行われるためです。

## 例

1. Tableを削除せずに `tbl1` と `tbl2` をアトミックに交換します（注意：削除する場合、実際には tbl1 を削除して tbl2 を tbl1 にリネームします。）

```sql
ALTER TABLE tbl1 REPLACE WITH TABLE tbl2;
```
または

```sql
ALTER TABLE tbl1 REPLACE WITH TABLE tbl2 PROPERTIES('swap' = 'true');
```
2. `tbl1`と`tbl2`をアトミックスワップし、`tbl2`Tableを削除する（`tbl1`と元の`tbl2`のデータを保持）

```sql
ALTER TABLE tbl1 REPLACE WITH TABLE tbl2 PROPERTIES('swap' = 'false');
```
## キーワード

```text
ALTER, TABLE, REPLACE, ALTER TABLE
```
## ベストプラクティス
1. アトミックオーバーレイ書き込み操作

  場合によっては、ユーザーは特定のTableのデータを書き換えたいが、データを最初に削除してからインポートすると、その間の期間中はデータを閲覧できなくなります。この場合、ユーザーはまず`CREATE TABLE LIKE`文を使用して同じ構造の新しいTableを作成し、新しいデータを新しいTableにインポートし、置換操作を使用して古いTableをアトミックに置き換えることで目標を達成できます。パーティションレベルでのアトミック上書き書き込み操作については、temp partitionドキュメントを参照してください。
