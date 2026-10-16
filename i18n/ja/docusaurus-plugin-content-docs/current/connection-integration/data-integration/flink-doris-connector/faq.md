---
{
    "title": "FAQ（よくある質問）",
    "language": "ja",
    "description": "Flink Doris Connector の使用時によく発生するエラーと疑問について説明します。ラベルの重複、トランザクションの期限切れ、実行中のトランザクション数の超過、ダーティデータ、307 リダイレクトなどを扱います。"
}
---

# FAQ（よくある質問）

書き込み側のエラーの多くは、書き込みモードと二段階コミットに関係しています。まず[書き込みモード](./write.md#write-modes)を参照してください。

**1. errCode = 2, detailMessage = Label [label_0_1] has already been used, relate to txn [19650]**

Exactly-Once を使用する場合、Flink ジョブの再起動時には最新の Checkpoint/Savepoint から開始する必要があります。そうしないと、上記のエラーが報告されます。Exactly-Once が不要な場合は、2PC コミットを無効にする（`sink.enable-2pc=false`）か、別の `sink.label-prefix` を使用することでも解決できます。

**2. errCode = 2, detailMessage = transaction [19650] not found**

このエラーは Commit フェーズで発生します。Checkpoint に記録されたトランザクション ID が FE 側で期限切れになっています。この時点で再度コミットすると、上記のエラーが発生します。この場合、その Checkpoint から開始することはできません。`streaming_label_keep_max_second` 設定を `fe.conf` で変更すると、保持期間を延長できます（デフォルトは 12 時間）。Doris 2.0 以降は、`label_num_threshold` 設定（`fe.conf` 内）による制限も受けます（デフォルトは 2000）。この値を増やすか、-1 に設定できます（-1 の場合は時間による制限のみが適用されます）。

**3. errCode = 2, detailMessage = current running txns on db 10006 is 100, larger than limit 100**

このエラーは、同じデータベースへの同時インポート数が 100 を超えると発生します。`max_running_txn_num_per_db` パラメータを `fe.conf` で調整すると解決できます。詳しくは、[max_running_txn_num_per_db](../../../admin-manual/config/fe-config.md#max_running_txn_num_per_db)を参照してください。また、ラベルを頻繁に変更してジョブを再起動することでも、このエラーが発生する場合があります。2pc を使用する場合（Duplicate/Aggregate モデル）、各ジョブのラベルは一意である必要があります。Checkpoint から再起動した場合にのみ、Flink ジョブは事前コミットに成功したものの、まだコミットされていない以前のトランザクションを自動的に中止します。ラベルを頻繁に変更して再起動すると、事前コミットに成功した多数のトランザクションを中止できず、トランザクション枠を占有します。Unique モデルでは、2pc を無効にして冪等な書き込みを実現することもできます。

**4. tablet writer write failed, tablet_id=190958, txn_id=3505530, err=-235**

通常、このエラーは Connector 1.1.0 より前のバージョンで発生し、書き込み頻度が高すぎてバージョン数が増えすぎることが原因です。`sink.batch.size` と `sink.batch.interval` パラメータを設定すると、Stream Load の実行頻度を下げられます。Connector 1.1.0 以降では、デフォルトで書き込みタイミングが Checkpoint によって制御されるため、Checkpoint の間隔を延ばすことで書き込み頻度を下げられます。

**5. Flink でのインポートにダーティデータがある場合、どうすればスキップできますか？**

Flink でのデータインポート時にダーティデータ（フィールドの形式や長さに関する問題など）があると、Stream Load がエラーを報告し、Flink は再試行を続けます。これをスキップするには、Stream Load の strict mode を無効にする（`strict_mode=false`、`max_filter_ratio=1`）か、Sink オペレーターの前でデータをフィルタリングします。

**6. Flink マシンと BE マシンの間で通信できない場合、どう設定すればよいですか？**

Flink が Doris への書き込みを開始すると、Doris は書き込み先を BE にリダイレクトします。このとき返されるアドレスは、BE の内部 IP（つまり、`show backends` で確認できる IP）です。Flink と Doris の間で通信できない場合は、エラーが報告されます。この場合、`benodes` に BE の外部 IP を設定できます。

**7. stream load error: HTTP/1.1 307 Temporary Redirect**

Flink は最初に FE にリクエストを送信します。307 レスポンスを受け取ると、リダイレクト先の BE にリクエストを送信します。FE が FullGC 中、高負荷状態、またはネットワーク遅延が発生している場合、HttpClient はデフォルトで一定時間（3 秒）が経過してもレスポンスを受け取れなければデータを送信します。リクエスト本文はデフォルトで InputStream であるため、その後 307 レスポンスを受け取ってもデータを再送できず、直ちにエラーが報告されます。解決方法は次の三つです。

1. Connector 25.1.0 以降にアップグレードします。このバージョンでは、デフォルトの待機時間が延長されています。
2. `auto-redirect=false` を設定し、リクエストを BE に直接送信します（一部のクラウド環境では適用できません）。
3. 主キーモデルでは、バッチモードを有効にできます。
