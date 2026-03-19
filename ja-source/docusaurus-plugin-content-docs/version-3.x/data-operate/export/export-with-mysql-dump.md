---
{
  "title": "MySQL Dumpの使用",
  "description": "Dorisはバージョン0.15以降、mysqldumpツールを通じてデータやtable構造のエクスポートをサポートしています。",
  "language": "ja"
}
---
Dorisはバージョン0.15以降、`mysqldump`ツールを通じてデータやtable構造のエクスポートをサポートしています

## 例

### エクスポート

1. testデータベースのtable1Tableをエクスポート: `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --databases test --tables table1`

2. testデータベースのtable1Table構造をエクスポート: `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --databases test --tables table1 --no-data`

3. test1、test2データベースの全tableをエクスポート: `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --databases test1 test2`

4. 全データベースとtableをエクスポート `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --all-databases`
より多くの使用パラメータについては、`mysqldump`のマニュアルを参照してください

### インポート

`mysqldump`でエクスポートした結果はファイルにリダイレクトでき、その後sourceコマンド`source filename.sql`を通じてDorisにインポートできます

## 注意事項

1. Dorisにはmysqlのtablespaceの概念がないため、`mysqldump`使用時には`--no-tablespaces`パラメータを追加してください

2. mysqldumpを使用したデータとtable構造のエクスポートは、開発・テスト用途やデータ量が少ない場合にのみ使用してください。データ量が多い本番環境では使用しないでください。
