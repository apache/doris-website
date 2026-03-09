---
{
  "title": "リリース 2.1.11",
  "language": "ja",
  "description": "動作変更: time_series_max_tablet_version_num は、time-series compaction戦略を使用するテーブルの最大バージョン数を制御します。"
}
---
## 動作変更

- `time_series_max_tablet_version_num`は、時系列compaction戦略を使用するテーブルの最大バージョン数を制御します。[#51371](https://github.com/apache/doris/pull/51371)
- ホット・コールドティアリング中にHDFS root_pathが有効にならない問題を修正しました。[#48441](https://github.com/apache/doris/pull/48441)
- 新しいoptimizer（Nereids）において、クエリ内の式の深度または幅が閾値制限を超えた場合、フォールバックが開始されているかどうかに関係なく、クエリは旧optimizerにフォールバックしなくなります。[#52431](https://github.com/apache/doris/pull/52431)
- unicode名の有効化または無効化の名前チェックルールを統一しました。現在、非unicode名ルールはunicode名ルールの厳密なサブセットとなっています。[#53264](https://github.com/apache/doris/pull/53264)

## 新機能

### Query Execution Engine

- routine loadジョブの情報を表示するためのシステムテーブル`routine_load_job`を導入しました。[#48963](https://github.com/apache/doris/pull/48963)

### Query Optimizer

- MySQLのGROUP BY roll-up構文`GROUP BY ... WITH ROLLUP`をサポートしました。[#51978](https://github.com/apache/doris/pull/51978)

## 改善

### Query Optimizer

- aggregateモデルテーブルおよびprimary keyモデルMORテーブルでの統計情報収集のパフォーマンスを最適化しました。[#51675](https://github.com/apache/doris/pull/51675)

### Asynchronous Materialized View

- 透過的なリライトの計画パフォーマンスを最適化しました。[#51309](https://github.com/apache/doris/pull/51309)
- リフレッシュパフォーマンスを最適化しました。[#51493](https://github.com/apache/doris/pull/51493)

## バグ修正

### Data Loading

- `routineload`の属性を変更した後、`show`の表示結果が期待通りにならない問題を修正しました。[#53038](https://github.com/apache/doris/pull/53038)

### Lakehouse Integration

- 特定の場合においてIceberg equality deleteで不正確なデータ読み取りが発生する問題を修正しました。[#51253](https://github.com/apache/doris/pull/51253)
- Kerberos環境でのIceberg Hadoop Catalogのエラーを修正しました。[#50623](https://github.com/apache/doris/pull/50623) [#52149](https://github.com/apache/doris/pull/52149)
- Kerberos環境でIcebergテーブルに書き込む際のトランザクション送信失敗の問題を修正しました。[#51508](https://github.com/apache/doris/pull/51508)
- Icebergテーブルに書き込む際のトランザクション送信エラーを修正しました。[#52716](https://github.com/apache/doris/pull/52716)
- 特定の状況下でKerberos環境のHudiテーブルにアクセスする際のエラーを修正しました。[#51713 ](https://github.com/apache/doris/pull/51713)
- SQL Server CatalogがIDENTITY列情報の識別をサポートするようになりました。[#51285](https://github.com/apache/doris/pull/51285)
- 一部の場合においてJdbc Catalogテーブルが行数情報を取得できない問題を修正しました。[#50901](https://github.com/apache/doris/pull/50901)
- x86環境でのORC zlib解凍パフォーマンスを最適化し、潜在的な問題を修正しました。[#51775](https://github.com/apache/doris/pull/51775)
- ProfileにParquet/ORC条件フィルタリングおよび遅延マテリアライゼーションに関連する指標を追加しました。[#51248](https://github.com/apache/doris/pull/51248)
- ORC Footerの読み取りパフォーマンスを最適化しました。[#51117](https://github.com/apache/doris/pull/51117)
- Table Valued Functionが圧縮JSONファイルを読み取れない問題を修正しました。[#51983](https://github.com/apache/doris/pull/51983)
- 一部の場合において並行catalogリフレッシュが原因で発生するメタデータの不整合問題を修正しました。[#51787](https://github.com/apache/doris/pull/51787)

### Index

- CAST操作を含むIN述語を処理する際の転置インデックスのクエリエラーを修正し、不正確なクエリ結果が返されることを防ぎました。[#50860](https://github.com/apache/doris/pull/50860)
- 異常実行状況における転置インデックスのメモリリーク問題を修正しました。[#52747](https://github.com/apache/doris/pull/52747)

### Semi-structured Data Type

- 一部のJSON関数がnull値を処理する際に不正確な結果を返す問題を修正しました。
- JSON関数に関連するいくつかのバグを修正しました。[#52543](https://github.com/apache/doris/pull/52543) [#51516](https://github.com/apache/doris/pull/51516)

### Query Optimizer

- 文字列を日付にパースする際に失敗した場合、クエリの実行を継続できない問題を修正しました。[#50900](https://github.com/apache/doris/pull/50900)
- 個別のシナリオにおける定数畳み込み結果が不正確になる問題を修正しました。[#51738](https://github.com/apache/doris/pull/51738)
- 個別の配列関数がnullリテラルを入力として受け取った際に正常に計画できない問題を修正しました。[#50899](https://github.com/apache/doris/pull/50899)
- local shuffleを有効にすることで極端なシナリオで不正確な結果が発生する可能性がある問題を修正しました。[#51313](https://github.com/apache/doris/pull/51313) [#52871 ](https://github.com/apache/doris/pull/52871)
- `replace view`が原因で`desc view`使用時に列情報が表示されなくなる可能性がある問題を修正しました。[#52043](https://github.com/apache/doris/pull/52043)
- 非masterFEノードで`prepare command`が正しく実行されない可能性がある問題を修正しました。[#52265](https://github.com/apache/doris/pull/52265)

### Asynchronous Materialized View

- ベーステーブル列のデータ型が変更された後の透過的リライト後にクエリ失敗が発生する可能性がある問題を修正しました。[#50730](https://github.com/apache/doris/pull/50730)
- 個別のシナリオにおける透過的リライトでのパーティション補償が不正確になる問題を修正しました。[#51899](https://github.com/apache/doris/pull/51899) [#52218](https://github.com/apache/doris/pull/52218)

### Query Execution Engine

- variant列タイプに遭遇した際にTopN計算がcore dumpする可能性がある問題を修正しました。[#52573](https://github.com/apache/doris/pull/52573)
- 不正確なデータを入力した際に`bitmap_from_base64`関数がcore dumpする問題を修正しました。[#53018](https://github.com/apache/doris/pull/53018)
- 超大量データを処理する際の`bitmap_union`関数の一部の不正確な結果の問題を修正しました。[#52033](https://github.com/apache/doris/pull/52033)
- ウィンドウ関数で使用された際の`multi_distinct_group_concat`の計算エラーを修正しました。[#51875](https://github.com/apache/doris/pull/51875)
- 極値で`array_map`関数がcore dumpする可能性がある問題を修正しました。[#51618](https://github.com/apache/doris/pull/51618) [#50913](https://github.com/apache/doris/pull/50913)
- 不正確なタイムゾーン処理の問題を修正しました。[#51454](https://github.com/apache/doris/pull/51454)

### Others

- masterFEと非masterFE間のマルチステートメントの一貫性のない動作を修正しました。[#52632](https://github.com/apache/doris/pull/52632)
- 非masterFEでのprepared statementのエラーを修正しました。[#48689](https://github.com/apache/doris/pull/48689)
- rollup操作がCCR中断を引き起こす可能性がある問題を修正しました。[#50830](https://github.com/apache/doris/pull/50830)
