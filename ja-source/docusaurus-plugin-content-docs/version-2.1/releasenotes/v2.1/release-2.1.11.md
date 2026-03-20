---
{
  "title": "リリース 2.1.11",
  "language": "ja",
  "description": "動作変更：`time_series_max_tablet_version_num`は、時系列compaction戦略を使用するテーブルのバージョン数の最大値を制御します。"
}
---
## 動作変更

- `time_series_max_tablet_version_num`は、time-series圧縮戦略を使用するテーブルの最大バージョン数を制御します。[#51371](https://github.com/apache/doris/pull/51371)
- ホット・コールド階層化中にHDFS root_pathが有効にならない問題を修正しました。[#48441](https://github.com/apache/doris/pull/48441)
- 新しいオプティマイザー（Nereids）では、クエリ内の式の深度または幅がしきい値制限を超える場合、フォールバックが開始されているかどうかに関係なく、クエリは古いオプティマイザーにフォールバックしません。[#52431](https://github.com/apache/doris/pull/52431)
- unicode名の有効化または無効化の名前チェックルールを統一しました。現在、非unicode名ルールはunicode名ルールの厳密なサブセットです。[#53264](https://github.com/apache/doris/pull/53264)

## 新機能

### Query Execution Engine

- routine loadジョブに関する情報を表示するためのシステムテーブル`routine_load_job`を導入しました。[#48963](https://github.com/apache/doris/pull/48963)

### Query Optimizer

- MySQLの`GROUP BY ... WITH ROLLUP`構文をサポートしました。[#51978](https://github.com/apache/doris/pull/51978)

## 改善

### Query Optimizer

- aggregate modelテーブルおよびprimary key model MORテーブルでの統計情報収集のパフォーマンスを最適化しました。[#51675](https://github.com/apache/doris/pull/51675)

### Asynchronous Materialized View

- 透過的リライトの計画パフォーマンスを最適化しました。[#51309](https://github.com/apache/doris/pull/51309) 
- リフレッシュパフォーマンスを最適化しました。[#51493](https://github.com/apache/doris/pull/51493)

## バグ修正

### Data Loading

- `routineload`の属性を変更した後、`show`の表示結果が期待に応えない問題を修正しました。[#53038](https://github.com/apache/doris/pull/53038)

### レイクハウス 統合

- 特定のケースでIceberg equality deleteの不正なデータ読み取りの問題を修正しました。[#51253](https://github.com/apache/doris/pull/51253)
- Kerberos環境でのIceberg Hadoop カタログのエラーを修正しました。[#50623](https://github.com/apache/doris/pull/50623) [#52149](https://github.com/apache/doris/pull/52149)
- Kerberos環境でIcebergテーブルに書き込む際のトランザクション送信失敗の問題を修正しました。[#51508](https://github.com/apache/doris/pull/51508)
- Icebergテーブルに書き込む際のトランザクション送信でのエラーを修正しました。[#52716](https://github.com/apache/doris/pull/52716)
- 特定の状況下でKerberos環境でHudiテーブルにアクセスする際のエラーを修正しました。[#51713 ](https://github.com/apache/doris/pull/51713)
- SQL サーバー カタログでIDENTITY列情報の識別をサポートしました。[#51285](https://github.com/apache/doris/pull/51285)
- 一部のケースでJdbc カタログテーブルが行数情報を取得できない問題を修正しました。[#50901](https://github.com/apache/doris/pull/50901)
- x86環境でのORC zlib解凍パフォーマンスを最適化し、潜在的な問題を修正しました。[#51775](https://github.com/apache/doris/pull/51775)
- ProfileにParquet/ORC条件フィルタリングと遅延マテリアライゼーションに関連する指標を追加しました。[#51248](https://github.com/apache/doris/pull/51248)
- ORC Footerの読み取りパフォーマンスを最適化しました。[#51117](https://github.com/apache/doris/pull/51117)
- table Valued Functionが圧縮JSONファイルを読み取れない問題を修正しました。[#51983](https://github.com/apache/doris/pull/51983)
- 一部のケースでの同時catalog refreshによるメタデータ不整合の問題を修正しました。[#51787](https://github.com/apache/doris/pull/51787)

### Index

- CAST操作を含むIN述語を処理する際の転置インデックスのクエリエラーを修正し、不正なクエリ結果の返却を回避しました。[#50860](https://github.com/apache/doris/pull/50860)
- 異常実行状況での転置インデックスのメモリリーク問題を修正しました。[#52747](https://github.com/apache/doris/pull/52747)

### Semi-structured Data タイプ

- 一部のJSON関数がnull値を扱う際に不正な結果を返す問題を修正しました。
- JSON関数に関連する一部のバグを修正しました。[#52543](https://github.com/apache/doris/pull/52543) [#51516](https://github.com/apache/doris/pull/51516) 

### Query Optimizer

- 文字列を日付に解析するのに失敗した際にクエリが実行を継続できない問題を修正しました。[#50900](https://github.com/apache/doris/pull/50900)
- 個別のシナリオでの不正な定数畳み込み結果の問題を修正しました。[#51738](https://github.com/apache/doris/pull/51738)
- 個別の配列関数が入力としてnullリテラルに遭遇した際に正常に計画できない問題を修正しました。[#50899](https://github.com/apache/doris/pull/50899)
- local shuffleを有効にすることで極端なシナリオで不正な結果につながる可能性がある問題を修正しました。[#51313](https://github.com/apache/doris/pull/51313) [#52871 ](https://github.com/apache/doris/pull/52871)
- `replace view`が`desc view`使用時に列情報が見えなくなる原因となる可能性がある問題を修正しました。[#52043](https://github.com/apache/doris/pull/52043) 
- 非マスターFEノードで`prepare command`が正しく実行されない可能性がある問題を修正しました。[#52265](https://github.com/apache/doris/pull/52265)

### Asynchronous Materialized View

- ベーステーブル列のデータ型が変更された後、透過的リライト後にクエリ失敗が発生する可能性がある問題を修正しました。[#50730](https://github.com/apache/doris/pull/50730)
- 個別のシナリオでの透過的リライトでの不正なパーティション補償の問題を修正しました。[#51899](https://github.com/apache/doris/pull/51899) [#52218](https://github.com/apache/doris/pull/52218)

### Query Execution Engine

- variant列タイプに遭遇した際にTopN計算でcore dumpが発生する可能性がある問題を修正しました。[#52573](https://github.com/apache/doris/pull/52573) 
- 不正なデータを入力した際に関数`bitmap_from_base64`がcore dumpする問題を修正しました。[#53018](https://github.com/apache/doris/pull/53018) 
- 超大量のデータを扱う際の`bitmap_union`関数の一部の不正な結果の問題を修正しました。[#52033](https://github.com/apache/doris/pull/52033)
- ウィンドウ関数で使用された際の`multi_distinct_group_concat`の計算エラーを修正しました。[#51875](https://github.com/apache/doris/pull/51875)
- 極端な値で`array_map`関数がcore dumpする可能性がある問題を修正しました。[#51618](https://github.com/apache/doris/pull/51618) [#50913](https://github.com/apache/doris/pull/50913)
- 不正なタイムゾーン処理の問題を修正しました。[#51454](https://github.com/apache/doris/pull/51454) 

### Others

- マスターFEと非マスターFE間でのマルチステートメントの一貫性のない動作を修正しました。[#52632](https://github.com/apache/doris/pull/52632)
- 非マスターFEでのprepared statementのエラーを修正しました。[#48689](https://github.com/apache/doris/pull/48689)
- rollup操作がCCR中断を引き起こす可能性がある問題を修正しました。[#50830](https://github.com/apache/doris/pull/50830)
