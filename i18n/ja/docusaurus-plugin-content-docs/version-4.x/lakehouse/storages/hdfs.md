---
{
    "title": "HDFS | ストレージ",
    "language": "ja",
    "description": "このドキュメントでは、HDFS へのアクセスに必要なパラメータについて説明します。これらのパラメータは、次の用途に適用されます。",
    "sidebar_label": "HDFS"
}
---

# HDFS {#hdfs}

このドキュメントでは、HDFS へのアクセスに必要なパラメータについて説明します。これらのパラメータは、次の用途に適用されます。

* Catalog のプロパティ
* Table Valued Function のプロパティ
* Broker Load のプロパティ
* Export のプロパティ
* Outfile のプロパティ
* バックアップと復元

## パラメータ一覧 {#parameter-overview}

| プロパティ名 | 旧名称 | 説明 | デフォルト値 | 必須 |
| --- | --- | --- | --- | --- |
| hdfs.authentication.type | hadoop.security.authentication | 認証方式を指定します。指定できる値は kerberos または simple です。kerberos を選択すると、Kerberos 認証を使用して HDFS にアクセスします。simple を選択すると認証を使用せず、認証を必要としない HDFS クラスターに適しています。kerberos を選択する場合は、対応する principal と keytab の設定が必要です。 | simple | いいえ |
| hdfs.authentication.kerberos.principal | hadoop.kerberos.principal | 認証方式が kerberos の場合に、Kerberos principal を指定します。Kerberos principal は一意の識別子で、通常はサービス名、ホスト名、ドメイン名を含みます。 | - | いいえ |
| hdfs.authentication.kerberos.keytab | hadoop.kerberos.keytab | Kerberos 認証に使用する keytab ファイルのパスを指定します。keytab ファイルには暗号化された認証情報が保存されており、ユーザーがパスワードを手動で入力しなくても自動的に認証できます。 | - | いいえ |
| hdfs.impersonation.enabled | - | true にすると、HDFS の代理ユーザー機能が有効になります。core-site.xml で設定されたプロキシユーザーを使用し、Doris にログインしたユーザーに代わって HDFS の操作を実行します。 | 現時点では未対応 | - |
| hadoop.username | - | 認証方式が simple の場合、HDFS へのアクセスに使用するユーザーです。デフォルトでは、Doris プロセスを実行している Linux システムユーザーが使用されます。 | - | - |
| hadoop.config.resources | - | HDFS 設定ファイルのディレクトリを相対パスで指定します。hdfs-site.xml と core-site.xml を含める必要があります。デフォルトのディレクトリは、(FE/BE) のデプロイディレクトリ下の /plugins/hadoop/conf/ です。fe.conf/be.conf の hadoop_config_dir を変更すると、デフォルトのパスを変更できます。すべての FE ノードと BE ノードで同じ相対パスを設定する必要があります。例: hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml | - | - |
| dfs.nameservices | - | HDFS 高可用性クラスターのパラメータを手動で設定します。hadoop.config.resources を設定した場合、パラメータは hdfs-site.xml から自動的に読み込まれます。dfs.ha.namenodes.your-nameservice、dfs.namenode.rpc-address.your-nameservice.nn1、dfs.client.failover.proxy.provider などのパラメータと併せて使用する必要があります。 | - | - |

> 3.1 より前のバージョンでは、旧名称を使用してください。

## 認証設定 {#authentication-configuration}

HDFS は次の認証方式をサポートしています。

* Simple
* Kerberos

### Simple 認証 {#simple-authentication}

Simple 認証は、Kerberos が有効になっていない HDFS クラスターに適しています。

Simple 認証を使用する場合は、次のパラメータを設定するか、デフォルト値をそのまま使用できます。

```sql
"hdfs.authentication.type" = "simple"
```

Simple 認証モードでは、`hadoop.username` パラメータでユーザー名を指定できます。指定しない場合は、現在のプロセスのユーザー名がデフォルトで使用されます。

例:

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

