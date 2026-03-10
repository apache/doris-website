---
{
  "title": "データ操作エラー",
  "language": "ja",
  "description": "このドキュメントは主にDorisの使用中にデータ操作でよくある問題を記録するために使用されます。随時更新されます。"
}
---
# データ操作エラー

この文書は、Doris の使用時におけるデータ操作の一般的な問題を記録するために主に使用されます。随時更新される予定です。

### Q1. Stream Load を使用して FE のパブリックネットワークアドレスにアクセスしてデータをインポートしたが、イントラネット IP にリダイレクトされる？

stream load の接続先が FE の http ポートの場合、FE は BE ノードをランダムに選択して http 307 リダイレクト操作を実行するため、ユーザーのリクエストは実際には FE によって割り当てられた BE に送信されます。リダイレクトは BE の IP、つまりイントラネット IP を返します。したがって、FE のパブリック IP を通じてリクエストを送信すると、内部ネットワークアドレスにリダイレクトされるため接続できない可能性が高くなります。

通常の方法は、イントラネット IP アドレスにアクセスできるようにするか、すべての BE 上位層にロードバランサーを想定し、その後 stream load リクエストを直接ロードバランサーに送信し、ロードバランサーがリクエストを BE ノードに透過的に送信することです。

### Q2. Doris はカラム名の変更をサポートしていますか？

バージョン 1.2.0 以降では、`"light_schema_change"="true"` オプションが有効になっている場合、カラム名を変更できます。

バージョン 1.2.0 より前、または `"light_schema_change"="true"` オプションが有効になっていない場合、カラム名の変更はサポートされていません。理由は以下の通りです：

Doris は、データベース名、テーブル名、パーティション名、マテリアライズドビュー（Rollup）名、およびカラム型、コメント、デフォルト値などの変更をサポートしています。しかし残念ながら、カラム名の変更は現在サポートされていません。

いくつかの歴史的な理由により、カラム名は現在データファイルに直接書き込まれています。Doris がクエリを実行する際も、クラス名を通じて対応するカラムを見つけます。したがって、カラム名の変更は単純なメタデータの変更だけでなく、データの書き換えも伴う非常に重い操作です。

将来的に軽量なカラム名変更操作をサポートするための互換性のある手段を検討することを除外しません。

### Q3. Unique Key モデルのテーブルはマテリアライズドビューの作成をサポートしていますか？

サポートしていません。

Unique Key モデルのテーブルはビジネスフレンドリーなテーブルです。プライマリキーに従って重複排除するユニークな機能により、頻繁に変更されるデータを持つビジネスデータベースと簡単に同期できます。そのため、多くのユーザーは Doris にデータをアクセスする際に最初に Unique Key モデルの使用を検討します。

しかし残念ながら、Unique Key モデルのテーブルはマテリアライズドビューを確立できません。その理由は、マテリアライズドビューの本質は事前計算を通じてデータを「事前計算」し、クエリ時に計算されたデータを直接返してクエリを高速化することです。マテリアライズドビューでは、「事前計算された」データは通常、sum や count などの集約指標です。この時、データが変更された場合（update や delete など）、事前計算されたデータは詳細情報を失っているため、同期して更新することができません。例えば、sum 値 5 は 1+4 または 2+3 の可能性があります。詳細情報の損失により、この合計値がどのように計算されたかを区別できないため、更新のニーズを満たすことができません。

### Q4. tablet writer write failed, tablet_id=27306172, txn_id=28573520, err=-235 or -238

このエラーは通常、データインポート操作中に発生します。エラーコードは -235 です。このエラーの意味は、対応する tablet のデータバージョンが最大制限（デフォルト 500、BE パラメータ `max_tablet_version_num` によって制御）を超え、後続の書き込みが拒否されることです。例えば、質問のエラーは tablet 27306172 のデータバージョンが制限を超えていることを意味します。

