---
{
    "title": "HDFS | ストレージ",
    "language": "ja",
    "description": "このドキュメントでは、HDFS へのアクセスに必要なパラメータについて説明します。これらのパラメータは、以下に適用されます。",
    "sidebar_label": "HDFS"
}
---

# HDFS {#hdfs}

このドキュメントでは、HDFS へのアクセスに必要なパラメータについて説明します。これらのパラメータは、以下に適用されます。

* Catalog のプロパティ
* Table Valued Function のプロパティ
* Broker Load のプロパティ
* Export のプロパティ
* Outfile のプロパティ
* バックアップとリストア

## パラメータの概要 {#parameter-overview}

|プロパティ名 | 旧名称 | 説明 | デフォルト値 | 必須 |
| --- | --- | --- | --- | --- |
| hdfs.authentication.type | hadoop.security.authentication | 認証方式を指定します。指定できる値は kerberos または simple です。kerberos を選択すると、システムは Kerberos 認証を使用して HDFS と通信します。simple を選択すると認証を使用せず、認証なしで利用できる HDFS クラスターに適しています。kerberos を選択する場合は、対応する principal と keytab の設定が必要です。 | simple | いいえ |
| hdfs.authentication.kerberos.principal | hadoop.kerberos.principal | 認証方式が kerberos の場合、Kerberos principal を指定します。Kerberos principal は一意の識別文字列で、通常はサービス名、ホスト名、ドメイン名を含みます。 | - | いいえ |
| hdfs.authentication.kerberos.keytab | hadoop.kerberos.keytab | Kerberos 認証に使用する keytab ファイルのパスを指定します。keytab ファイルには暗号化された認証情報が保存されており、ユーザーがパスワードを手動で入力しなくても、システムが自動的に認証できます。 | - | いいえ |
| hdfs.impersonation.enabled | - | true の場合、HDFS のユーザー代理機能を有効にします。core-site.xml で設定したプロキシユーザーが、Doris にログインしたユーザーに代わって HDFS を操作します。 | 現在は未サポート | - |
| hadoop.username | - | 認証方式が simple の場合、HDFS へのアクセスに使用するユーザーです。デフォルトでは、Doris プロセスを実行している Linux システムユーザーが使用されます。 | - | - |
| hadoop.config.resources | - | 相対パスを使用して HDFS 設定ファイルのディレクトリを指定します。ディレクトリには hdfs-site.xml と core-site.xml が必要です。デフォルトのディレクトリは、FE/BE のデプロイディレクトリ内の /plugins/hadoop/conf/ です。fe.conf/be.conf の hadoop_config_dir を変更すると、デフォルトのパスを変更できます。すべての FE ノードと BE ノードで同じ相対パスを設定する必要があります。例：hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml | - | - |
| dfs.nameservices | - | HDFS 高可用性クラスターのパラメータを手動で設定します。hadoop.config.resources を設定している場合、パラメータは hdfs-site.xml から自動的に読み取られます。dfs.ha.namenodes.your-nameservice、dfs.namenode.rpc-address.your-nameservice.nn1、dfs.client.failover.proxy.provider などのパラメータと併せて使用する必要があります。 | - | - |

> 3.1 より前のバージョンでは、旧名称を使用してください。

## 認証の設定 {#authentication-configuration}

HDFS は次の認証方式をサポートしています。

* Simple
* Kerberos

### Simple 認証 {#simple-authentication}

Simple 認証は、Kerberos が有効になっていない HDFS クラスターに適しています。

Simple 認証では、次のパラメータを設定するか、デフォルト値をそのまま使用できます。

```sql
"hdfs.authentication.type" = "simple"
```

Simple 認証モードでは、`hadoop.username` パラメータでユーザー名を指定できます。指定しない場合は、現在のプロセスのユーザー名が使用されます。

例：

ユーザー名 `lakers` で HDFS にアクセスする場合

```sql
"hdfs.authentication.type" = "simple",
"hadoop.username" = "lakers"
```

デフォルトのシステムユーザーで HDFS にアクセスする場合

```sql
"hdfs.authentication.type" = "simple"
```

### Kerberos 認証 {#kerberos-authentication}

Kerberos 認証は、Kerberos が有効になっている HDFS クラスターに適しています。

