---
{
  "title": "リリース 2.1.11",
  "language": "ja",
  "description": "動作変更：time_series_max_tablet_version_numは、time-seriesコンパクション戦略を使用するテーブルのバージョンの最大数を制御します。"
}
---
## 動作変更

- `time_series_max_tablet_version_num` は time-series compaction 戦略を使用するテーブルの最大バージョン数を制御します。[#51371](https://github.com/apache/doris/pull/51371)
- ホットコールドティアリング中に HDFS root_path が有効にならない問題を修正しました。[#48441](https://github.com/apache/doris/pull/48441)
- 新しいオプティマイザー（Nereids）において、クエリ内の式の深度または幅が閾値制限を超えた場合、フォールバックが開始されているかどうかに関係なく、クエリは旧オプティマイザーにフォールバックしません。[#52431](https://github.com/apache/doris/pull/52431)
- unicode 名を有効または無効にする際の名前チェックルールを統一しました。現在、非unicode 名ルールは unicode 名ルールの厳密なサブセットとなります。[#53264](https://github.com/apache/doris/pull/53264)

## 新機能

### Query Execution Engine

- routine load job の情報を表示するシステムテーブル `routine_load_job` を導入しました。[#48963](https://github.com/apache/doris/pull/48963)

### Query Optimizer

- MySQL の GROUP BY roll-up 構文 `GROUP BY ... WITH ROLLUP` をサポートしました。[#51978](https://github.com/apache/doris/pull/51978)

## 改善

### Query Optimizer

- aggregate model テーブルと primary key model MOR テーブルでの統計情報収集のパフォーマンスを最適化しました。[#51675](https://github.com/apache/doris/pull/51675)

### Asynchronous Materialized View

- 透過的な書き換えの計画パフォーマンスを最適化しました。[#51309](https://github.com/apache/doris/pull/51309)
- リフレッシュパフォーマンスを最適化しました。[#51493](https://github.com/apache/doris/pull/51493)

## バグ修正

### Data Loading

- `routineload` の属性を変更した後、`show` の表示結果が期待に沿わない問題を修正しました。[#53038](https://github.com/apache/doris/pull/53038)

### レイクハウス 統合

- 特定のケースで Iceberg equality delete のデータ読み取りが不正確になる問題を修正しました。[#51253](https://github.com/apache/doris/pull/51253)
- Kerberos 環境での Iceberg Hadoop カタログ のエラーを修正しました。[#50623](https://github.com/apache/doris/pull/50623) [#52149](https://github.com/apache/doris/pull/52149)
- Kerberos 環境で Iceberg テーブルに書き込み時にトランザクションの送信が失敗する問題を修正しました。[#51508](https://github.com/apache/doris/pull/51508)
- Iceberg テーブルへの書き込み時のトランザクション送信でのエラーを修正しました。[#52716](https://github.com/apache/doris/pull/52716)
- 特定の状況下で Kerberos 環境の Hudi テーブルにアクセスする際のエラーを修正しました。[#51713 ](https://github.com/apache/doris/pull/51713)
- SQL サーバー カタログ が IDENTITY カラム情報の識別をサポートしました。[#51285](https://github.com/apache/doris/pull/51285)
- 一部のケースで Jdbc カタログ テーブルが行数情報を取得できない問題を修正しました。[#50901](https://github.com/apache/doris/pull/50901)
- x86 環境での ORC zlib の解凍パフォーマンスを最適化し、潜在的な問題を修正しました。[#51775](https://github.com/apache/doris/pull/51775)
- Profile に Parquet/ORC 条件フィルタリングと遅延マテリアライゼーションに関連する指標を追加しました。[#51248](https://github.com/apache/doris/pull/51248)
- ORC Footer の読み取りパフォーマンスを最適化しました。[#51117](https://github.com/apache/doris/pull/51117)
- table Valued Function が圧縮 JSON ファイルを読み取れない問題を修正しました。[#51983](https://github.com/apache/doris/pull/51983)
- 一部のケースで同時 catalog 更新により発生するメタデータの不整合問題を修正しました。[#51787](https://github.com/apache/doris/pull/51787)

### Index

- 不正確なクエリ結果を返すことを避けるために、CAST 操作を含む IN 述語を処理する際の転置インデックスのクエリエラーを修正しました。[#50860](https://github.com/apache/doris/pull/50860)
- 異常実行状況での転置インデックスのメモリリーク問題を修正しました。[#52747](https://github.com/apache/doris/pull/52747)

### Semi-structured Data タイプ

- null 値を扱う際に一部の JSON 関数が不正確な結果を返す問題を修正しました。
- JSON 関数に関連する一部のバグを修正しました。[#52543](https://github.com/apache/doris/pull/52543) [#51516](https://github.com/apache/doris/pull/51516)

### Query Optimizer

- 文字列を日付に解析する際に失敗した場合、クエリが実行を継続できない問題を修正しました。[#50900](https://github.com/apache/doris/pull/50900)
- 個別のシナリオで定数畳み込み結果が不正確になる問題を修正しました。[#51738](https://github.com/apache/doris/pull/51738)
- null リテラルを入力として受け取った際に個別の配列関数が正常に計画できない問題を修正しました。[#50899](https://github.com/apache/doris/pull/50899)
- local shuffle の有効化が極端なシナリオで不正確な結果を招く可能性がある問題を修正しました。[#51313](https://github.com/apache/doris/pull/51313) [#52871 ](https://github.com/apache/doris/pull/52871)
- `replace view` により `desc view` 使用時にカラム情報が表示されなくなる可能性がある問題を修正しました。[#52043](https://github.com/apache/doris/pull/52043)
- 非マスター FE ノードで `prepare command` が正しく実行されない可能性がある問題を修正しました。[#52265](https://github.com/apache/doris/pull/52265)

### Asynchronous Materialized View

- ベーステーブルのカラムのデータ型が変更された際に、透過的な書き換え後にクエリの失敗が発生する可能性がある問題を修正しました。[#50730](https://github.com/apache/doris/pull/50730)
- 個別のシナリオで透過的な書き換えにおける不正確なパーティション補正の問題を修正しました。[#51899](https://github.com/apache/doris/pull/51899) [#52218](https://github.com/apache/doris/pull/52218)

### Query Execution Engine

- variant カラムタイプに遭遇した際に TopN 計算が core dump する可能性がある問題を修正しました。[#52573](https://github.com/apache/doris/pull/52573)
- 不正確なデータを入力した際に `bitmap_from_base64` 関数が core dump する問題を修正しました。[#53018](https://github.com/apache/doris/pull/53018)
- 超大量のデータを処理する際の `bitmap_union` 関数の一部不正確な結果の問題を修正しました。[#52033](https://github.com/apache/doris/pull/52033)
- ウィンドウ関数で使用された際の `multi_distinct_group_concat` の計算エラーを修正しました。[#51875](https://github.com/apache/doris/pull/51875)
- 極値で `array_map` 関数が core dump する可能性がある問題を修正しました。[#51618](https://github.com/apache/doris/pull/51618) [#50913](https://github.com/apache/doris/pull/50913)
- 不正確なタイムゾーン処理の問題を修正しました。[#51454](https://github.com/apache/doris/pull/51454)

### その他

- マスター FE と非マスター FE 間でのマルチステートメントの動作不一致を修正しました。[#52632](https://github.com/apache/doris/pull/52632)
- 非マスター FE での prepared statement のエラーを修正しました。[#48689](https://github.com/apache/doris/pull/48689)
- rollup 操作が CCR 中断を引き起こす可能性がある問題を修正しました。[#50830](https://github.com/apache/doris/pull/50830)
