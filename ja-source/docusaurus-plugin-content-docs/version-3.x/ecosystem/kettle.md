---
{
  "title": "Kettle Doris Plugin",
  "language": "ja",
  "description": "Kettle Doris PluginはKettle内でStream Loadを通じて他のデータソースからDorisにデータを書き込むために使用されます。"
}
---
## Kettle Doris Plugin

[Kettle](https://pentaho.com/) Doris Pluginは、KettleでStream Loadを通じて他のデータソースからDorisにデータを書き込むために使用されます。

このプラグインはDorisのStream Load機能を使用してデータをインポートします。Kettleサービスと組み合わせて使用する必要があります。

## Kettleについて

KettleはオープンソースのETL (Extract, Transform, Load) ツールで、最初にPentahoによって開発されました。KettleはPentaho製品スイートのコアコンポーネントの一つで、主にデータ統合とデータ処理に使用され、様々なソースからデータを抽出し、データをクリーニング・変換し、ターゲットシステムにロードするタスクを簡単に完了できます。

詳細については、次を参照してください: `https://pentaho.com/`

## ユーザーマニュアル

### Kettleのダウンロードとインストール
Kettleダウンロードアドレス: https://pentaho.com/download/#download-pentaho
ダウンロード後、解凍してspoon.shを実行してkettleを起動します
自分でコンパイルすることもできます。[Compilation Chapter](https://github.com/pentaho/pentaho-kettle?tab=readme-ov-file#how-to-build)を参照してください

### Kettle Doris Pluginのコンパイル

```shell
cd doris/extension/kettle
mvn clean package -DskipTests
```
コンパイル後、プラグインパッケージを解凍し、kettleのpluginsディレクトリにコピーしてください

```shell
cd assemblies/plugin/target
unzip doris-stream-loader-plugins-9.4.0.0-343.zip
cp -r doris-stream-loader ${KETTLE_HOME}/plugins/
mvn clean package -DskipTests
```
### ジョブを作成する
KettleのバッチローディングでDoris Stream Loaderを見つけてジョブを作成します
![create_zh.png](https://raw.githubusercontent.com/apache/doris/refs/heads/master/extension/kettle/images/create.png)

Start Running the Jobをクリックしてデータ同期を完了します
![running_zh.png](https://raw.githubusercontent.com/apache/doris/refs/heads/master/extension/kettle/images/running.png)

### パラメータ説明

| Key | Default Value | Required | Comment |
|--------------|----------------| -------- |--------------------------------|
| Step name | -- | Y | ステップ名 |
| fenodes | -- | Y | Doris FE httpアドレス、複数のアドレスをサポート、カンマで区切る |
| Database | -- | Y | Doris書き込みデータベース |
| Target table | -- | Y | Dorisの書き込みテーブル |
| Username | -- | Y | Dorisにアクセスするユーザー名 |
| Password | -- | N | Dorisにアクセスするパスワード |
| Maximum number of rows for a single import | 10000 | N | 単一インポートの最大行数 |
| Maximum bytes for a single import | 10485760 (10MB) | N | 単一インポートの最大バイトサイズ |
| Number of import retries | 3 | N | インポート失敗後のリトライ回数 |
| StreamLoad properties | -- | N | Streamloadリクエストヘッダー |
| Delete Mode | N | N | 削除モードを有効にするかどうか。デフォルトでは、Stream Loadは挿入操作を実行します。削除モードを有効にすると、すべてのStream Load書き込みが削除操作になります。 |
