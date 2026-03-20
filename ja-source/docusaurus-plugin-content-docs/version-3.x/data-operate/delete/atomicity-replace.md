---
{
  "title": "Atomic tableの置き換え",
  "description": "Dorisは2つのtable間でのアトミック置換操作をサポートしており、OLAPTableにのみ適用可能です。",
  "language": "ja"
}
---
Dorisは2つのtable間でのアトミック置換操作をサポートしており、OLAPTableにのみ適用可能です。

## 適用シナリオ

ユーザーがtableデータを書き換える必要がある場合がありますが、削除してからデータをインポートすると利用不可能な期間が発生してしまいます。このような場合、ユーザーは`CREATE TABLE LIKE`文を使用して同じ構造の新しいtableを作成し、新しいデータを新しいtableにインポートしてから、古いtableをアトミックに置換することができます。パーティションレベルのアトミック上書き操作については、[temporary partition documentation](../delete/table-temp-partition)を参照してください。

## 構文

```Plain
ALTER TABLE [db.]tbl1 REPLACE WITH TABLE tbl2
[PROPERTIES('swap' = 'true')];
```
Table `tbl1` をTable `tbl2` で置き換えます。

`swap` パラメータが `true` の場合、置き換え後に `tbl1` のデータは元の `tbl2` のデータとなり、`tbl2` のデータは元の `tbl1` のデータとなります。つまり、2つのTableのデータが交換されます。

`swap` パラメータが `false` の場合、置き換え後に `tbl1` のデータは元の `tbl2` のデータとなり、`tbl2` は削除されます。

## 原理

Table置き換え機能は、以下の一連の操作をアトミック操作に変換します。

Table A をTable B で置き換え、`swap` が `true` の場合、操作は以下のとおりです：

1. Table B をTable A にリネームする。
2. Table A をTable B にリネームする。

`swap` が `false` の場合、操作は以下のとおりです：

1. Table A を削除する。
2. Table B をTable A にリネームする。

## 注意事項

- `swap` パラメータが `false` の場合、置き換えられるTable（Table A）は削除され、復旧できません。
- 置き換え操作は2つのOLAPTable間でのみ実行でき、Table構造の一貫性はチェックされません。
- 置き換え操作は元の権限設定を変更しません。権限チェックはTable名に基づいて行われるためです。
