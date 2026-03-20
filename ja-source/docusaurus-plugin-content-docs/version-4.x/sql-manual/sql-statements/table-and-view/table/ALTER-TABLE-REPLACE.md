---
{
  "title": "ALTER TABLE REPLACE",
  "description": "2つのtableのアトミックな置換。この操作はOLAPTableにのみ適用されます。",
  "language": "ja"
}
---
## デスクリプション

2つのtableのアトミックな置換。この操作はOLAPTableにのみ適用されます。

```sql
ALTER TABLE [db.]tbl1 REPLACE WITH TABLE tbl2
[PROPERTIES('swap' = 'true')];
```
Table tbl1 をTable tbl2 で置き換えます。

`swap` パラメータが `true` の場合、置き換え後に `tbl1` という名前のTable内のデータは、元の `tbl2` という名前のTable内のデータになります。`tbl2` という名前のTable内のデータは、元の `tbl1` Table内のデータになります。つまり、2つのTableのデータが交換されます。

`swap` パラメータが `false` の場合、置き換え後に `tbl1` Table内のデータは `tbl2` Table内のデータになります。`tbl2` という名前のTableは削除されます。

#### 原理

replace table 機能は、実際には以下の一連の操作をアトミック操作に変換します。

Table A をTable B で置き換えたく、`swap` が `true` の場合は、以下を実行します：

1. Table B をTable A として名前変更する。
2. Table A をTable B として名前変更する。

`swap` が `false` の場合は、以下のように実行します：

1. Table A を削除する。
2. Table B をTable A として名前変更する。

#### 注意
1. デフォルトの `swap` パラメータは `true` です。つまり、Table置き換え操作は2つのTable間でのデータ交換と同等です。
2. `swap` パラメータが false に設定されている場合、置き換えられるTable（Table A）は削除され、復元できません。
3. 置き換え操作は2つの OLAP Table間でのみ発生でき、2つのTableのTable構造が一致しているかどうかはチェックしません。
4. 元の権限設定は変更されません。権限チェックはTable名に基づいて行われるためです。

## 例

1. Tableを削除することなく `tbl1` と `tbl2` をアトミックに交換する（注意：削除する場合、実際には tbl1 を削除し、tbl2 を tbl1 に名前変更します。）

```sql
ALTER TABLE tbl1 REPLACE WITH TABLE tbl2;
```
または

```sql
ALTER TABLE tbl1 REPLACE WITH TABLE tbl2 PROPERTIES('swap' = 'true');
```
2. `tbl1`と`tbl2`をアトミックにスワップし、`tbl2`Tableを削除する（`tbl1`と元の`tbl2`のデータを保持する）

```sql
ALTER TABLE tbl1 REPLACE WITH TABLE tbl2 PROPERTIES('swap' = 'false');
```
## キーワード

```text
ALTER, TABLE, REPLACE, ALTER TABLE
```
## ベストプラクティス
1. アトミックオーバーレイ書き込み操作

  場合によっては、ユーザーは特定のTableのデータを書き換えたいが、最初にデータを削除してからインポートすると、その間の期間でデータを表示できなくなります。この場合、ユーザーはまず`CREATE TABLE LIKE`文を使用して同じ構造の新しいTableを作成し、新しいデータを新しいTableにインポートし、置換操作を使用して古いTableをアトミックに置き換えて目標を達成できます。パーティションレベルでのアトミック上書き書き込み操作については、[temp partition documentation](../../../../data-operate/delete/table-temp-partition)を参照してください。
