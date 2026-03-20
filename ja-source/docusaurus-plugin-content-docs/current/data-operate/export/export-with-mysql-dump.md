---
{
  "title": "MySQL Dumpの使用",
  "language": "ja",
  "description": "Dorisはバージョン0.15以降、mysqldumpツールを通じたデータやテーブル構造のエクスポートをサポートしています。"
}
---
Dorisはバージョン0.15以降、`mysqldump`ツールを通じてデータやテーブル構造のエクスポートをサポートしています

## 例

### エクスポート

1. testデータベースのtable1テーブルをエクスポート: `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --databases test --tables table1`

2. testデータベースのtable1テーブル構造をエクスポート: `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --databases test --tables table1 --no-data`

3. test1、test2データベースの全テーブルをエクスポート: `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --databases test1 test2`

4. 全データベースと全テーブルをエクスポート `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --all-databases`
より多くの使用パラメータについては、`mysqldump`のマニュアルを参照してください

### インポート

`mysqldump`によってエクスポートされた結果はファイルにリダイレクトでき、その後sourceコマンド`source filename.sql`を通じてDorisにインポートできます

## 注意事項

1. Dorisにはmysqlのtablespaceという概念がないため、`mysqldump`を使用する際は`--no-tablespaces`パラメータを追加してください

2. mysqldumpを使用したデータとテーブル構造のエクスポートは、開発・テストまたはデータ量が少ない場合にのみ使用してください。大量のデータがある本番環境では使用しないでください。