Kerberos 認証では、次のパラメータを設定する必要があります。

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "<your_principal>",
"hdfs.authentication.kerberos.keytab" = "<your_keytab>"
```

Kerberos 認証モードでは、Kerberos principal と keytab ファイルのパスを設定する必要があります。

Doris は、`hdfs.authentication.kerberos.principal` プロパティで指定された ID を使用して HDFS にアクセスし、keytab で指定されたファイルを使用して principal を認証します。

> 注意：
>
> keytab ファイルは、すべての FE ノードと BE ノードの同じパスに配置する必要があります。また、Doris プロセスを実行するユーザーに、そのファイルの読み取り権限が必要です。

例：

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "hdfs/hadoop@HADOOP.COM",
"hdfs.authentication.kerberos.keytab" = "/etc/security/keytabs/hdfs.keytab",
```
Kerberos の設定でよくある問題の対処方法については、[Kerberos に関する FAQ](../best-practices/kerberos.md/#faq)を参照してください。

## HDFS HA の設定 {#hdfs-ha-configuration}

HDFS HA モードが有効な場合は、`dfs.nameservices` に関連するパラメータを設定する必要があります。

```sql
'dfs.nameservices' = '<your-nameservice>',
'dfs.ha.namenodes.<your-nameservice>' = '<nn1>,<nn2>',
'dfs.namenode.rpc-address.<your-nameservice>.<nn1>' = '<nn1_host:port>',
'dfs.namenode.rpc-address.<your-nameservice>.<nn2>' = '<nn2_host:port>',
'dfs.client.failover.proxy.provider.<your-nameservice>' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
```

例：

```sql
'dfs.nameservices' = 'nameservice1',
'dfs.ha.namenodes.nameservice1' = 'nn1,nn2',
'dfs.namenode.rpc-address.nameservice1.nn1' = '172.21.0.2:8088',
'dfs.namenode.rpc-address.nameservice1.nn2' = '172.21.0.3:8088',
'dfs.client.failover.proxy.provider.nameservice1' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
```

4.1.5 以降では、`hadoop.config.resources` に指定するコンマ区切りの XML パスに、親ディレクトリを示す `..` セグメントを含めることはできません。フォワードスラッシュとバックスラッシュの両方が区切り文字としてチェックされます。`conf/core-site.xml,conf/hdfs-site.xml` のような通常のパスを使用し、親ディレクトリへのアクセスに `../` を使用しないでください。

## 設定ファイル {#configuration-files}

> この機能はバージョン 3.1.0 以降でサポートされています。

Doris では、`hadoop.config.resources` パラメータを使用して HDFS 設定ファイルのディレクトリを指定できます。

設定ファイルのディレクトリには、`hdfs-site.xml` と `core-site.xml` が必要です。デフォルトのディレクトリは、FE/BE のデプロイディレクトリ内の `/plugins/hadoop_conf/` です。すべての FE ノードと BE ノードで同じ相対パスを設定する必要があります。

設定ファイルにこのドキュメントで前述したパラメータが含まれている場合は、ユーザーが明示的に設定したパラメータが優先されます。設定ファイルは複数指定でき、`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml` のようにコンマで区切ります。

**例：**

```sql
-- Multiple configuration files
'hadoop.config.resources'='hdfs-cluster-1/core-site.xml,hdfs-cluster-1/hdfs-site.xml'
-- Single configuration file
'hadoop.config.resources'='hdfs-cluster-2/hdfs-site.xml'
```

## HDFS I/O の最適化 {#hdfs-io-optimization}

HDFS の負荷が高いと、HDFS 上のデータのレプリカの読み取りに時間がかかり、クエリ全体の処理速度が低下する場合があります。以下に、関連する最適化設定を紹介します。

### Hedged Read {#hedged-read}

HDFS Client には Hedged Read 機能があります。読み取りリクエストが一定の時間内に応答しない場合、別の読み取りスレッドで同じデータを読み取り、先に返ってきた結果を使用します。

注意：この機能により HDFS クラスターの負荷が増える可能性があるため、慎重に使用してください。

次のように設定すると、この機能を有効にできます。

```sql
"dfs.client.hedged.read.threadpool.size" = "128",
"dfs.client.hedged.read.threshold.millis" = "500"
```

* `dfs.client.hedged.read.threadpool.size`

    Hedged Read に使用するスレッド数を表します。これらのスレッドは同じ HDFS Client 内で共有されます。通常、同じ HDFS クラスターに対して、BE ノードは同じ HDFS Client を共有します。

* `dfs.client.hedged.read.threshold.millis`

    読み取りのしきい値をミリ秒単位で指定します。読み取りリクエストがこの時間を超えても応答しない場合、Hedged Read が開始されます。

有効にすると、Query Profile で関連する項目を確認できます。

* `TotalHedgedRead`

    Hedged Read を開始した回数。

* `HedgedReadWins`

    Hedged Read が成功した回数。Hedged Read が開始され、元のリクエストより早く結果を返した回数です。

ここに表示される値は、個々のクエリの値ではなく、単一の HDFS Client に対する累積値です。同じ HDFS Client が複数のクエリで再利用されます。

### dfs.client.socket-timeout {#dfsclientsocket-timeout}

`dfs.client.socket-timeout` は Hadoop HDFS のクライアント設定パラメータで、クライアントが DataNode または NameNode に接続したりデータを読み取ったりする際のソケットのタイムアウトをミリ秒単位で設定します。このパラメータのデフォルト値は通常 60,000 ミリ秒です。

この値を小さくすると、ネットワークの遅延、DataNode の応答遅延、接続エラーが発生したときに、クライアントがより早くタイムアウトし、再試行または別のノードへの切り替えができます。これにより待機時間が短くなり、システムの応答速度が向上します。たとえば、一部のテストでは、`dfs.client.socket-timeout` を 5000 ミリ秒などの小さい値に設定すると、DataNode の遅延や障害をすばやく検出し、長時間の待機を避けられます。

注意：

* タイムアウトを短くしすぎると、ネットワークが不安定な場合やノードの負荷が高い場合にタイムアウトエラーが頻発し、タスクの安定性に影響する可能性があります。

* 応答速度とシステムの安定性のバランスを取るため、実際のネットワーク環境とシステム負荷に応じて、この値を適切に調整することを推奨します。

* HDFS との通信時にクライアントが適切なタイムアウト値を使用できるよう、このパラメータは `hdfs-site.xml` などのクライアント設定ファイルに設定してください。

`dfs.client.socket-timeout` パラメータを適切に設定すると、システムの安定性と信頼性を保ちながら、I/O の応答速度を改善できます。

## HDFS へのアクセスに必要なポート（NameNode \& DataNode のみ） {#hdfs-access-port-requirements-namenode--datanode-only}

Doris が HDFS にアクセスするには、次のポートを開放する必要があります。

| サービス   | ポートの用途                  | デフォルトのポート | プロトコル|
|-----------|-------------------------------|--------------|---------|
| NameNode  | RPC（クライアント／メタデータへのアクセス）  | 8020         |TCP      |
| DataNode  | データ転送（ブロック I/O）     | 9866         |TCP       |

注意：
- `core-site.xml` \& `hdfs-site.xml` でポートが変更されている場合があります。実際の設定を確認してください。
- Kerberos 認証が有効な場合、Doris から Kerberos KDC サービスにも接続できる必要があります。KDC はデフォルトで TCP ポート 88 を使用しますが、実際のポートは KDC の設定に従ってください。

## HDFS の問題調査 {#debugging-hdfs}

Hadoop の環境設定は複雑なため、接続に問題が生じたり、アクセス性能が低下したりする場合があります。接続の問題や基本的な性能上の問題をすばやく調査するのに役立つサードパーティ製ツールを以下に示します。

### HDFS Client {#hdfs-client}

* Java: <https://github.com/morningman/hdfs-client-java>

* CPP: <https://github.com/morningman/hdfs-client-cpp>

これらのツールを使用すると、HDFS への接続と読み取り性能をすばやく確認できます。使用する Hadoop の依存ライブラリの大部分が Doris 自身のものと同じため、Doris から HDFS へのアクセスをできる限り忠実に再現できます。

Java 版は Java を使用して HDFS にアクセスし、Doris の FE 側から HDFS にアクセスする処理を再現できます。

CPP 版は C++ から libhdfs を呼び出して HDFS にアクセスし、Doris の BE 側から HDFS にアクセスする処理を再現できます。

具体的な使い方については、それぞれのコードリポジトリの README を参照してください。
