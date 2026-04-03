---
{
  "title": "リリース 4.0.1",
  "language": "ja",
  "description": "その他"
}
---
# 動作変更

- SHOW PARTITIONSコマンドはIcebergテーブルをサポートしなくなりました。パーティションを表示するには、Icebergの$partitionsシステムテーブルを直接使用してください。[#56985](https://github.com/apache/doris/pull/56985)

# 新機能

- 他のサードパーティライブラリと一致するハッシュ結果を生成するmmh64_v2関数を追加しました。[#57180](https://github.com/apache/doris/pull/57180)
- jsonb型のハッシュ値を生成するjson_hash関数を追加しました。[#56962](https://github.com/apache/doris/pull/56962)
- binary データ型と、関連する一連の関数を追加しました：length、from_base64_binary、to_base64_binary、sub_binary。[#56648](https://github.com/apache/doris/pull/56648)
- jsonbのキーをソートするためのsort_json_object_keys/normalize_json_numbers_to_double関数を追加しました。
- MySQL互換の時刻関数を複数追加しました：UTC_DATE、UTC_TIME、UTC_TIMESTAMP。[#57443](https://github.com/apache/doris/pull/57443)
- MaxCompute Schema階層のサポートを追加しました。[#56874](https://github.com/apache/doris/pull/56874) ドキュメント：https://doris.apache.org/docs/3.x/lakehouse/catalogs/maxcompute-catalog#hierarchical-mapping
- JSON_OBJECT関数でパラメータとして*の使用をサポートしました。[#57256](https://github.com/apache/doris/pull/57256)

# 改善

## AI & Search

- SEARCH関数にフレーズクエリ、ワイルドカードクエリ、正規表現クエリのサポートを追加しました。[#57372](https://github.com/apache/doris/pull/57372) [#57007](https://github.com/apache/doris/pull/57007)
- SEARCH関数を2つの新しいパラメータで拡張しました：オプションのdefault_fieldパラメータ（デフォルトカラム）とdefault_operatorパラメータ（マルチカラムクエリのブール演算子を「and」または「or」として指定）。[#57312](https://github.com/apache/doris/pull/57312)
- SEARCH関数がvariant型のサブカラムの検索をサポートし、ドット記法を使用してJSONパス内の特定のフィールドを直接検索できるようになりました（例：variantColumn.subcolumn:keyword）。
- 転置インデックスのデフォルトストレージ形式をV2からV3にアップグレードしました。[#57140](https://github.com/apache/doris/pull/57140)
- char_filterコンポーネントの追加によりカスタムトークナイザーパイプラインのサポートを強化しました；アナライザーフレームワークに2つの組み込みトークナイザー（basic tokenizerとICU tokenizer）を導入しました；組み込みトークナイザーのエイリアスを追加し、同一名でのコンポーネント設定をサポートして、統一アナライザーフレームワークを最適化しました。[#56243](https://github.com/apache/doris/pull/56243) [#57055](https://github.com/apache/doris/pull/57055)

## レイクハウス

- 特定の条件下でのexternal table Merge IOにおける深刻な読み込み増幅の問題に対処するため、セッション変数merge_io_read_slice_size_bytesを追加しました。ドキュメント：https://doris.apache.org/docs/3.x/lakehouse/best-practices/optimization#merge-io-optimization

## Query

- JOIN shuffleの選択アルゴリズムを最適化しました。[#56279](https://github.com/apache/doris/pull/56279)

その他

- 物理プランにおけるRuntime Filterシリアライゼーション情報のサイズを最適化しました。[#57108](https://github.com/apache/doris/pull/57108) [#56978](https://github.com/apache/doris/pull/56978)

# バグ修正

## AI & Search

- 非トークン化フィールドでの検索クエリ結果の問題を修正し、MOWテーブルでのsearch関数の実行を有効にしました。[#56914](https://github.com/apache/doris/pull/56914) [#56927](https://github.com/apache/doris/pull/56927)
- IS NULL述語でフィルタリングする際の転置インデックスでの計算エラーを修正しました。[#56964](https://github.com/apache/doris/pull/56964)

## レイクハウス

- 特定の条件下で述語プッシュダウンがParquet Page Indexを使用できない問題を修正しました。[#55795](https://github.com/apache/doris/pull/55795)
- 特定の条件下でのexternal tableクエリにおけるシャード読み込みの欠如の問題を修正しました。[#57071](https://github.com/apache/doris/pull/57071)
- 特定の条件下でHadoopファイルシステムキャッシュが有効な場合にカタログプロパティの変更が有効にならない問題を修正しました。[#57063](https://github.com/apache/doris/pull/57063)
- 特定の条件下で古いバージョンからのアップグレード時に接続プロパティ検証によるメタデータリプレイ失敗の問題を修正しました。[#56929](https://github.com/apache/doris/pull/56929)
- 特定の条件下でRefresh カタログが原因で発生するFEスレッドデッドロックの問題を修正しました。[#56639](https://github.com/apache/doris/pull/56639)
- HiveからコンバートされたIcebergテーブルが読み込めない問題を修正しました。[#56918](https://github.com/apache/doris/pull/56918)
- 特定の条件下でQuery Profilesの収集が原因で発生するBEクラッシュの問題を修正しました。[#56806](https://github.com/apache/doris/pull/56806)

## Query

- 境界条件下でのタイムゾーン関連のcast操作中のdatetime型の不正な結果を修正しました。[#57422](https://github.com/apache/doris/pull/57422)
- 一部のdatetime関連関数の結果の不正な精度導出を修正しました。[#56671](https://github.com/apache/doris/pull/56671)
- float型の述語条件としてinfを使用した際のcore dumpの問題を修正しました。[#57100](https://github.com/apache/doris/pull/57100)
- 可変パラメータを持つexplode関数のcore dumpの問題を修正しました。[#56991](https://github.com/apache/doris/pull/56991)
- decimal256をfloat型にキャストする際の不安定性の問題を修正しました。[#56848](https://github.com/apache/doris/pull/56848)
- spillディスク操作中の重複スケジューリングによる潜在的なcore dumpの問題を修正しました。[#56755](https://github.com/apache/doris/pull/56755)
- mark joinと他のjoinの間の順序の不正な調整が時々発生する問題を修正しました。[#56837](https://github.com/apache/doris/pull/56837)
- 一部のコマンドがmaster frontendに正しく転送されて実行されない問題を修正しました。[#55185](https://github.com/apache/doris/pull/55185)
- window関数によるpartition topnの不正な生成が時々発生する問題を修正しました。[#56622](https://github.com/apache/doris/pull/56622)
- 同期mv定義にキーワードが含まれている場合の潜在的なクエリエラーを修正しました。[#57052](https://github.com/apache/doris/pull/57052)

## その他

- 同期mvに基づく別の同期mvの作成を禁止しました。[#56912](https://github.com/apache/doris/pull/56912)
- profilesにおけるメモリ解放の遅延の問題を修正しました。[#57257](https://github.com/apache/doris/pull/57257)
