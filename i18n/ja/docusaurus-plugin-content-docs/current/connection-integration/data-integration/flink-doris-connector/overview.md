---
{
    "title": "Flink Doris Connector の概要",
    "language": "ja",
    "description": "Flink Doris Connector の機能、Doris データの読み取り、Doris の変更ログを使った増分読み取り、Doris データの書き込み、Lookup Join、データベース全体の同期に加え、バージョン互換性とインストール方法を説明します。"
}
---

# Flink Doris Connector {#flink-doris-connector}

[Flink Doris Connector](https://github.com/apache/doris-flink-connector) を使用すると、Flink を介して Doris クラスタのデータを読み書きできます。また、[Flink CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/) と連携し、MySQL などの上流データベース全体を簡単に同期できます。

## 機能 {#capabilities}

| 機能 | 説明 | 主な用途 |
| --- | --- | --- |
| [Doris からのデータの読み取り](./read.md) | FE を経由せず、複数の BE から並列に読み取ります。Thrift および Arrow Flight SQL プロトコルに対応しています | Doris テーブルを Flink ジョブの入力として使用する、データを一括エクスポートする |
| [Doris の変更ログを使った増分読み取り](./incremental-read.md) | テーブルの行単位の変更（挿入、更新、削除）を継続的に取得します。スナップショットからの開始も可能です。Connector 26.4.0+ と Doris 5.0.0+ が必要です | Doris テーブルの変更を下流のシステムへリアルタイムで同期する |
| [Doris へのデータの書き込み](./write.md) | Flink でデータをバッチにまとめ、Stream Load を介して書き込みます。ストリーミング書き込み（Checkpoint ベース、Exactly-Once）、バッチ書き込み、S3 TVF による書き込みに対応しています | リアルタイムのデータ取り込み、CDC による変更の取り込み、列の部分更新 |
| [Lookup Join](./lookup-join.md) | 上流のレコードをバッチにまとめ、Doris のディメンションテーブルに非同期でクエリを実行します | ストリームにディメンションデータを付加する |
| [データベース全体の同期](./cdc-sync.md) | Flink CDC と連携し、MySQL、Oracle、PostgreSQL、SQLServer、DB2、MongoDB のデータベース全体を単一のコマンドで同期します。テーブルの作成と DDL の同期も自動で行います | 業務データベースを Doris にリアルタイムで同期する |

すべての機能を FlinkSQL から利用できます。読み取りと書き込みは [DataStream API](./datastream-api.md) からも利用できます。接続設定については[接続オプションと TLS](./connection.md)、Doris と Flink のデータ型の対応については[データ型のマッピング](./data-type-mapping.md)を参照してください。

## 仕組み {#how-it-works}

![FlinkConnectorPrinciples-JDBC-Doris](/images/next/connection-integration/data-integration/flink-doris-connector.jpg)

- **読み取り**: Connector は FE からクエリプランの Tablet 情報を取得し、BE から直接、並列にデータを読み取ります。データは FE を経由しないため、JDBC を介して単一の FE ノードで読み書きを直列に処理する際のボトルネックを回避できます。詳しくは[読み取りの仕組み](./read.md#how-it-works)を参照してください。
- **書き込み**: Flink のメモリ上でデータをバッチにまとめ、Stream Load を介して Doris に一括データロードします。デフォルトでは、書き込みは Flink の Checkpoint に従い、二相コミットによって Exactly-Once を保証します。Checkpoint に依存しないバッチ書き込みモードも利用できます。詳しくは[書き込みモード](./write.md#write-modes)を参照してください。
- **Lookup Join**: レコードごとにポイントクエリを実行する代わりに、上流のレコードをバッチにまとめ、Doris のディメンションテーブルに非同期でクエリを実行します。
- **データベース全体の同期**: Flink CDC で上流データベースの変更を読み取り、Doris Sink を介して書き込みます。Doris Sink は対象テーブルの作成と Schema Changes の同期を自動で行います。

## バージョンについて {#version-notes}

| Connector のバージョン | Flink のバージョン    | Doris のバージョン | Java のバージョン | Scala のバージョン |
| ---------------------- | --------------------- | ------------------ | ----------------- | ------------------ |
| 1.0.3                  | 1.11,1.12,1.13,1.14   | 0.15+              | 8                 | 2.11,2.12          |
| 1.1.1                  | 1.14                  | 1.0+               | 8                 | 2.11,2.12          |
| 1.2.1                  | 1.15                  | 1.0+               | 8                 | -                  |
| 1.3.0                  | 1.16                  | 1.0+               | 8                 | -                  |
| 1.4.0                  | 1.15 - 1.17           | 1.0+               | 8                 | -                  |
| 1.5.2                  | 1.15 - 1.18           | 1.0+               | 8                 | -                  |
| 1.6.1                  | 1.15 - 1.19           | 1.0+               | 8                 | -                  |
| 24.0.1                 | 1.15 - 1.20           | 1.0+               | 8                 | -                  |
| 24.1.0                 | 1.15 - 1.20           | 1.0+               | 8                 | -                  |
| 25.0.0                 | 1.15 - 1.20           | 1.0+               | 8                 | -                  |
| 25.1.0                 | 1.15 - 1.20           | 1.0+               | 8                 | -                  |
| 26.0.0                 | 1.15 - 1.20,2.0 - 2.2 | 1.0+               | 8(1.x),17(2.x)    | -                  |
| 26.1.1                 | 1.15 - 1.20,2.0 - 2.2 | 1.0+               | 8(1.x),17(2.x)    | -                  |
| 26.2.0                 | 1.15 - 1.20,2.0 - 2.2 | 1.0+               | 8(1.x),17(2.x)    | -                  |
| 26.3.0                 | 1.15 - 1.20,2.0 - 2.3 | 1.0+               | 8(1.x),17(2.x)    | -                  |

## インストール {#installation}

Jar パッケージと Maven 依存関係のどちらの方法も利用できます。

### Jar パッケージを使用する方法 {#jar-package-method}

[Doris のダウンロードページ](https://doris.apache.org/download#doris-ecosystem)から対応するバージョンの Flink Doris Connector の Jar パッケージをダウンロードし、Flink の `classpath` にコピーします。

- **Standalone モード**: Jar ファイルを `lib/` ディレクトリに配置します。
- **Yarn クラスタモード**: Jar ファイルを事前デプロイ用パッケージに含めます。

### Maven 依存関係を使用する方法 {#maven-dependency-method}

プロジェクトの `pom.xml` に次の依存関係を追加します。

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>flink-doris-connector-${flink.version}</artifactId>
    <version>${connector.version}</version>
</dependency>
```

例:

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>flink-doris-connector-1.16</artifactId>
    <version>26.3.0</version>
</dependency>
```

## 次のステップ {#next-steps}

- [クイックスタート](./quick-start.md)に従い、FlinkSQL で Doris テーブルを読み書きします。
- エラーが発生した場合は、まず [FAQ](./faq.md) を確認してください。
