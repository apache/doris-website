---
{
  "title": "リリース 3.0.8",
  "language": "ja",
  "description": "スキーマ変更"
}
---
## 動作変更

- ranger / LDAPを使用する際、Dorisでのユーザー作成が禁止されなくなりました [#50139](https://github.com/apache/doris/pull/50139)
- `variant`の`nested`属性がデフォルトで無効になりました。テーブル作成時に有効にするには、セッション変数で先に次のコマンドを実行する必要があります：`set enable_variant_flatten_nested = true` [#54413](https://github.com/apache/doris/pull/54413)

## 新機能

### Query Optimizer

- MySQLの`GROUP BY WITH ORDER`構文をサポート [#53037](https://github.com/apache/doris/pull/53037)

## 改善

### Data Ingestion

- メモリ不足時のフラッシュ戦略を最適化 ([#52906](https://github.com/apache/doris/pull/52906), [#53909](https://github.com/apache/doris/pull/53909), [#42649](https://github.com/apache/doris/pull/42649), [#54517](https://github.com/apache/doris/pull/54517))
- S3 LoadとTVFがAK/SKなしで公開読み取り可能なオブジェクトへのアクセスをサポート ([#53592](https://github.com/apache/doris/pull/53592), [#54040](https://github.com/apache/doris/pull/54040))


### Storage-Compute Decoupled

- キャッシュ領域が十分な場合、base compactionで生成されたrowsetをfile cacheに書き込めるように ([#53801](https://github.com/apache/doris/pull/53801), [#54693](https://github.com/apache/doris/pull/54693))
- `ALTER STORAGE VAULT`コマンドを最適化し、`type`属性を明示的に指定せずに自動推論できるように ([#54394](https://github.com/apache/doris/pull/54394), [#54475](https://github.com/apache/doris/pull/54475))


### Query Optimizer

- ポイントクエリが1つのフラグメントのみを持つように計画され、ポイントクエリの実行速度を改善 [#53541](https://github.com/apache/doris/pull/53541)

### Query Execution

- ポイントクエリでのunique keyテーブルのパフォーマンスを改善 [#53948](https://github.com/apache/doris/pull/53948)

### Inverted Index

- 非トークン化インデックス書き込み時の一般的なデフォルトトークナイザーの追加リソース消費を最適化 [#54666](https://github.com/apache/doris/pull/54666)


## バグ修正

### Data Ingestion

- 複数文字のカラム区切り文字を使用する際の`enclose`解析エラーを修正 ([#54581](https://github.com/apache/doris/pull/54581), [#55052](https://github.com/apache/doris/pull/55052))
- S3 Loadの進行状況が適時に更新されない問題を修正 ([#54606](https://github.com/apache/doris/pull/54606), [#54790](https://github.com/apache/doris/pull/54790))
- JSON boolean型をINTカラムに読み込む際のエラーを修正 ([#54397](https://github.com/apache/doris/pull/54397), [#54640](https://github.com/apache/doris/pull/54640))
- Stream Loadでエラー URL返却が欠落する問題を修正 ([#54115](https://github.com/apache/doris/pull/54115), [#54266](https://github.com/apache/doris/pull/54266))
- schema change中に例外がスローされた後にgroup commitがブロックされる問題を修正 [#54312](https://github.com/apache/doris/pull/54312)


### レイクハウス

- 一部のケースでJDBC SQL pass-throughの解析が失敗する問題を修正 [#54077](https://github.com/apache/doris/pull/54077)
- decimalパーティションを持つicebergテーブルへの書き込み失敗問題を修正 [#54557](https://github.com/apache/doris/pull/54557)
- 一部のケースでHudiテーブルのTimestamp型パーティションカラムのクエリ失敗問題を修正 [#53791](https://github.com/apache/doris/pull/53791)


### Query Optimizer

- 一部のself-joinシナリオでcolocate joinを誤って使用する問題を修正 [#54323](https://github.com/apache/doris/pull/54323)
- `select distinct`とwindow関数を併用した際の潜在的な結果エラーを修正 [#54133](https://github.com/apache/doris/pull/54133)
- lambda式が予期しない位置に現れた際により分かりやすいエラーメッセージを提供 [#53657](https://github.com/apache/doris/pull/53657)

### 許可

- 外部ビューをクエリする際にビュー内のベーステーブルの権限を誤ってチェックする問題を修正 [#53786](https://github.com/apache/doris/pull/53786)

### Query Execution

- IPV6型がIPV4型データを解析できない問題を修正 [#54391](https://github.com/apache/doris/pull/54391)
- IPV6型解析時のスタックオーバーフローエラーを修正 [#53713](https://github.com/apache/doris/pull/53713)


### Complex Data Types

- BEが起動時に命令セットに適合するsimdjsonパーサーを選択することをサポート [#52732](https://github.com/apache/doris/pull/52732)
- variantネスト型データでデータ型の競合によって引き起こされる不正確な型推論を修正 [#53083](https://github.com/apache/doris/pull/53083)
- variantネストトップレベルネスト配列データのデフォルト値埋め込み問題を修正 [#54396](https://github.com/apache/doris/pull/54396)
- cloudでvariant型のインデックス構築を禁止 [#54777](https://github.com/apache/doris/pull/54777)
- variantに転置インデックスを作成した後、インデックス条件を満たさないデータを書き込む際に空のインデックスファイルが生成される問題を修正 [#53814](https://github.com/apache/doris/pull/53814)

### その他

**schema-change**

- 失敗したSCタスクをクリーンアップする際に新しいタブレットが空になる問題を修正 ([#53952](https://github.com/apache/doris/pull/53952), [#54064](https://github.com/apache/doris/pull/54064))
- bucketカラムを元の順序で再構築 ([#54024](https://github.com/apache/doris/pull/54024), [#54072](https://github.com/apache/doris/pull/54072), [#54109](https://github.com/apache/doris/pull/54109))
- bucketカラムの削除を禁止 [#54037](https://github.com/apache/doris/pull/54037)
- ネットワークエラー時の自動リトライをサポート ([#54419](https://github.com/apache/doris/pull/54419), [#54488](https://github.com/apache/doris/pull/54488))
- `tabletInvertedIndex`のデッドロックを回避 ([#54197](https://github.com/apache/doris/pull/54197), [#54996](https://github.com/apache/doris/pull/54996))
