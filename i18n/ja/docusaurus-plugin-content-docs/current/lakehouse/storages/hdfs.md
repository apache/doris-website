---
{
    "title": "HDFS | ストレージ",
    "language": "ja",
    "description": "このドキュメントでは、HDFS へのアクセスに必要なパラメータについて説明します。これらのパラメータは、次の用途に適用されます。",
    "sidebar_label": "HDFS"
}
---

# HDFS

このドキュメントでは、HDFS へのアクセスに必要なパラメータについて説明します。これらのパラメータは、次の用途に適用されます。

* Catalog のプロパティ
* Table Valued Function のプロパティ
* Broker Load のプロパティ
* Export のプロパティ
* Outfile のプロパティ
* バックアップとリストア

## パラメータの概要

| プロパティ名 | 旧名称 | 説明 | デフォルト値 | 必須 |
| --- | --- | --- | --- | --- |
| hdfs.authentication.type | hadoop.security.authentication | 認証方式を指定します。選択できる値は kerberos または simple です。kerberos を選択すると、HDFS との通信に Kerberos 認証を使用します。simple を選択すると認証を使用せず、認証を有効にしていない HDFS クラスターに適しています。kerberos を選択する場合は、対応する principal と keytab の設定が必要です。 | simple | いいえ |
| hdfs.authentication.kerberos.principal | hadoop.kerberos.principal | 認証方式が kerberos の場合に、Kerberos principal を指定します。Kerberos principal は一意の識別子で、通常はサービス名、ホスト名、ドメイン名を含みます。 | - | いいえ |
| hdfs.authentication.kerberos.keytab | hadoop.kerberos.keytab | Kerberos 認証に使用する keytab ファイルのパスを指定します。keytab ファイルには暗号化された認証情報が格納されており、ユーザーがパスワードを手動で入力しなくてもシステムが自動的に認証できます。 | - | いいえ |
| hdfs.impersonation.enabled | - | true の場合、HDFS の代理ユーザー機能を有効にします。core-site.xml で設定したプロキシユーザーが、Doris にログインしたユーザーに代わって HDFS 操作を行います。 | 未サポート | - |
| hadoop.username | - | 認証方式が simple の場合、HDFS へのアクセスに使用するユーザーを指定します。デフォルトでは、Doris プロセスを実行している Linux システムユーザーを使用します。 | - | - |
| hadoop.config.resources | - | HDFS 設定ファイルのディレクトリを相対パスで指定します（hdfs-site.xml と core-site.xml を含める必要があります）。デフォルトのディレクトリは、FE/BE のデプロイディレクトリ以下の /plugins/hadoop/conf/ です（fe.conf/be.conf の hadoop_config_dir を変更すると、デフォルトパスを変更できます）。すべての FE ノードと BE ノードで同じ相対パスを設定する必要があります。例：hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml | - | - |
| dfs.nameservices | - | HDFS 高可用性クラスターのパラメータを手動で設定します。hadoop.config.resources を使用する場合、パラメータは hdfs-site.xml から自動的に読み込まれます。dfs.ha.namenodes.your-nameservice、dfs.namenode.rpc-address.your-nameservice.nn1、dfs.client.failover.proxy.provider など、後述のパラメータと併せて使用する必要があります。 | - | - |

> 3.1 より前のバージョンでは、旧名称を使用してください。

## 認証の設定

HDFS は次の二種類の認証方式をサポートします。

* Simple
* Kerberos

### Simple 認証

Simple 認証は、Kerberos を有効にしていない HDFS クラスターに適しています。

Simple 認証を使用する場合は、次のパラメータを設定するか、デフォルト値をそのまま使用できます。

```sql
"hdfs.authentication.type" = "simple"
```

Simple 認証モードでは、`hadoop.username` パラメータでユーザー名を指定できます。指定しない場合、現在のプロセスのユーザー名が使用されます。

例：

ユーザー名 `lakers` で HDFS にアクセスする場合：

```sql
"hdfs.authentication.type" = "simple",
"hadoop.username" = "lakers"
```

デフォルトのシステムユーザーで HDFS にアクセスする場合：

```sql
"hdfs.authentication.type" = "simple"
```

### Kerberos 認証

Kerberos 認証は、Kerberos を有効にしている HDFS クラスターに適しています。

