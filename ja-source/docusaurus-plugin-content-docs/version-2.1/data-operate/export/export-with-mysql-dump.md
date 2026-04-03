---
{
  "title": "MySQL Dumpの使用",
  "language": "ja",
  "description": "Dorisはバージョン0.15以降、mysqldumpツールを通じてデータやテーブル構造のエクスポートをサポートしています"
}
---
Dorisはバージョン0.15以降、`mysqldump`ツールを通じたデータまたはテーブル構造のエクスポートをサポートしています

## Examples

### Export

1. testデータベースのtable1テーブルをエクスポート: `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --databases test --tables table1`

2. testデータベースのtable1テーブル構造をエクスポート: `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --databases test --tables table1 --no-data`

3. test1、test2データベースの全テーブルをエクスポート: `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --databases test1 test2`

4. 全データベースおよびテーブルをエクスポート `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --all-databases`
その他の使用パラメータについては、`mysqldump`のマニュアルを参照してください

### Import

`mysqldump`によってエクスポートされた結果はファイルにリダイレクトでき、その後sourceコマンド`source filename.sql`を通じてDorisにインポートできます

## Notice

1. Dorisにはmysqlのテーブルスペースの概念がないため、`mysqldump`を使用する際は`--no-tablespaces`パラメータを追加してください

2. mysqldumpを使用したデータとテーブル構造のエクスポートは、開発およびテスト用、またはデータ量が少ない場合のみ使用してください。大量のデータがある本番環境では使用しないでください。
