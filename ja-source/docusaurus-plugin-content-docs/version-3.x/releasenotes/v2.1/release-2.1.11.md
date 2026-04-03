---
{
  "title": "リリース 2.1.11",
  "language": "ja",
  "description": "動作変更：`time_series_max_tablet_version_num`は、time-seriesコンパクション戦略を使用するテーブルのバージョン最大数を制御します。"
}
---
## 動作変更

- `time_series_max_tablet_version_num`は、time-seriesコンパクション戦略を使用するテーブルの最大バージョン数を制御します。[#51371](https://github.com/apache/doris/pull/51371)
- ホット・コールドティアリング時にHDFSのroot_pathが有効にならない問題を修正しました。[#48441](https://github.com/apache/doris/pull/48441)
- 新しいオプティマイザー(Nereids)において、クエリ内の式の深さや幅が閾値制限を超えた場合、フォールバックが開始されているかどうかに関係なく、クエリは旧オプティマイザーにフォールバックしなくなります。[#52431](https://github.com/apache/doris/pull/52431)
- unicode名の有効化または無効化のための名前チェックルールを統一しました。現在、非unicode名ルールはunicode名ルールの厳密なサブセットとなっています。[#53264](https://github.com/apache/doris/pull/53264)

## 新機能

### Query Execution Engine

- routine loadジョブの情報を表示するためのシステムテーブル`routine_load_job`を導入しました。[#48963](https://github.com/apache/doris/pull/48963)

### Query Optimizer

- MySQLの`GROUP BY ... WITH ROLLUP`というGROUP BY roll-up構文をサポートしました。[#51978](https://github.com/apache/doris/pull/51978)

## 改善

### Query Optimizer

- aggregateモデルテーブルとprimary keyモデルMORテーブルでの統計情報収集のパフォーマンスを最適化しました。[#51675](https://github.com/apache/doris/pull/51675)

### Asynchronous Materialized View

- 透過的リライトの計画パフォーマンスを最適化しました。[#51309](https://github.com/apache/doris/pull/51309)
- リフレッシュパフォーマンスを最適化しました。[#51493](https://github.com/apache/doris/pull/51493)

## バグ修正

### Data Loading

- `routineload`の属性を変更した後、`show`の表示結果が期待に沿わない問題を修正しました。[#53038](https://github.com/apache/doris/pull/53038)

### レイクハウス 統合

- 特定のケースでIceberg equality deleteのデータ読み取りが不正確な問題を修正しました。[#51253](https://github.com/apache/doris/pull/51253)
- Kerberos環境でのIceberg Hadoop カタログのエラーを修正しました。[#50623](https://github.com/apache/doris/pull/50623) [#52149](https://github.com/apache/doris/pull/52149)
- Kerberos環境でIcebergテーブルへの書き込み時にトランザクション送信が失敗する問題を修正しました。[#51508](https://github.com/apache/doris/pull/51508)
- Icebergテーブルへの書き込み時のトランザクション送信エラーを修正しました。[#52716](https://github.com/apache/doris/pull/52716)
- 特定の状況下でKerberos環境においてHudiテーブルにアクセスする際のエラーを修正しました。[#51713](https://github.com/apache/doris/pull/51713)
- SQL サーバー カタログがIDENTITYカラム情報の識別をサポートしました。[#51285](https://github.com/apache/doris/pull/51285)
- 一部のケースでJdbc カタログテーブルが行数情報を取得できない問題を修正しました。[#50901](https://github.com/apache/doris/pull/50901)
- x86環境でのORC zlibの解凍パフォーマンスを最適化し、潜在的な問題を修正しました。[#51775](https://github.com/apache/doris/pull/51775)
- ProfileにParquet/ORCの条件フィルタリングと遅延実体化に関連する指標を追加しました。[#51248](https://github.com/apache/doris/pull/51248)
- ORC Footerの読み取りパフォーマンスを最適化しました。[#51117](https://github.com/apache/doris/pull/51117)
- table Valued Functionが圧縮されたJSONファイルを読み取れない問題を修正しました。[#51983](https://github.com/apache/doris/pull/51983)
- 一部のケースで並行カタログリフレッシュによって引き起こされるメタデータの不整合の問題を修正しました。[#51787](https://github.com/apache/doris/pull/51787)

### Index

- 不正確なクエリ結果を返すことを避けるため、CAST操作を含むIN述語を処理する際の転置インデックスのクエリエラーを修正しました。[#50860](https://github.com/apache/doris/pull/50860)
- 異常実行状況における転置インデックスのメモリリーク問題を修正しました。[#52747](https://github.com/apache/doris/pull/52747)

### Semi-structured Data タイプ

- null値を扱う際に一部のJSON関数が不正確な結果を返す問題を修正しました。
- JSON関数に関連するいくつかのバグを修正しました。[#52543](https://github.com/apache/doris/pull/52543) [#51516](https://github.com/apache/doris/pull/51516)

### Query Optimizer

- 文字列を日付に解析する際に失敗した場合にクエリが実行を続行できない問題を修正しました。[#50900](https://github.com/apache/doris/pull/50900)
- 個別のシナリオにおける定数畳み込み結果が不正確な問題を修正しました。[#51738](https://github.com/apache/doris/pull/51738)
- 一部のarray関数がnullリテラルを入力として受け取った際に正常に計画できない問題を修正しました。[#50899](https://github.com/apache/doris/pull/50899)
- local shuffleの有効化が極端なシナリオで不正確な結果を引き起こす可能性がある問題を修正しました。[#51313](https://github.com/apache/doris/pull/51313) [#52871](https://github.com/apache/doris/pull/52871)
- `replace view`が`desc view`使用時にカラム情報が表示されなくなる可能性がある問題を修正しました。[#52043](https://github.com/apache/doris/pull/52043)
- 非masterFEノードで`prepare command`が正しく実行されない可能性がある問題を修正しました。[#52265](https://github.com/apache/doris/pull/52265)

### Asynchronous Materialized View

- ベーステーブルカラムのデータ型が変更された後、透過的リライト後にクエリエラーが発生する可能性がある問題を修正しました。[#50730](https://github.com/apache/doris/pull/50730)
- 個別のシナリオにおける透過的リライトでのパーティション補正が不正確な問題を修正しました。[#51899](https://github.com/apache/doris/pull/51899) [#52218](https://github.com/apache/doris/pull/52218)

### Query Execution Engine

- variantカラム型に遭遇した際にTopN計算でcore dumpが発生する可能性がある問題を修正しました。[#52573](https://github.com/apache/doris/pull/52573)
- `bitmap_from_base64`関数が不正なデータを入力した際にcore dumpする問題を修正しました。[#53018](https://github.com/apache/doris/pull/53018)
- 超大量データを扱う際の`bitmap_union`関数の一部不正な結果の問題を修正しました。[#52033](https://github.com/apache/doris/pull/52033)
- window関数内で使用された際の`multi_distinct_group_concat`の計算エラーを修正しました。[#51875](https://github.com/apache/doris/pull/51875)
- `array_map`関数が極値でcore dumpする可能性がある問題を修正しました。[#51618](https://github.com/apache/doris/pull/51618) [#50913](https://github.com/apache/doris/pull/50913)
- タイムゾーン処理が不正確な問題を修正しました。[#51454](https://github.com/apache/doris/pull/51454)

### その他

- masterFEと非masterFE間でのマルチステートメントの動作の不整合を修正しました。[#52632](https://github.com/apache/doris/pull/52632)
- 非masterFEでのprepared statementsのエラーを修正しました。[#48689](https://github.com/apache/doris/pull/48689)
- rollup操作がCCR中断を引き起こす可能性がある問題を修正しました。[#50830](https://github.com/apache/doris/pull/50830)