Kerberos 認証を使用する場合は、次のパラメータを設定する必要があります。

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "<your_principal>",
"hdfs.authentication.kerberos.keytab" = "<your_keytab>"
```

Kerberos 認証モードでは、Kerberos principal と keytab ファイルのパスを設定する必要があります。

Doris は、`hdfs.authentication.kerberos.principal` プロパティで指定した ID で HDFS にアクセスし、指定した keytab ファイルを使用して principal を認証します。

> 注意：
>
> keytab ファイルは、すべての FE ノードと BE ノードの同じパスに存在する必要があります。また、Doris プロセスの実行ユーザーには、そのファイルの読み取り権限が必要です。

例：

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "hdfs/hadoop@HADOOP.COM",
"hdfs.authentication.kerberos.keytab" = "/etc/security/keytabs/hdfs.keytab",
```
Kerberos の設定に関する一般的な問題のトラブルシューティングについては、[Kerberos FAQ](../best-practices/kerberos.md/#faq) を参照してください。

## HDFS HA の設定

HDFS HA モードが有効な場合は、`dfs.nameservices` 関連のパラメータを設定する必要があります。

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

## 設定ファイル

> この機能はバージョン 3.1.0 以降でサポートされます。

Doris では、`hadoop.config.resources` パラメータを使用して HDFS 設定ファイルのディレクトリを指定できます。

設定ファイルのディレクトリには、`hdfs-site.xml` と `core-site.xml` の両方が必要です。デフォルトのディレクトリは、FE/BE のデプロイディレクトリ以下の `/plugins/hadoop_conf/` です。すべての FE ノードと BE ノードで同じ相対パスを設定する必要があります。

設定ファイルに、このドキュメントで前述したパラメータが含まれる場合、ユーザーが明示的に設定したパラメータが優先されます。設定ファイルはカンマで区切って複数指定できます。例：`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`。

**例：**

```sql
-- Multiple configuration files
'hadoop.config.resources'='hdfs-cluster-1/core-site.xml,hdfs-cluster-1/hdfs-site.xml'
-- Single configuration file
'hadoop.config.resources'='hdfs-cluster-2/hdfs-site.xml'
```

## HDFS I/O の最適化

HDFS の負荷が高い場合、HDFS 上のデータレプリカの読み取りに時間がかかり、クエリ全体の実行速度が低下することがあります。関連する最適化設定を以下に示します。

### Hedged Read

HDFS Client は Hedged Read 機能を提供します。読み取り要求が一定のしきい値を超えても応答しない場合、別の読み取りスレッドを起動して同じデータを読み取り、先に完了した結果を使用できます。

注意：この機能を使用すると HDFS クラスターの負荷が増える可能性があるため、慎重に使用してください。

次のように設定すると、この機能を有効にできます。

```sql
"dfs.client.hedged.read.threadpool.size" = "128",
"dfs.client.hedged.read.threshold.millis" = "500"
```

* `dfs.client.hedged.read.threadpool.size`

    Hedged Read に使用するスレッド数を示します。スレッドは単一の HDFS Client で共有されます。通常、単一の HDFS クラスターに対して、BE ノードは単一の HDFS Client を共有します。

* `dfs.client.hedged.read.threshold.millis`

    ミリ秒単位の読み取りしきい値です。読み取り要求がこのしきい値を超えても応答しない場合、Hedged Read が開始されます。

有効にすると、Query Profile で次の関連パラメータを確認できます。

* `TotalHedgedRead`

    Hedged Read を開始した回数です。

* `HedgedReadWins`

    Hedged Read が元の要求より早く完了した回数です。

これらの値は単一の HDFS Client の累積値であり、個々のクエリの値ではありません。同じ HDFS Client が複数のクエリで再利用されます。

### dfs.client.socket-timeout

`dfs.client.socket-timeout` は、Hadoop HDFS のクライアント設定パラメータです。クライアントが DataNode または NameNode との接続を確立するときやデータを読み取るときのソケットタイムアウトを、ミリ秒単位で設定します。通常、このパラメータのデフォルト値は 60,000 ミリ秒です。

この値を小さくすると、ネットワーク遅延、DataNode の応答遅延、接続エラーが発生した場合に、クライアントがより早くタイムアウトし、再試行または別のノードへの切り替えを行えます。これにより、待機時間が短くなり、システムの応答速度が向上します。たとえば、一部のテストでは、`dfs.client.socket-timeout` を 5000 ミリ秒などの小さい値に設定すると、DataNode の遅延や障害を素早く検出し、長時間の待機を回避できます。

注意：

* タイムアウトを短くしすぎると、ネットワークの変動時やノードの負荷が高いときにタイムアウトエラーが頻発し、タスクの安定性に影響する可能性があります。

* 応答速度とシステムの安定性のバランスを取るため、実際のネットワーク環境とシステム負荷に応じてこの値を適切に調整することを推奨します。

* HDFS との通信でクライアントが適切なタイムアウト値を使用できるよう、このパラメータはクライアント設定ファイル（`hdfs-site.xml` など）に設定してください。

`dfs.client.socket-timeout` を適切に設定すると、システムの安定性と信頼性を維持しながら、I/O の応答速度を向上できます。

## HDFS へのアクセスに必要なポート（NameNode \& DataNode のみ）

Doris から HDFS にアクセスするには、次のポートを開放する必要があります。

| サービス | ポートの用途 | デフォルトポート | プロトコル |
|-----------|-------------------------------|--------------|---------|
| NameNode  | RPC（クライアント／メタデータへのアクセス） | 8020 | TCP |
| DataNode  | データ転送（ブロック I/O） | 9866 | TCP |

注意：
- `core-site.xml` と `hdfs-site.xml` でポートを変更している場合があります。実際の設定値を使用してください。
- Kerberos 認証が有効な場合、Doris から Kerberos KDC サービスにも接続できる必要があります。KDC はデフォルトで TCP ポート 88 をリッスンしますが、実際のポートは KDC の設定に従ってください。

## HDFS のデバッグ

Hadoop 環境の設定は複雑で、接続の問題やアクセス性能の低下が起こることがあります。以下のサードパーティーツールを使用すると、接続の問題や基本的な性能上の問題を素早く調査できます。

### HDFS Client

* Java: <https://github.com/morningman/hdfs-client-java>

* CPP: <https://github.com/morningman/hdfs-client-cpp>

これらのツールを使用すると、HDFS への接続と読み取り性能を素早く確認できます。両ツールが使用する Hadoop の依存ライブラリは、大部分が Doris 自身の依存ライブラリと同じであるため、Doris から HDFS へアクセスする状況をできる限り再現できます。

Java 版は Java で HDFS にアクセスし、Doris の FE 側から HDFS にアクセスする処理を再現できます。

CPP 版は C++ から libhdfs を呼び出して HDFS にアクセスし、Doris の BE 側から HDFS にアクセスする処理を再現できます。

具体的な使い方については、それぞれのコードリポジトリの README を参照してください。
