---
{
    "title": "設定ファイルのディレクトリ",
    "language": "ja",
    "description": "FE と BE の設定ファイルは conf/ ディレクトリにあります。デフォルトの fe.conf、be.conf などのファイルを格納するほか、"
}
---

# 設定ファイルのディレクトリ {#config-dir}

FE と BE の設定ファイルは `conf/`にあります。このディレクトリにはデフォルトの fe.conf、be.conf などのファイルに加え、共通の設定ファイルも格納します。

ユーザーがこのディレクトリに設定ファイルを置くと、システムが自動的に読み込みます。

コンピュートとストレージを分離したモードでは、Meta Service は別の `doris_cloud.conf`を使用します。詳しくは [Meta Service の設定](./ms-config.md)を参照してください。

## hdfs-site.xml と hive-site.xml {#hdfs-sitexml-and-hive-sitexml}

Doris の一部の機能では、HDFS 上のデータや Hive metastore へのアクセスが必要です。

各機能に対応するステートメントに、さまざまな HDFS/Hive パラメータを手動で指定できます。

しかし、パラメータの数が多いため、すべてを手動で指定するのは手間がかかります。

そこで、HDFS または Hive の設定ファイル hdfs-site.xml/hive-site.xml を `conf/` ディレクトリに直接配置できます。Doris はこれらの設定ファイルを自動的に読み込みます。

コマンドで指定した設定は、設定ファイル内の対応する設定項目より優先されます。

これにより、少数の設定項目を指定するだけで HDFS/Hive にアクセスできます。
