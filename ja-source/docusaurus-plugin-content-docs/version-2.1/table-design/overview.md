---
{
  "title": "概要 | テーブル設計",
  "language": "ja",
  "description": "ユーザーはCREATE TABLE文を使用してDorisでテーブルを作成できます。",
  "sidebar_label": "概要"
}
---
# 概要

## テーブルの作成

ユーザーは[CREATE TABLE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)文を使用してDorisでテーブルを作成できます。また、[CREATE TABLE LIKE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE#create-table--like)や[CREATE TABLE AS](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE#create-table--as-select-also-referred-to-as-ctas)句を使用して、他のテーブルからテーブル定義を派生させることもできます。

## テーブル名

Dorisでは、テーブル名はデフォルトで大文字小文字を区別します。初期クラスター設定時に[lower_case_table_names](../admin-manual/config/fe-config.md)を設定することで、大文字小文字を区別しないようにできます。テーブル名のデフォルト最大長は64バイトですが、[table_name_length_limit](../admin-manual/config/fe-config.md)を設定することで変更できます。この値を高く設定しすぎることは推奨されません。テーブル作成の構文については、[CREATE TABLE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)を参照してください。

## テーブルプロパティ

Dorisでは、CREATE TABLE文で[table properties](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE#properties)を指定できます。これには以下が含まれます：

- **buckets**: テーブル内のデータの分散を決定します。

- **storage_medium**: HDD、SSD、またはリモート共有ストレージの使用など、データのストレージ方法を制御します。

- **replication_num**: 冗長性と信頼性を確保するためのデータレプリカ数を制御します。

- **storage_policy**: コールドデータとホットデータの分離ストレージのマイグレーション戦略を制御します。

これらのプロパティはパーティションに適用されます。つまり、パーティションが作成された後、そのパーティションは独自のプロパティを持つことになります。テーブルプロパティの変更は、将来作成されるパーティションにのみ影響し、既存のパーティションには影響しません。テーブルプロパティの詳細については、[ALTER TABLE PROPERTY](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY)を参照してください。[Dynamic partitions](data-partitioning/dynamic-partitioning.md)では、これらのプロパティを個別に設定できます。

## 注意事項

1. **適切なデータモデルの選択**: データモデルは変更できないため、テーブル作成時に適切な[data model](../table-design/data-model/overview.md)を選択する必要があります。

2. **適切なbucket数の選択**: すでに作成されたパーティションのbucket数は変更できません。[パーティションの置換](../data-operate/delete/table-temp-partition.md)によってbucket数を変更するか、dynamic partitionsでまだ作成されていないパーティションのbucket数を変更できます。

3. **カラム追加操作**: VALUEカラムの追加や削除は軽量な操作で、数秒で完了できます。KEYカラムの追加や削除、またはデータ型の変更は重い操作で、完了時間はデータ量に依存します。大規模なデータセットの場合、KEYカラムの追加や削除、またはデータ型の変更は避けることを推奨します。

4. **ストレージ戦略の最適化**: 階層ストレージを使用して、コールドデータをHDDやS3/HDFSに保存できます。
