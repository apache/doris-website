---
{
  "title": "HDFS | ストレージ",
  "language": "ja",
  "description": "このドキュメントでは、HDFSへのアクセスに必要なパラメータについて説明します。これらのパラメータは以下に適用されます：",
  "sidebar_label": "HDFS"
}
---
# HDFS

本ドキュメントでは、HDFSにアクセスするために必要なパラメータについて説明します。これらのパラメータは以下に適用されます：

* Catalogプロパティ
* Table Valued Functionプロパティ
* Broker Loadプロパティ
* Exportプロパティ
* Outfileプロパティ
* バックアップとリストア

## パラメータ概要

|プロパティ名 | レガシー名 | 説明 | デフォルト値 | 必須 |
| --- | --- | --- | --- | --- | 
| hdfs.authentication.type | hadoop.security.authentication | 認証タイプを指定します。オプション値はkerberosまたはsimpleです。kerberosが選択された場合、システムはKerberos認証を使用してHDFSとやり取りします。simpleが使用された場合、認証を使用しないことを意味し、オープンなHDFSクラスターに適しています。kerberosを選択する場合は、対応するprincipalとkeytabを設定する必要があります。 | simple | No |
| hdfs.authentication.kerberos.principal | hadoop.kerberos.principal | 認証タイプがkerberosの場合、KerberosprincipaTを指定します。KerberosprincipaTは一意のidentity文字列で、通常はサービス名、ホスト名、ドメイン名を含みます。 | - | No |
| hdfs.authentication.kerberos.keytab | hadoop.kerberos.keytab | このパラメータはKerberos認証用のkeytabファイルパスを指定します。keytabファイルは暗号化された認証情報を格納し、ユーザーが手動でパスワードを入力することなく、システムが自動的に認証できるようにします。 | - | No |
| hdfs.impersonation.enabled | - | trueの場合、HDFSimpersonation機能を有効にします。core-site.xmlで設定されたproxyユーザーを使用して、HDFS操作のためにDorisログインユーザーをproxyします | まだサポートされていません | - |
| hadoop.username | - | 認証タイプがsimpleの場合、このユーザーがHDFSへのアクセスに使用されます。デフォルトでは、Dorisプロセスを実行しているLinuxシステムユーザーがアクセスに使用されます | - | - |
| hadoop.config.resources | - | HDFS設定ファイルディレクトリ（hdfs-site.xmlとcore-site.xmlを含む必要があります）を相対パスで指定します。デフォルトディレクトリは（FE/BE）デプロイメントディレクトリ下の/plugins/hadoop/conf/です（fe.conf/be.confでhadoop_config_dirを変更することでデフォルトパスを変更できます）。すべてのFEおよびBEノードは同じ相対パスを設定する必要があります。例：hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml | - | - |
| dfs.nameservices | - | HDFS高可用性クラスターパラメータを手動で設定します。hadoop.config.resources設定を使用する場合、パラメータはhdfs-site.xmlから自動的に読み取られます。以下のパラメータと併用する必要があります：dfs.ha.namenodes.your-nameservice、dfs.namenode.rpc-address.your-nameservice.nn1、dfs.client.failover.proxy.providerなど。 | - | - | 

> 3.1より前のバージョンでは、レガシー名を使用してください。

## 認証設定

HDFSは2つの認証方式をサポートします：

* Simple
* Kerberos

### Simple認証

Simple認証はKerberosを有効にしていないHDFSクラスターに適しています。

Simple認証を使用する場合、以下のパラメータを設定するか、デフォルト値を直接使用できます：

```sql
"hdfs.authentication.type" = "simple"
```
Simple認証モードでは、`hadoop.username`パラメータを使用してユーザー名を指定できます。指定されていない場合は、現在のプロセスのユーザー名がデフォルトとなります。

例:

`lakers`ユーザー名を使用してHDFSにアクセス

```sql
"hdfs.authentication.type" = "simple",
"hadoop.username" = "lakers"
```
デフォルトのシステムユーザーを使用してHDFSにアクセスする

```sql
"hdfs.authentication.type" = "simple"
```
### Kerberos認証

Kerberos認証は、Kerberosが有効化されたHDFSクラスターに適しています。