Kerberos 認証を使用する場合は、次のパラメータを設定する必要があります。

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "<your_principal>",
"hdfs.authentication.kerberos.keytab" = "<your_keytab>"
```

Kerberos 認証モードでは、Kerberos principal と keytab ファイルのパスを設定する必要があります。

Doris は `hdfs.authentication.kerberos.principal` プロパティで指定された識別子を使用して HDFS にアクセスし、keytab で指定されたファイルを使用して Principal を認証します。

> 注:
>
> keytab ファイルは、すべての FE ノードと BE ノードの同じパスに存在する必要があります。また、Doris プロセスを実行するユーザーには、そのファイルの読み取り権限が必要です。

例:

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "hdfs/hadoop@HADOOP.COM",
"hdfs.authentication.kerberos.keytab" = "/etc/security/keytabs/hdfs.keytab",
```
Kerberos 設定でよくある問題の対処方法については、[Kerberos FAQ](../best-practices/kerberos.md/#faq) を参照してください。

## HDFS HA の設定 {#hdfs-ha-configuration}

HDFS HA モードが有効な場合は、`dfs.nameservices` に関連するパラメータを設定する必要があります。

```sql
'dfs.nameservices' = '<your-nameservice>',
'dfs.ha.namenodes.<your-nameservice>' = '<nn1>,<nn2>',
'dfs.namenode.rpc-address.<your-nameservice>.<nn1>' = '<nn1_host:port>',
'dfs.namenode.rpc-address.<your-nameservice>.<nn2>' = '<nn2_host:port>',
'dfs.client.failover.proxy.provider.<your-nameservice>' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
```

例:

```sql
'dfs.nameservices' = 'nameservice1',
'dfs.ha.namenodes.nameservice1' = 'nn1,nn2',
'dfs.namenode.rpc-address.nameservice1.nn1' = '172.21.0.2:8088',
'dfs.namenode.rpc-address.nameservice1.nn2' = '172.21.0.3:8088',
'dfs.client.failover.proxy.provider.nameservice1' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
```

4.1.5 以降、`hadoop.config.resources` でコンマ区切りで指定する XML のパスには、親ディレクトリを表す `..` セグメントを含められません。区切り文字がスラッシュでもバックスラッシュでも検査されます。`conf/core-site.xml,conf/hdfs-site.xml` のような通常のパスを使用し、親ディレクトリへのアクセスに `../` を使用しないでください。

## 設定ファイル {#configuration-files}

> この機能はバージョン 3.1.0 以降でサポートされています。

Doris では、`hadoop.config.resources` パラメータで HDFS 設定ファイルのディレクトリを指定できます。

設定ファイルのディレクトリには、`hdfs-site.xml` と `core-site.xml` が必要です。デフォルトのディレクトリは、(FE/BE) のデプロイディレクトリ下の `/plugins/hadoop_conf/` です。すべての FE ノードと BE ノードで同じ相対パスを設定する必要があります。

設定ファイルにこのドキュメントで前述したパラメータが含まれている場合は、ユーザーが明示的に設定したパラメータが優先されます。`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml` のようにコンマで区切ると、複数の設定ファイルを指定できます。

**例:**

```sql
-- Multiple configuration files
'hadoop.config.resources'='hdfs-cluster-1/core-site.xml,hdfs-cluster-1/hdfs-site.xml'
-- Single configuration file
'hadoop.config.resources'='hdfs-cluster-2/hdfs-site.xml'
```

## HDFS I/O の最適化 {#hdfs-io-optimization}

HDFS の負荷が高い場合、HDFS 上のデータレプリカの読み取りに時間がかかり、クエリ全体の処理速度が低下することがあります。以下に、関連する最適化設定を紹介します。

### Hedged Read {#hedged-read}

HDFS Client には Hedged Read 機能があります。読み取りリクエストが一定時間内に応答しない場合、別の読み取りスレッドを開始して同じデータを読み取り、先に返った結果を使用できます。

注: この機能は HDFS クラスターの負荷を増やす可能性があるため、慎重に使用してください。

次のように設定すると、この機能を有効にできます。

```sql
"dfs.client.hedged.read.threadpool.size" = "128",
"dfs.client.hedged.read.threshold.millis" = "500"
```

* `dfs.client.hedged.read.threadpool.size`

    Hedged Read に使用するスレッド数を表します。これらのスレッドは、同じ HDFS Client 内で共有されます。通常、BE ノードは HDFS クラスターごとに同じ HDFS Client を共有します。

* `dfs.client.hedged.read.threshold.millis`

    読み取りのしきい値をミリ秒単位で指定します。読み取りリクエストがこの時間を超えても応答しない場合、Hedged Read が開始されます。

有効化すると、Query Profile で関連するパラメータを確認できます。

* `TotalHedgedRead`

    Hedged Read が開始された回数です。

* `HedgedReadWins`

    Hedged Read が成功した回数です。元のリクエストより速く結果が返った試行を数えます。

これらの値は単一の HDFS Client に対する累積値であり、単一のクエリに対する値ではありません。同じ HDFS Client が複数のクエリで再利用されます。

### dfs.client.socket-timeout {#dfsclientsocket-timeout}

`dfs.client.socket-timeout` は、Hadoop HDFS のクライアント設定パラメータです。クライアントが DataNode または NameNode と接続を確立したり、データを読み取ったりする際のソケットタイムアウトをミリ秒単位で設定します。通常、デフォルト値は 60,000 ミリ秒です。

この値を小さくすると、ネットワーク遅延、DataNode の応答遅延、接続エラーが発生したときに、クライアントがより早くタイムアウトし、再試行や別のノードへの切り替えを行えます。これにより、待機時間を短縮し、システムの応答速度を改善できます。たとえば、一部のテストでは、`dfs.client.socket-timeout` を小さな値（5000 ミリ秒など）に設定すると、DataNode の遅延や障害をすばやく検出し、長時間の待機を避けられます。

注:

* タイムアウトを短くしすぎると、ネットワークの変動時やノードの負荷が高いときにタイムアウトエラーが頻発し、タスクの安定性に影響する可能性があります。

* 応答速度とシステムの安定性のバランスを取るために、実際のネットワーク環境とシステム負荷に応じて、この値を調整することを推奨します。

* HDFS との通信時にクライアントが正しいタイムアウト値を使用できるよう、このパラメータは `hdfs-site.xml` などのクライアント設定ファイルに設定してください。

適切な `dfs.client.socket-timeout` の設定は、システムの安定性と信頼性を保ちながら、I/O の応答速度を改善するのに役立ちます。

## HDFS へのアクセスに必要なポート（NameNode \& DataNode のみ） {#hdfs-access-port-requirements-namenode--datanode-only}

Doris が HDFS にアクセスするには、次のポートを開く必要があります。

| サービス | 用途 | デフォルトポート | プロトコル |
|-----------|-------------------------------|--------------|---------|
| NameNode | RPC（クライアント／メタデータへのアクセス） | 8020 | TCP |
| DataNode | データ転送（ブロック I/O） | 9866 | TCP |

注:
- ポートは `core-site.xml` \& `hdfs-site.xml` で変更されている場合があります。実際の設定を確認してください。
- Kerberos 認証が有効な場合、Doris は Kerberos KDC サービスにも接続できる必要があります。KDC はデフォルトで TCP ポート 88 を使用しますが、実際のポートは KDC の設定に従ってください。

## HDFS のデバッグ {#debugging-hdfs}

Hadoop 環境の設定は複雑で、接続の問題やアクセス性能の低下が起こることがあります。ここでは、接続の問題や基本的な性能上の問題をすばやく調査するためのサードパーティ製ツールを紹介します。

### HDFS Client {#hdfs-client}

* Java: <https://github.com/morningman/hdfs-client-java>

* CPP: <https://github.com/morningman/hdfs-client-cpp>

これらのツールを使用すると、HDFS への接続と読み取り性能をすばやく確認できます。両ツールで使用する Hadoop の依存関係の大部分は Doris の依存関係と同じため、Doris から HDFS にアクセスする状況を高い精度で再現できます。

Java 版は Java を使用して HDFS にアクセスし、Doris の FE 側から HDFS にアクセスする処理を再現できます。

CPP 版は C++ から libhdfs を呼び出して HDFS にアクセスし、Doris の BE 側から HDFS にアクセスする処理を再現できます。

具体的な使用方法は、各コードリポジトリの README を参照してください。
