---
{
  "title": "リリース 1.2.6",
  "language": "ja",
  "description": "このリリースにご協力いただいた皆様に感謝いたします："
}
---
# 動作変更

- decimal の精度を超えるデータをインポートできるかどうかを制御する BE 設定項目 `allow_invalid_decimalv2_literal` を追加し、以前のロジックとの互換性を保ちます。

# クエリ

- いくつかのクエリプランニングの問題を修正しました。
- `sql_select_limit` セッション変数をサポートしました。
- クエリのコールドラン性能を最適化しました。
- expr context メモリリークを修正しました。
- 一部のケースで `explode_split` 関数が正しく実行されない問題を修正しました。

## Multi カタログ

- hive メタデータの同期により FE の replay edit log が失敗する問題を修正しました。
- `refresh catalog` 操作により FE が OOM になる問題を修正しました。
- jdbc catalog が `0000-00-00` を正しく処理できない問題を修正しました。
- kerberos チケットが自動的に更新されない問題を修正しました。
- hive のパーティション pruning 性能を最適化しました。
- jdbc catalog での trino と presto の一貫性のない動作を修正しました。
- 一部の環境で hdfs short-circuit read が使用できずクエリ効率が向上しない問題を修正しました。
- CHDFS 上の iceberg テーブルが読み取れない問題を修正しました。

# ストレージ

- MOW テーブルでの delete bitmap の間違った計算を修正しました。
- いくつかの BE メモリ問題を修正しました。
- snappy 圧縮の問題を修正しました。
- 一部のケースで jemalloc が BE をクラッシュさせる可能性がある問題を修正しました。

# その他

- java udf 関連のいくつかの問題を修正しました。
- `recover table` 操作が動的パーティションの作成を誤ってトリガーする問題を修正しました。
- broker load による orc ファイルインポート時のタイムゾーンを修正しました。
- 新しく追加された `PERCENT` キーワードが routine load ジョブのメタデータ replay を失敗させる問題を修正しました。
- `truncate` 操作が非パーティションテーブルに対して実行できない問題を修正しました。
- `show snapshot` 操作により mysql 接続が失われる問題を修正しました。
- ロックロジックを最適化し、テーブル作成時のロックタイムアウトエラーの確率を削減しました。
- 一部の古い mysql クライアントとの互換性のためにセッション変数 `have_query_cache` を追加しました。
- ロードエラーが発生した際のエラーメッセージを最適化しました。

# Big Thanks

このリリースに貢献してくださったすべての方に感謝します：

@amorynan

@BiteTheDDDDt

@caoliang-web

@dataroaring

@Doris-Extras

@dutyu

@Gabriel39

@HHoflittlefish777

@htyoung

@jacktengg

@jeffreys-cat

@kaijchen

@kaka11chen

@Kikyou1997

@KnightLiJunLong

@liaoxin01

@LiBinfeng-01

@morningman

@mrhhsg

@sohardforaname

@starocean999

@vinlee19

@wangbo

@wsjz

@xiaokang

@xinyiZzz

@yiguolei

@yujun777

@Yulei-Yang

@zhangstar333

@zy-kkk