Kerberos認証を使用する場合、以下のパラメータを設定する必要があります：

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "<your_principal>",
"hdfs.authentication.kerberos.keytab" = "<your_keytab>"
```
Kerberos認証モードでは、Kerberosプリンシパルとkeytabファイルパスを設定する必要があります。

Dorisは`hdfs.authentication.kerberos.principal`プロパティで指定されたアイデンティティでHDFSにアクセスし、keytabで指定されたkeytabを使用してPrincipalを認証します。

> 注意：
>
> keytabファイルは、すべてのFEおよびBEノードで同じパスに存在する必要があり、Dorisプロセスを実行するユーザーはkeytabファイルの読み取り権限を持つ必要があります。

例：

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "hdfs/hadoop@HADOOP.COM",
"hdfs.authentication.kerberos.keytab" = "/etc/security/keytabs/hdfs.keytab",
```
一般的な Kerberos 設定の問題のトラブルシューティングについては、[Kerberos FAQ](../best-practices/kerberos.md/#faq) を参照してください。

## HDFS HA Configuration

HDFS HA モードが有効な場合、`dfs.nameservices` 関連のパラメータを設定する必要があります：

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
## 設定ファイル

> この機能はバージョン3.1.0以降でサポートされています

Dorisは`hadoop.config.resources`パラメータを通じてHDFS設定ファイルディレクトリを指定することをサポートしています。

設定ファイルディレクトリには`hdfs-site.xml`と`core-site.xml`ファイルが含まれている必要があります。デフォルトディレクトリは(FE/BE)デプロイメントディレクトリ下の`/plugins/hadoop_conf/`です。すべてのFEとBEノードは同じ相対パスを設定する必要があります。

設定ファイルにこの文書で言及されている上記のパラメータが含まれている場合、ユーザーが明示的に設定したパラメータが優先されます。設定ファイルは`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`のように、カンマで区切って複数のファイルを指定できます。

**例:**

```sql
-- Multiple configuration files
'hadoop.config.resources'='hdfs-cluster-1/core-site.xml,hdfs-cluster-1/hdfs-site.xml'
-- Single configuration file
'hadoop.config.resources'='hdfs-cluster-2/hdfs-site.xml'
```
## HDFS IO 最適化

場合によっては、HDFS の高負荷により HDFS 上のデータレプリカの読み取りに長時間を要し、全体的なクエリ効率が低下する可能性があります。以下では、関連する最適化設定について紹介します。

### Hedged Read

HDFS Client は Hedged Read 機能を提供します。この機能は、読み取りリクエストが一定の閾値を超えても応答しない場合に、同じデータを読み取る別の読み取りスレッドを開始し、先に応答したものを使用できます。

注意：この機能は HDFS クラスタの負荷を増加させる可能性があるため、慎重に使用してください。

この機能は以下の方法で有効にできます：

```sql
"dfs.client.hedged.read.threadpool.size" = "128",
"dfs.client.hedged.read.threshold.millis" = "500"
```
* `dfs.client.hedged.read.threadpool.size`

    Hedged Readに使用されるスレッド数を表し、一つのHDFSクライアントで共有されます。通常、一つのHDFSクラスターに対して、BEノードは一つのHDFSクライアントを共有します。

* `dfs.client.hedged.read.threshold.millis`

    読み込み閾値（ミリ秒）。読み込みリクエストがこの閾値を超えても戻らない場合、Hedged Readがトリガーされます。

有効にした後、Query Profileで関連パラメータを確認できます：

* `TotalHedgedRead`

    Hedged Readが開始された回数。

* `HedgedReadWins`

    Hedged Readの成功回数（開始され、元のリクエストより早く戻った回数）。

ここでの値は単一のHDFSクライアントの累積値であり、単一クエリの値ではないことに注意してください。同じHDFSクライアントは複数のクエリで再利用されます。

### dfs.client.socket-timeout

`dfs.client.socket-timeout`はHadoop HDFSのクライアント設定パラメータで、クライアントがDataNodeまたはNameNodeとの接続確立やデータ読み込み時のソケットタイムアウトを設定するために使用され、単位はミリ秒です。このパラメータのデフォルト値は通常60,000ミリ秒です。

このパラメータ値を減らすことで、ネットワーク遅延、DataNodeの応答遅延、または接続例外が発生した際に、クライアントがより早くタイムアウトして再試行または他のノードに切り替えることができます。これにより待機時間を短縮し、システムの応答速度を向上させることができます。例えば、一部のテストでは`dfs.client.socket-timeout`をより小さな値（5000ミリ秒など）に設定することで、DataNodeの遅延や障害を迅速に検出し、長時間の待機を回避できます。

注意：

* タイムアウトを小さく設定しすぎると、ネットワークの変動や高いノード負荷時に頻繁なタイムアウトエラーが発生し、タスクの安定性に影響を与える可能性があります。

* 実際のネットワーク環境とシステム負荷状況に基づいてこのパラメータ値を合理的に調整し、応答速度とシステム安定性のバランスを取ることを推奨します。

* このパラメータはクライアント設定ファイル（`hdfs-site.xml`など）で設定し、クライアントがHDFSと通信する際に正しいタイムアウトを使用することを確保する必要があります。

要約すると、`dfs.client.socket-timeout`パラメータを適切に設定することで、システムの安定性と信頼性を確保しながらI/O応答速度を向上させることができます。

## HDFSアクセスポート要件（NameNode & DataNodeのみ）

DorisがHDFSにアクセスするために以下のポートが開放されている必要があります：

| Service   | Port Purpose                  | Default Port | Protocol|
|-----------|-------------------------------|--------------|---------|
| NameNode  | RPC (client/metadata access)  | 8020         |TCP      |
| DataNode  | Data transfer (block I/O)     | 9866         |TCP       |

注意：
- ポートは`core-site.xml`と`hdfs-site.xml`でカスタマイズされている場合があります。実際の設定を使用してください。
- Kerberos認証が有効な場合、DorisはKerberos KDCサービスにも到達できる必要があります。KDCはデフォルトでTCPポート88をリッスンしますが、実際のポートはKDC設定に従う必要があります。

## HDFSのデバッグ

Hadoop環境の設定は複雑で、場合によっては接続問題やアクセスパフォーマンスの低下が発生することがあります。ユーザーが接続問題と基本的なパフォーマンス問題を迅速にトラブルシューティングするのに役立つサードパーティツールをいくつか紹介します。

### HDFS Client

* Java: <https://github.com/morningman/hdfs-client-java>

* CPP: <https://github.com/morningman/hdfs-client-cpp>

これら2つのツールはHDFS接続性と読み込みパフォーマンスを迅速に検証するために使用できます。それらのHadoop依存関係の大部分はDoris自身のHadoop依存関係と同じであるため、最大限DorisのHDFSアクセスシナリオをシミュレートできます。

Java版はJavaを使用してHDFSにアクセスし、Doris FE側でHDFSにアクセスするロジックをシミュレートできます。

CPP版はC++でlibhdfsを呼び出してHDFSにアクセスし、Doris BE側でHDFSにアクセスするロジックをシミュレートできます。

具体的な使用方法については、各コードリポジトリのREADMEを参照してください。
