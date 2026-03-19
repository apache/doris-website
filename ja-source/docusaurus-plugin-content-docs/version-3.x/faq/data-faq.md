---
{
  "title": "データ操作エラー",
  "language": "ja",
  "description": "このドキュメントは主にDorisの使用中におけるデータ操作の一般的な問題を記録するために使用されます。随時更新されます。"
}
---
# Data Operation Error

このドキュメントは主にDorisの使用中にデータ操作でよく発生する問題を記録するために使用されます。随時更新されます。

### Q1. Stream Loadを使用してFEのパブリックネットワークアドレスにアクセスしてデータをインポートするが、イントラネットIPにリダイレクトされる？

stream loadの接続先がFEのhttpポートの場合、FEはBEノードをランダムに選択してhttp 307リダイレクト操作を実行するだけなので、ユーザーのリクエストは実際にはFEによって割り当てられたBEに送信されます。リダイレクトはBEのIPを返します、つまりイントラネットIPです。そのため、FEのパブリックIPを通じてリクエストを送信すると、内部ネットワークアドレスにリダイレクトされるため接続できない可能性が非常に高くなります。

通常の方法は、イントラネットIPアドレスにアクセスできることを確認するか、すべてのBE上位層にロードバランサーを想定し、stream loadリクエストを直接ロードバランサーに送信することです。ロードバランサーはリクエストをBEノードに透過的に転送します。

### Q2. Dorisはカラム名の変更をサポートしていますか？

バージョン1.2.0以降、`"light_schema_change"="true"`オプションが有効になっている場合、カラム名を変更することができます。

バージョン1.2.0より前、または`"light_schema_change"="true"`オプションが有効になっていない場合、カラム名の変更はサポートされていません。理由は以下の通りです：

Dorisはデータベース名、テーブル名、パーティション名、マテリアライズドビュー（Rollup）名、およびカラムタイプ、コメント、デフォルト値などの変更をサポートしています。しかし残念ながら、カラム名の変更は現在サポートされていません。

歴史的な理由により、カラム名は現在データファイルに直接書き込まれています。Dorisがクエリを実行する際も、クラス名を通じて対応するカラムを見つけます。そのため、カラム名の変更は単純なメタデータの変更だけでなく、データの書き換えも伴う、非常に重い操作になります。

将来的に軽量なカラム名変更操作をサポートする互換性のある手段を除外するものではありません。

### Q3. Unique Keyモデルのテーブルはマテリアライズドビューの作成をサポートしていますか？

サポートしていません。

Unique Keyモデルのテーブルはビジネスフレンドリーなテーブルです。プライマリキーに従って重複排除するユニークな機能により、頻繁にデータが変更されるビジネスデータベースと簡単に同期できます。そのため、多くのユーザーはDorisにデータをアクセスする際にまずUnique Keyモデルの使用を検討します。

しかし残念ながら、Unique Keyモデルのテーブルはマテリアライズドビューを作成できません。理由は、マテリアライズドビューの本質が事前計算によってデータを「プリ計算」し、クエリ時に計算されたデータを直接返すことでクエリを高速化することだからです。マテリアライズドビューでは、「プリ計算」されたデータは通常、sumやcountなどの集約指標です。この時、データが変更される場合、例えばupdateやdeleteなどで、プリ計算されたデータは詳細情報を失っているため、同期更新できません。例えば、5という合計値は1+4または2+3である可能性があります。詳細情報の損失により、この合計値がどのように計算されたかを区別できないため、更新のニーズを満たすことができません。

### Q4. tablet writer write failed, tablet_id=27306172, txn_id=28573520, err=-235 or -238

このエラーは通常データインポート操作中に発生します。エラーコードは-235です。このエラーの意味は、対応するtabletのデータバージョンが最大制限（デフォルト500、BEパラメータ`max_tablet_version_num`で制御）を超え、後続の書き込みが拒否されることです。例えば、質問のエラーはtablet 27306172のデータバージョンが制限を超えていることを意味します。

