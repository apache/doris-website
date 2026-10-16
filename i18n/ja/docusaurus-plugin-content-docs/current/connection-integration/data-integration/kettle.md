---
{
    "title": "Kettle",
    "language": "ja",
    "description": "Kettle に Kettle Doris Plugin をインストールして設定し、Stream Load を使用して外部データソースから Apache Doris にデータを同期する方法を説明します。",
    "keywords": [
        "Kettle Doris Plugin",
        "Kettle から Doris へのインポート",
        "Stream Load",
        "Doris へのデータ同期"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenario: Data integration / Writing external data sources to Doris through Kettle -->

Kettle Doris Plugin は、Kettle でほかのデータソースから Doris にデータを書き込むためのプラグインです。書き込みには Stream Load を使用します。

このプラグインは Doris の Stream Load 機能を使用してデータを取り込むため、Kettle サービスと併用する必要があります。すでに Kettle で ETL ジョブを管理しており、Kettle がサポートするデータソースから Doris に書き込みたい場合は、このプラグインを使用してデータを同期できます。

## Kettle について

[Kettle](https://pentaho.com/) は、Pentaho が当初開発したオープンソースの ETL（抽出、変換、ロード）ツールです。Pentaho 製品群の中核となるコンポーネントの一つで、主にデータ連携とデータ処理に使用されます。さまざまなソースからデータを抽出し、クレンジングや変換を行って、ターゲットシステムにロードできます。

詳しくは、[Pentaho の公式サイト](https://pentaho.com/)を参照してください。

## 作業の流れ

Kettle Doris Plugin を使用して Doris にデータを書き込む手順は次のとおりです。

| 手順 | 目的 | 操作 |
| --- | --- | --- |
| 1 | Kettle 環境を準備する | Kettle をダウンロードして展開するか、自分でビルドします。 |
| 2 | Doris プラグインを準備する | Doris のソースコードで Kettle Doris Plugin をビルドします。 |
| 3 | プラグインをインストールする | ビルドした `doris-stream-loader` プラグインを Kettle の `plugins` ディレクトリにコピーします。 |
| 4 | ジョブを作成する | Kettle で Doris Stream Loader を選択し、Doris への接続とインポートのパラメータを設定します。 |
| 5 | 同期を実行する | ジョブを開始し、Stream Load を使用して Doris にデータを書き込みます。 |

## Kettle 環境の準備

### Kettle のダウンロードと起動

1. [Kettle のダウンロードページ](https://pentaho.com/download/#download-pentaho)にアクセスして Kettle をダウンロードします。
2. ダウンロードしたパッケージを展開します。
3. `spoon.sh` を実行して Kettle を起動します。

### Kettle を自分でビルドする

Kettle を自分でビルドする場合は、[Pentaho Kettle のビルド手順](https://github.com/pentaho/pentaho-kettle?tab=readme-ov-file#how-to-build)を参照してください。

## Kettle Doris Plugin のビルドとインストール

### プラグインのビルド

Doris のソースコードディレクトリから `extension/kettle` に移動し、プラグインをビルドします。

```shell
cd doris/extension/kettle
mvn clean package -DskipTests
```

### プラグインのインストール

ビルドが完了したら、プラグインのパッケージを展開し、`doris-stream-loader` を Kettle の `plugins` ディレクトリにコピーします。

```shell
cd assemblies/plugin/target
unzip doris-stream-loader-plugins-9.4.0.0-343.zip
cp -r doris-stream-loader ${KETTLE_HOME}/plugins/
```

## ジョブの作成と実行

### Doris Stream Loader ジョブの作成

Kettle の Bulk loading にある Doris Stream Loader を選択し、ジョブを作成します。

![Kettle で Doris Stream Loader ジョブを作成する](https://raw.githubusercontent.com/apache/doris/refs/heads/master/extension/kettle/images/create.png)

### ジョブの実行

Start をクリックしてジョブを実行し、データを同期します。

![Kettle で Doris Stream Loader ジョブを実行する](https://raw.githubusercontent.com/apache/doris/refs/heads/master/extension/kettle/images/running.png)

## パラメータ

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Kettle Doris Plugin job configuration -->

次の表に、Doris Stream Loader ジョブの主な設定項目を示します。

| パラメータ | デフォルト値 | 必須 | 説明 |
| --- | --- | --- | --- |
| `Step name` | -- | Y | ステップの名前。 |
| `fenodes` | -- | Y | Doris FE の HTTP アドレス。複数のアドレスをカンマで区切って指定できます。 |
| Database | -- | Y | 書き込み先となる Doris のデータベース。 |
| Target table | -- | Y | 書き込み先となる Doris のテーブル。 |
| Username | -- | Y | Doris にアクセスするためのユーザー名。 |
| Password | -- | N | Doris にアクセスするためのパスワード。 |
| Maximum rows per import | 10000 | N | インポートごとの行数の上限。 |
| Maximum bytes per import | 10485760 (10 MB) | N | インポートごとのサイズの上限（バイト単位）。 |
| Import retry count | 3 | N | インポートに失敗した後に再試行する回数。 |
| Stream Load properties | -- | N | Stream Load のリクエストヘッダー。 |
| Delete mode | N | N | 削除モードを有効にするかどうか。デフォルトでは、Stream Load は挿入操作を実行します。削除モードを有効にすると、Stream Load によるすべての書き込みが削除操作になります。 |

Stream Load のその他のパラメータについては、[Stream Load のドキュメント](../../data-operate/import/import-way/stream-load-manual.md)を参照してください。

## よくある質問

### Kettle Doris Plugin を単独で使用できますか？

いいえ。Kettle Doris Plugin は Kettle サービスと併用する必要があります。

### `fenodes` には何を指定すればよいですか？

`fenodes` には Doris FE の HTTP アドレスを指定します。FE アドレスが複数ある場合は、カンマで区切ってください。

### 削除モードは書き込みにどのような影響がありますか？

デフォルトでは、Stream Load は挿入操作を実行します。削除モードを有効にすると、Stream Load によるすべての書き込みが削除操作になります。
