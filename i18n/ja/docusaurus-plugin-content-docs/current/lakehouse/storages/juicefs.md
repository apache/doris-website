---
{
    "title": "JuiceFS | ストレージ",
    "language": "ja",
    "description": "このドキュメントでは、JuiceFS へのアクセスに必要なパラメータを説明します。これらのパラメータは、以下に適用されます。",
    "sidebar_label": "JuiceFS"
}
---

# JuiceFS

:::tip 対応開始バージョン
Doris 4.0.2
:::

[JuiceFS](https://juicefs.com) は、クラウド向けに設計されたオープンソースの高性能な分散ファイルシステムです。HDFS API と完全に互換性があります。Doris は `jfs://` スキームを HDFS 互換として扱うため、HDFS と同じ方法で JuiceFS に保存されたデータにアクセスできます。

このドキュメントでは、JuiceFS へのアクセスに必要なパラメータを説明します。これらのパラメータは、以下に適用されます。

* Catalog のプロパティ
* テーブル値関数のプロパティ
* Broker Load のプロパティ
* エクスポートのプロパティ
* Outfile のプロパティ

## 前提条件

JuiceFS へのアクセスには、`juicefs-hadoop` クライアント JAR が必要です。Doris 4.0.2 以降、ビルドシステムがこの JAR を自動的にダウンロードしてパッケージに含めます。JAR の配置先は以下のとおりです。

- FE: `fe/lib/juicefs/`
- BE: `be/lib/java_extensions/juicefs/`

手動でデプロイする場合は、`juicefs-hadoop-<version>.jar` を [Maven Central](https://repo1.maven.org/maven2/io/juicefs/juicefs-hadoop/) からダウンロードし、上記のディレクトリに配置してください。

## パラメータの概要

JuiceFS は HDFS と互換性があるため、認証パラメータも HDFS と共通です。さらに、次の JuiceFS 固有のパラメータを使用できます。

| プロパティ名 | 説明 | 必須 |
| --- | --- | --- |
| fs.defaultFS | デフォルトのファイルシステム URI。例: `jfs://cluster`。 | はい |
| fs.jfs.impl | Hadoop FileSystem の実装クラス。`io.juicefs.JuiceFileSystem` に設定する必要があります。 | はい |
| juicefs.\<cluster\>.meta | JuiceFS メタデータエンジンのエンドポイント。例: `redis://127.0.0.1:6379/1` または `mysql://user:pwd@(host:port)/db`。`<cluster>` は、`fs.defaultFS` URI に指定したクラスター名に置き換えてください。 | はい |

HDFS の認証パラメータ（Simple または Kerberos）については、[HDFS](./hdfs.md) のドキュメントを参照してください。

`juicefs.` で始まるすべてのプロパティは、基盤となる JuiceFS Hadoop クライアントにそのまま渡されます。

## 設定例

### Hive Metastore を使用する Catalog

```sql
CREATE CATALOG jfs_hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://<hms_host>:9083',
    'fs.defaultFS' = 'jfs://cluster',
    'fs.jfs.impl' = 'io.juicefs.JuiceFileSystem',
    'juicefs.cluster.meta' = 'redis://127.0.0.1:6379/1',
    'hadoop.username' = 'doris'
);
```

### Broker Load

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("jfs://cluster/path/to/data/*")
    INTO TABLE `my_table`
)
WITH BROKER
(
    "fs.defaultFS" = "jfs://cluster",
    "fs.jfs.impl" = "io.juicefs.JuiceFileSystem",
    "juicefs.cluster.meta" = "redis://127.0.0.1:6379/1",
    "hadoop.username" = "doris"
);
```

### テーブル値関数

```sql
SELECT * FROM TABLE(
    "uri" = "jfs://cluster/path/to/file.parquet",
    "format" = "parquet",
    "fs.jfs.impl" = "io.juicefs.JuiceFileSystem",
    "juicefs.cluster.meta" = "redis://127.0.0.1:6379/1"
);
```

## ベストプラクティス

* **すべて**の FE ノードと BE ノードに `juicefs-hadoop` JAR を配置してください。
* `juicefs.<cluster>.meta` プロパティのクラスター名は、`jfs://` URI のクラスター名と一致させる必要があります。たとえば、`fs.defaultFS = jfs://mycluster` の場合、メタデータのプロパティは `juicefs.mycluster.meta` にします。
* JuiceFS は複数のメタデータエンジン（Redis、MySQL、TiKV、SQLite など）をサポートします。規模と可用性の要件に応じて選択してください。
* Kerberos 認証、HA nameservice の設定、Hadoop の設定ファイルなど、HDFS の設定はすべて JuiceFS と互換性があります。