このエラーは通常、インポート頻度が高すぎることが原因で、バックエンドデータのcompaction速度より大きく、バージョンが積み上がり最終的に制限を超えます。この時点で、まずshow tablet 27306172ステートメントを通し、結果でshow procステートメントを実行してtabletの各コピーのステータスを確認できます。結果のversionCountはバージョン数を表します。コピーのバージョンが多すぎることがわかった場合は、インポート頻度を下げるかインポートを停止してバージョン数が減少するかを観察する必要があります。インポートを停止してもバージョン数が減少しない場合は、対応するBEノードに行ってbe.INFOログを確認し、tablet idとcompactionキーワードを検索して、compactionが正常に動作しているかを確認する必要があります。compactionチューニングについては、ApacheDoris公式アカウントの記事を参照できます：[Doris Best Practices - Compaction Tuning (3)](https://mp.weixin.qq.com/s/cZmXEsNPeRMLHp379kc2aA)

-238エラーは通常、同じバッチのインポートデータが大きすぎて、tabletのSegmentファイルが多すぎる（デフォルト200、BEパラメータ`max_segment_num_per_rowset`で制御）場合に発生します。この時は、一度にインポートするデータ量を減らすか、BE設定パラメータ値を適切に増加させて問題を解決することを推奨します。バージョン2.0以降、ユーザーはBE configで`enable_segcompaction=true`を設定してsegment compaction機能を有効にし、segmentファイル数を減らすことができます。

### Q5. tablet 110309738 has few replicas: 1, alive backends: [10003]

このエラーはクエリまたはインポート操作中に発生する可能性があります。通常、対応するtabletのコピーに例外があることを意味します。

この時点で、まずshow backendsコマンドを使用してBEノードがダウンしているかを確認できます。例えば、isAliveフィールドがfalseであるか、LastStartTimeが最近の時間である（最近再起動されたことを示す）場合です。BEがダウンしている場合は、BEに対応するノードに行ってbe.outログを確認する必要があります。BEが異常な理由でダウンしている場合、通常be.outに例外スタックが印刷され、問題のトラブルシューティングに役立ちます。be.outにエラースタックがない場合は、linuxコマンドdmesg -Tを使用して、プロセスがOOMのためにシステムによって強制終了されたかを確認できます。

BEノードがダウンしていない場合は、show tablet 110309738ステートメントを通し、結果でshow procステートメントを実行して各tabletコピーのステータスを確認してさらに調査する必要があります。

### Q6. disk xxxxx on backend xxx exceed limit usage

通常Import、Alterなどの操作で発生します。このエラーは、BEに対応する対応ディスクの使用量がしきい値（デフォルト95%）を超えることを意味します。この場合、まずshow backendsコマンドを使用でき、MaxDiskUsedPctは対応するBEで最も使用量の高いディスクの使用量を表示します。95%を超える場合、このエラーが報告されます。

この時点で、対応するBEノードに行ってデータディレクトリの使用量を確認する必要があります。trashディレクトリとsnapshotディレクトリは手動でクリーンアップしてスペースを解放できます。データディレクトリが大きなスペースを占有している場合は、一部のデータを削除してスペースを解放することを検討する必要があります。詳細については、[Disk Space Management](../admin-manual/maint-monitor/disk-capacity.md)を参照してください。

### Q7. Javaプログラムを通じてstream loadを呼び出してデータをインポートする際、データのバッチが大きい場合にBroken Pipeエラーが発生する可能性があります。

Broken Pipe以外にも、他の奇妙なエラーが発生する可能性があります。

この状況は通常httpv2を有効にした後に発生します。httpv2はspring bootを使用して実装されたhttpサービスで、tomcatをデフォルトの内蔵コンテナとして使用しているためです。しかし、tomcatの307フォワーディングの処理に問題があるようで、その後内蔵コンテナをjettyに変更されました。さらに、javaプログラムのapache http clientのバージョンは4.5.13以降のバージョンを使用する必要があります。以前のバージョンでは、フォワーディングの処理にも問題がありました。

そのため、この問題は2つの方法で解決できます：

1. httpv2を無効にする

   fe.confに`enable_http_server_v2=false`を追加してFEを再起動します。しかし、新バージョンのUIインターフェースは使用できなくなり、httpv2ベースの一部の新しいインターフェースも使用できません。（通常のインポートクエリは影響を受けません）。

2. アップグレード

   Doris 0.15以降にアップグレードすることで、この問題は修正されています。

### Q8. インポートおよびクエリ時にエラー-214が報告される

インポート、クエリなどの操作を実行する際、以下のエラーが発生する可能性があります：

```text
failed to initialize storage reader. tablet=63416.1050661139.aa4d304e7a7aff9c-f0fa7579928c85a0, res=-214, backend=192.168.100.10
```
-214エラーは、対応するタブレットのデータバージョンが不足していることを意味します。例えば、上記のエラーは192.168.100.10のBE上のタブレット63416のコピーのデータバージョンが不足していることを示しています。（他にも類似のエラーコードがある可能性があり、以下の方法で確認・修復できます）。

通常、データに複数のコピーがある場合、システムは自動的にこれらの問題のあるコピーを修復します。以下の手順でトラブルシューティングできます：

まず、`show tablet 63416`文を実行し、結果の`show proc xxx`文を実行して、対応するタブレットの各コピーのステータスを確認します。通常、`Version`列のデータに注意する必要があります。

正常な場合、タブレットの複数のコピーのVersionは同じである必要があります。そして、対応するパーティションのVisibleVersionバージョンと同じです。

`show partitions from tblx`で対応するパーティションバージョンを確認できます（タブレットに対応するパーティションは`show tablet`文で取得できます）。

同時に、`show proc`文のCompactionStatus列のURL（ブラウザで開くだけ）にアクセスして、より具体的なバージョン情報を表示し、どのバージョンが不足しているかを確認することもできます。

長時間自動修復されない場合は、`show proc "/cluster_balance"`文を使用して、システムが現在実行しているタブレット修復とスケジューリングタスクを確認する必要があります。スケジュール待ちの大量のタブレットがあるために修復時間が長くなっている可能性があります。`pending_tablets`と`running_tablets`のレコードを追跡できます。

さらに、`admin repair`文を使用して、優先的に修復するテーブルまたはパーティションを指定できます。詳細については`help admin repair`を参照してください。

それでも修復できない場合は、複数のレプリカがある場合に、`admin set replica status`コマンドを使用して問題のあるレプリカを強制的にオフラインにします。詳細については、`help admin set replica status`のレプリカステータスをbadに設定する例を参照してください。（badに設定すると、そのコピーはアクセスされなくなります。そして後で自動的に修復されます。ただし、操作前に他のコピーが正常であることを確認する必要があります）

### Q9. Not connected to 192.168.100.1:8060 yet, server_id=384

インポートまたはクエリ時にこのエラーが発生する場合があります。対応するBEログを確認すると、同様のエラーが見つかることもあります。

これはRPCエラーで、通常2つの可能性があります：1. 対応するBEノードがダウンしている。2. rpc輻輳またはその他のエラー。

BEノードがダウンしている場合は、具体的なダウン理由を確認する必要があります。ここではrpc輻輳の問題についてのみ説明します。

1つのケースはOVERCROWDEDで、これはrpcソースに閾値を超える大量の未送信データがあることを意味します。BEにはこれに関連する2つのパラメータがあります：

1. `brpc_socket_max_unwritten_bytes`: デフォルト値は1GBです。未送信データがこの値を超えるとエラーが報告されます。この値を適切に変更してOVERCROWDEDエラーを回避できます。（ただし、これは対症療法であり、本質的には依然として輻輳が存在します）。
2. `tablet_writer_ignore_eovercrowded`: デフォルトはfalseです。trueに設定すると、Dorisはインポート中のOVERCROWDEDエラーを無視します。このパラメータは主にインポート失敗を回避し、インポートの安定性を向上させるためのものです。

2つ目は、rpcのパケットサイズがmax_body_sizeを超える場合です。クエリに非常に大きなString型やbitmap型がある場合に、この問題が発生する可能性があります。以下のBEパラメータを変更することで回避できます：

```
brpc_max_body_size：default 3GB.
```
### Q10. [ Broker load ] org.apache.thrift.transport.TTransportException: java.net.SocketException: Broken pipe

インポート中に`org.apache.thrift.transport.TTransportException: java.net.SocketException: Broken pipe`が発生する。

この問題の原因は、外部ストレージ（HDFSなど）からデータをインポートする際に、ディレクトリ内にファイルが多すぎるため、ファイルディレクトリのリストアップに時間がかかりすぎることです。ここでは、Broker RPC Timeoutはデフォルトで10秒となっており、ここでタイムアウト時間を適切に調整する必要があります。

`fe.conf`設定ファイルを修正して、以下のパラメータを追加してください：

```
broker_timeout_ms = 10000
##The default here is 10 seconds, you need to increase this parameter appropriately
```
ここにパラメータを追加するには、FEサービスの再起動が必要です。

### Q11. [ Routine load ] ReasonOfStateChanged: ErrorReason{code=errCode = 104, msg='be 10004 abort task with reason: fetch failed due to requested offset not available on the broker: Broker: Offset out of range'}

この問題の原因は、Kafkaのcleanupポリシーがデフォルトで7日間に設定されていることです。routine loadタスクが何らかの理由で中断され、長期間タスクが復旧されない場合、タスクが再開される際に、routine loadが記録している消費offsetと、kafkaがクリーンアップした対応するoffsetとの間でこの問題が発生します。

この問題はalter routine loadで解決できます：

kafkaの最小offsetを確認し、ALTER ROUTINE LOADコマンドを使用してoffsetを変更し、タスクを再開してください

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

auto-partitionedテーブルのデータインポート時に誤って過剰なパーティションが作成されることを防ぐため、FE設定項目`max_auto_partition_num`を使用してこのようなテーブルに対して自動作成されるパーティションの最大数を制御しています。より多くのパーティションを作成する必要がある場合は、FE Masterノードのこの設定項目を変更してください。