このエラーは通常、インポート頻度が高すぎて、バックエンドデータの compaction 速度よりも大きいために、バージョンが蓄積され最終的に制限を超えることによって引き起こされます。この時点で、まず show tablet 27306172 文を使用し、その後結果で show proc 文を実行して tablet の各コピーのステータスを確認できます。結果の versionCount はバージョン数を表します。コピーのバージョンが多すぎることがわかった場合は、インポート頻度を減らすか、インポートを停止してバージョン数が減少するかを観察する必要があります。インポートを停止してもバージョン数が減少しない場合は、対応する BE ノードに移動して be.INFO ログを表示し、tablet id と compaction キーワードを検索して、compaction が正常に実行されているかを確認する必要があります。compaction の調整については、ApacheDoris 公式アカウント記事を参照できます：[Doris Best Practices - Compaction Tuning (3)](https://mp.weixin.qq.com/s/cZmXEsNPeRMLHp379kc2aA)

-238 エラーは通常、同じバッチのインポートデータが大きすぎて、tablet の Segment ファイル数が多すぎる場合に発生します（デフォルトは 200、BE パラメータ `max_segment_num_per_rowset` によって制御）。この時は、1回のバッチでインポートするデータ量を減らすか、BE 設定パラメータ値を適切に増やして問題を解決することをお勧めします。バージョン 2.0 以降、ユーザーは BE config で `enable_segcompaction=true` を設定して segment compaction 機能を有効にし、segment ファイル数を削減できます。

### Q5. tablet 110309738 has few replicas: 1, alive backends: [10003]

このエラーは、クエリまたはインポート操作中に発生する可能性があります。通常、対応する tablet のコピーに例外があることを意味します。

この時点で、まず show backends コマンドを使用して BE ノードがダウンしているかを確認できます。例えば、isAlive フィールドが false、または LastStartTime が最近の時刻（最近再起動されたことを示す）の場合です。BE がダウンしている場合は、BE に対応するノードに移動して be.out ログを確認する必要があります。BE が異常な理由でダウンしている場合、通常 be.out に例外スタックが印刷され、問題のトラブルシューティングに役立ちます。be.out にエラースタックがない場合は、linux コマンド dmesg -T を使用して、プロセスが OOM のためにシステムによって kill されたかを確認できます。

BE ノードがダウンしていない場合は、show tablet 110309738 文を使用し、その後結果で show proc 文を実行して、各 tablet コピーのステータスを確認してさらに調査する必要があります。

### Q6. disk xxxxx on backend xxx exceed limit usage

通常、Import、Alter などの操作で発生します。このエラーは、BE に対応する対応ディスクの使用率がしきい値（デフォルト 95%）を超えることを意味します。この場合、まず show backends コマンドを使用でき、MaxDiskUsedPct は対応する BE で最も使用率の高いディスクの使用率を示します。95% を超える場合、このエラーが報告されます。

この時点で、対応する BE ノードに移動してデータディレクトリの使用状況を確認する必要があります。trash ディレクトリと snapshot ディレクトリは手動でクリーンアップしてスペースを解放できます。データディレクトリが大きなスペースを占有している場合は、一部のデータを削除してスペースを解放することを検討する必要があります。詳細については、[Disk Space Management](../admin-manual/maint-monitor/disk-capacity.md) を参照してください。

### Q7. Java プログラムを通じて stream load を呼び出してデータをインポートすると、データのバッチが大きい場合に Broken Pipe エラーが発生する可能性があります。

Broken Pipe の他にも、いくつかの奇妙なエラーが発生する可能性があります。

この状況は通常、httpv2 を有効にした後に発生します。httpv2 は spring boot を使用して実装された http サービスで、tomcat をデフォルトの組み込みコンテナとして使用しているためです。しかし、tomcat の 307 転送の処理にいくつかの問題があるようで、後に組み込みコンテナが jetty に変更されました。さらに、java プログラムの apache http client のバージョンは 4.5.13 以降のバージョンを使用する必要があります。以前のバージョンでは、転送の処理にもいくつかの問題がありました。

したがって、この問題は 2 つの方法で解決できます：

1. httpv2 を無効にする

   fe.conf に enable_http_server_v2=false を追加して FE を再起動します。ただし、新しいバージョンの UI インターフェースは使用できなくなり、httpv2 ベースの一部の新しいインターフェースも使用できません。（通常のインポートクエリは影響を受けません）。

2. アップグレード

   Doris 0.15 以降にアップグレードすることで、この問題は修正されています。

### Q8. インポートおよびクエリ時にエラー -214 が報告される

インポート、クエリなどの操作を実行する際に、以下のエラーが発生する可能性があります：

```text
failed to initialize storage reader. tablet=63416.1050661139.aa4d304e7a7aff9c-f0fa7579928c85a0, res=-214, backend=192.168.100.10
```
-214エラーは、対応するtabletのデータバージョンが欠落していることを意味します。例えば、上記のエラーは192.168.100.10のBE上のtablet 63416のコピーのデータバージョンが欠落していることを示しています。（他にも類似のエラーコードが存在する可能性がありますが、以下の方法で確認および修復できます）。

通常、データに複数のコピーがある場合、システムはこれらの問題のあるコピーを自動的に修復します。以下の手順でトラブルシューティングできます：

まず、`show tablet 63416`文を実行し、結果内の`show proc xxx`文を実行して、対応するtabletの各コピーのステータスを確認します。通常、`Version`列のデータに注意する必要があります。

通常、tabletの複数のコピーのVersionは同じであるべきです。そして、それは対応するパーティションのVisibleVersionバージョンと同じです。

`show partitions from tblx`で対応するパーティションバージョンを確認できます（tabletに対応するパーティションは`show tablet`文で取得できます）。

同時に、`show proc`文のCompactionStatus列のURLにアクセスして（ブラウザで開くだけ）、より具体的なバージョン情報を表示し、どのバージョンが欠落しているかを確認することもできます。

長時間自動修復されない場合、`show proc "/cluster_balance"`文を使用して、システムが現在実行しているtablet修復およびスケジューリングタスクを確認する必要があります。多数のtabletがスケジューリングを待機しているため、修復時間が長くなっている可能性があります。`pending_tablets`と`running_tablets`の記録を追跡できます。

さらに、`admin repair`文を使用して、優先的に修復するテーブルまたはパーティションを指定できます。詳細については、`help admin repair`を参照してください。

それでも修復できない場合、複数のレプリカがある状況では、`admin set replica status`コマンドを使用して、問題のあるレプリカを強制的にオフラインにします。詳細については、`help admin set replica status`でレプリカステータスをbadに設定する例を参照してください。（badに設定した後、そのコピーはアクセスされなくなります。そして後で自動的に修復されます。ただし、操作前に他のコピーが正常であることを確認する必要があります）

### Q9. Not connected to 192.168.100.1:8060 yet, server_id=384

このエラーは、インポートやクエリ時に発生する可能性があります。対応するBEログを確認すると、類似のエラーが見つかることもあります。

これはRPCエラーで、通常2つの可能性があります：1. 対応するBEノードがダウンしている。2. rpcの輻輳またはその他のエラー。

BEノードがダウンしている場合、具体的なダウン理由を確認する必要があります。ここではrpc輻輳の問題のみを説明します。

1つのケースはOVERCROWDEDです。これは、rpcソースに閾値を超える大量の未送信データがあることを意味します。BEには関連する2つのパラメータがあります：

1. `brpc_socket_max_unwritten_bytes`：デフォルト値は1GBです。未送信データがこの値を超えるとエラーが報告されます。この値を適切に変更してOVERCROWDEDエラーを回避できます。（ただし、これは対症療法であり、本質的には依然として輻輳が存在します）。
2. `tablet_writer_ignore_eovercrowded`：デフォルトはfalseです。trueに設定すると、Dorisはインポート中のOVERCROWDEDエラーを無視します。このパラメータは主にインポートの失敗を回避し、インポートの安定性を向上させるためのものです。

2つ目は、rpcのパケットサイズがmax_body_sizeを超える場合です。この問題は、クエリに非常に大きなString型やbitmap型がある場合に発生する可能性があります。以下のBEパラメータを変更することで回避できます：

```
brpc_max_body_size：default 3GB.
```
### Q10. [ Broker load ] org.apache.thrift.transport.TTransportException: java.net.SocketException: Broken pipe

インポート時に`org.apache.thrift.transport.TTransportException: java.net.SocketException: Broken pipe`が発生する。

この問題の原因は、外部ストレージ（HDFSなど）からデータをインポートする際に、ディレクトリ内のファイル数が多すぎるため、ファイルディレクトリのリスト化に時間がかかりすぎることにある可能性があります。ここで、Broker RPC Timeoutはデフォルトで10秒となっており、ここでタイムアウト時間を適切に調整する必要があります。

`fe.conf`設定ファイルを変更して、以下のパラメータを追加してください：

```
broker_timeout_ms = 10000
##The default here is 10 seconds, you need to increase this parameter appropriately
```
ここにパラメータを追加するには、FE サービスの再起動が必要です。

### Q11. [ Routine load ] ReasonOfStateChanged: ErrorReason{code=errCode = 104, msg='be 10004 abort task with reason: fetch failed due to requested offset not available on the broker: Broker: Offset out of range'}

この問題の原因は、Kafka の cleanup policy がデフォルトで7日間に設定されていることです。routine load タスクが何らかの理由で中断され、長時間タスクが復旧されない場合、タスクが再開されたときに、routine load が記録している消費 offset と、kafka がクリーンアップした対応する offset との間でこの問題が発生します。

そのため、この問題は alter routine load で解決できます：

kafka の最小 offset を確認し、ALTER ROUTINE LOAD コマンドを使用して offset を変更し、タスクを再開します

```sql
ALTER ROUTINE LOAD FOR db.tb
FROM kafka
(
 "kafka_partitions" = "0",
 "kafka_offsets" = "xxx",
 "property.group.id" = "xxx"
);
```
### Q12. ERROR 1105 (HY000): errCode = 2, detailMessage = (192.168.90.91)[CANCELLED][INTERNAL_ERROR]error setting certificate verify locations:  CAfile: /etc/ssl/certs/ca-certificates.crt CApath: none

```
yum install -y ca-certificates
ln -s /etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt /etc/ssl/certs/ca-certificates.crt
```
### Q13. create partition failed. partition numbers will exceed limit variable max_auto_partition_num

自動パーティション分割されたテーブルにデータをインポートする際に誤って多数のパーティションが作成されることを防ぐため、FE設定項目`max_auto_partition_num`を使用してそのようなテーブルに対して自動的に作成されるパーティションの最大数を制御しています。より多くのパーティションを作成する必要がある場合は、FE Masterノードのこの設定項目を変更してください。
