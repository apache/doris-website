---
{
    "title": "Timestamp Oracle (TSO)",
    "language": "ja",
    "description": "TSO の設定、状態確認、復旧、時刻の巻き戻り時の動作。"
}
---

<version since="dev">

</version>

## 概要 {#overview}

Timestamp Oracle (TSO) は Master FE 上で単調増加するタイムスタンプを割り当て、Doris のトランザクションと増分処理に共通の順序基準を提供します。現在は dev 版でのみ利用でき、FE 設定の `enable_feature_changelog` で制御します。この設定のデフォルトは `false` です。物理部分は先行して進むことがあるため、TSO は正確な実時刻を示す値ではありません。

## 基本的な使い方 {#basic-usage}

1. `enable_feature_changelog = true` を FE の設定ファイル `fe.conf` に設定し、FE を再起動します。この試験的な設定は動的に変更できません。すべての FE で設定を統一してください。変更前に、Changelog を有効にすることによるクラスタへの影響を評価してください。
2. クラスタに稼働可能な Master FE があることを確認し、有効な Doris の認証情報を用意します。
3. 読み取り専用の状態確認エンドポイントにクエリを送ります。次のコマンドはデフォルトの HTTP ポートを使用し、root のパスワード入力を求めます。

```bash
curl --user root http://127.0.0.1:8030/api/tso
```

成功時のレスポンスでは `code = 0` となり、`data` に割り当てカーソル、物理時刻、論理カウンター、ウィンドウの終端が含まれます。Master FE 以外に送られたリクエストは、デフォルトで Master FE に転送されます。レスポンスの完全な例は [TSO Action](../open-api/fe-http/tso-action.md) を参照してください。

リクエストを受け取った FE のローカル状態を確認するには、次を使用します。

```bash
curl --user root 'http://127.0.0.1:8030/api/tso?local=true'
```

この呼び出しではタイムスタンプは割り当てられません。ローカル状態は初期化されていない場合があります。また、Master FE 以外のローカルな結果は、現在の Master FE の割り当て状態を表しません。

## タイムスタンプの形式と復旧 {#timestamp-format-and-recovery}

TSO は、ミリ秒単位の物理部分と 18 ビットの論理カウンターを含む 64 ビット整数です。同じ物理ミリ秒内では、カウンターを増やすことで後続の割り当て値を大きくします。物理部分が進むと、カウンターは初期値に戻ります。

Master FE は将来の割り当てウィンドウを予約し、その境界をコミット済みの TSO 状態とともに永続化します。起動時や Master FE のフェイルオーバー時には、サービスがこの状態を再生し、安全な開始点に調整してからタイムスタンプを割り当てます。永続化は現行の実装に含まれており、TSO 用のジャーナルやチェックポイントのスイッチを別途有効にする必要はありません。

## 設定リファレンス {#configuration-reference}

以下は FE の設定項目です。詳しくは [FE 設定](../config/fe-config.md) を参照してください。基本スイッチの `enable_feature_changelog` は `boolean` 型で、デフォルトは `false` です。動的に変更できず、Master FE だけに適用される設定でもありません。

| パラメータ | 型 | デフォルト | 動的変更可能 | Master FE のみ | 説明 |
| --- | --- | --- | --- | --- | --- |
| `tso_service_update_interval_ms` | int | `50 ms` | false | true | 割り当てウィンドウの更新を確認する間隔。 |
| `tso_max_update_retry_count` | int | `3` | true | true | TSO 状態の更新を試行する最大回数。 |
| `tso_max_get_retry_count` | int | `10` | true | true | 失敗を報告するまでに TSO の割り当てを試行する最大回数。 |
| `tso_service_window_duration_ms` | int | `1000 ms` | true | true | 予約する割り当てウィンドウの長さ。定期的な永続化の間隔の上限も定めます。 |
| `tso_clock_backward_startup_threshold_ms` | long | `1800000 ms` | true | true | 起動時の調整において、再生したウィンドウの終端とシステムクロックとの差として許容する最大値。 |
| `tso_time_offset_debug_mode` | int | `0 ms` | true | false | テスト専用の時刻オフセット。通常運用では使用しないでください。 |
| `enable_tso_forward_when_counter_full` | boolean | `true` | true | true | 論理カウンターが容量の半分を超え、実時刻の進みが不十分な場合に、物理部分を 1 ms 進めます。 |

## エラーと注意事項 {#errors-and-caveats}

- 再生したウィンドウの境界がシステムクロックより `tso_clock_backward_startup_threshold_ms` を超えて先行している場合、起動時の調整は失敗します。サービスは新しい TSO を安全に割り当てられません。時刻同期、永続化された状態、FE のログを確認してください。
- 実行中に時刻の巻き戻りが起きると、サービスは直ちに停止する代わりに警告とメトリクスを出力します。物理時刻が進められない場合は論理カウンターを使い切る可能性があり、割り当ての再試行回数を使い切ると、TSO を必要とするトランザクションが失敗することがあります。
- `/api/tso` が返すのはある時点のスナップショットであり、論理カウンターは消費しません。値がゼロである場合も、スナップショットが正常に見える場合も、それだけで初期化状態やトランザクションのコミットを確認したことにはなりません。
- `information_schema.rowsets.COMMIT_TSO` は rowset の TSO 範囲を表す文字列であり、単一の BIGINT ではありません。詳しくは [rowsets](../system-tables/information_schema/rowsets.md) を参照してください。

## ベストプラクティス {#best-practices}

FE の時刻を同期し、HTTP エンドポイントで状態を確認してください。調整や割り当ての失敗を診断する際は FE のログを使用します。意図的なテスト以外では、デバッグ用の時刻オフセットを変更しないでください。基本スイッチは、Changelog とそれに依存する機能への影響を評価したうえで有効にしてください。実時刻の値を取得することだけを目的に有効にすべきではありません。
