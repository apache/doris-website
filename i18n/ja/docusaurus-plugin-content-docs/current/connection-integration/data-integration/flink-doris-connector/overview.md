---
{
    "title": "Flink Doris Connector の概要",
    "language": "ja",
    "description": "Flink Doris Connector による Doris データの読み取り、Doris Binlog を使用した増分読み取り、Doris データの書き込み、Lookup Join、データベース全体の同期に加え、バージョン互換性とインストール方法を説明します。"
}
---

# Flink Doris Connector

[Flink Doris Connector](https://github.com/apache/doris-flink-connector) は、Flink を介して Doris クラスターからデータを読み取り、Doris クラスターにデータを書き込みます。また、[Flink CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/) と連携し、MySQL などの上流データベース全体の同期を簡単に実行できます。

## 機能 {#capabilities}

| 機能 | 説明 | 主な利用シーン |
| --- | --- | --- |
| [Doris からのデータ読み取り](./read.md) | データを FE 経由で転送せず、複数の BE から並列に読み取ります。Thrift プロトコルと Arrow Flight SQL プロトコルに対応しています | Flink ジョブの入力として Doris テーブルを使用する場合、大量データをエクスポートする場合 |
| [Doris Binlog を使用した増分読み取り](./incremental-read.md) | テーブルの行単位の変更（挿入、更新、削除）を継続的に取り込みます。スナップショットからの開始も選択できます。Connector 26.3.0 以降と Doris 5.0.0 以降が必要です | Doris テーブルの変更を下流システムにリアルタイムで同期する場合 |
| [Doris へのデータ書き込み](./write.md) | Flink 内でデータをバッチ化し、Stream Load で書き込みます。ストリーミング書き込み（Checkpoint ベース、Exactly-Once）、バッチ書き込み、S3 TVF を使用した書き込みに対応しています | リアルタイムのデータ取り込み、CDC の変更データの取り込み、列の部分更新 |
| [Lookup Join](./lookup-join.md) | 上流のレコードをバッチ化し、Doris のディメンションテーブルを非同期で照会します | ストリームにディメンションデータを付加する場合 |
| [データベース全体の同期](./cdc-sync.md) | Flink CDC と連携し、一つのコマンドで MySQL、Oracle、PostgreSQL、SQLServer、DB2、MongoDB のデータベース全体を同期します。テーブルの作成と DDL の同期も自動で行います | 業務用データベースを Doris にリアルタイムで同期する場合 |

すべての機能を FlinkSQL から利用できます。読み取りと書き込みは [DataStream API](./datastream-api.md) からも利用できます。接続設定については[接続オプションと TLS](./connection.md)、Doris と Flink の型の対応については[データ型のマッピング](./data-type-mapping.md)を参照してください。

## 動作の仕組み {#how-it-works}

![Flink Doris Connector の読み取りと書き込みの仕組み](/images/next/connection-integration/data-integration/flink-doris-connector.jpg)

- **読み取り**：Connector は FE からクエリプランの Tablet 情報を取得し、複数の BE から直接、並列にデータを読み取ります。データは FE を経由しないため、JDBC で単一の FE ノードを介して逐次的に読み書きする場合のボトルネックを回避できます。詳しくは[読み取りの仕組み](./read.md#how-it-works)を参照してください。
- **書き込み**：データを Flink のメモリ内でバッチ化し、Stream Load によって Doris に一括ロードします。デフォルトでは、書き込みは Flink の Checkpoint に従い、二段階コミットによって Exactly-Once を保証します。Checkpoint に依存しないバッチ書き込みモードも利用できます。詳しくは[書き込みモード](./write.md#write-modes)を参照してください。
- **Lookup Join**：レコードごとに個別のクエリを実行する代わりに、上流のレコードをバッチ化して Doris のディメンションテーブルを非同期で照会します。
- **データベース全体の同期**：Flink CDC で上流データベースの変更を読み取り、Doris Sink で書き込みます。Doris Sink は対象テーブルを作成し、スキーマ変更も自動的に同期します。

## バージョンに関する注意事項 {#version-notes}

| Connector のバージョン | Flink のバージョン      | Doris のバージョン | Java のバージョン | Scala のバージョン |
| --------------------- | ---------------------- | ----------------- | ----------------- | ------------------ |
| 1.0.3                 | 1.11,1.12,1.13,1.14    | 0.15+             | 8                 | 2.11,2.12          |
| 1.1.1                 | 1.14                   | 1.0+              | 8                 | 2.11,2.12          |
| 1.2.1                 | 1.15                   | 1.0+              | 8                 | -                  |
| 1.3.0                 | 1.16                   | 1.0+              | 8                 | -                  |
| 1.4.0                 | 1.15 - 1.17            | 1.0+              | 8                 | -                  |
| 1.5.2                 | 1.15 - 1.18            | 1.0+              | 8                 | -                  |
| 1.6.1                 | 1.15 - 1.19            | 1.0+              | 8                 | -                  |
| 24.0.1                | 1.15 - 1.20            | 1.0+              | 8                 | -                  |
| 24.1.0                | 1.15 - 1.20            | 1.0+              | 8                 | -                  |
| 25.0.0                | 1.15 - 1.20            | 1.0+              | 8                 | -                  |
| 25.1.0                | 1.15 - 1.20            | 1.0+              | 8                 | -                  |
| 26.0.0                | 1.15 - 1.20,2.0 - 2.2  | 1.0+              | 8(1.x),17(2.x)    | -                  |
| 26.1.1                | 1.15 - 1.20,2.0 - 2.2  | 1.0+              | 8(1.x),17(2.x)    | -                  |
| 26.2.0                | 1.15 - 1.20,2.0 - 2.2  | 1.0+              | 8(1.x),17(2.x)    | -                  |
| 26.3.0                | 1.15 - 1.20,2.0 - 2.3  | 1.0+              | 8(1.x),17(2.x)    | -                  |

## インストール {#installation}

Jar パッケージと Maven 依存関係のどちらの方法でもインストールできます。

### Jar パッケージを使用する方法

対応するバージョンの Flink Doris Connector の Jar パッケージを [Doris のダウンロードページ](https://doris.apache.org/download#doris-ecosystem)からダウンロードし、Flink の `classpath` にコピーします。

- **Standalone モード**：Jar ファイルを `lib/` ディレクトリに配置します。
- **Yarn クラスターモード**：Jar ファイルを事前デプロイ用パッケージに含めます。

### Maven 依存関係を使用する方法

プロジェクトの `pom.xml` に次の依存関係を追加します。

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>flink-doris-connector-${flink.version}</artifactId>
    <version>${connector.version}</version>
</dependency>
```

例：

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>flink-doris-connector-1.16</artifactId>
    <version>26.3.0</version>
</dependency>
```

## 次のステップ

- [クイックスタート](./quick-start.md)に従い、FlinkSQL で Doris テーブルの読み取りと書き込みを行います。
- エラーが発生した場合は、まず [FAQ](./faq.md) を確認してください。
