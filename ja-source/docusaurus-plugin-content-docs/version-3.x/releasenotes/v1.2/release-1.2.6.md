---
{
  "title": "Release 1.2.6",
  "language": "ja",
  "description": "このリリースにご協力いただいた皆様に感謝いたします："
}
---
# 動作変更

- decimal の精度を超えるデータのインポートを制御する BE 設定項目 `allow_invalid_decimalv2_literal` を追加し、以前のロジックとの互換性を提供します。

# クエリ

- 複数のクエリ計画の問題を修正しました。
- `sql_select_limit` セッション変数をサポートしました。
- クエリのコールドラン性能を最適化しました。
- expr context のメモリリークを修正しました。
- `explode_split` 関数が一部のケースで正しく実行されない問題を修正しました。

## Multi カタログ

- hive メタデータの同期により FE の replay edit log が失敗する問題を修正しました。
- `refresh catalog` 操作により FE で OOM が発生する問題を修正しました。
- jdbc catalog で `0000-00-00` を正しく処理できない問題を修正しました。
- kerberos チケットが自動更新されない問題を修正しました。
- hive のパーティションプルーニング性能を最適化しました。
- jdbc catalog での trino と presto の動作の不整合を修正しました。
- 一部の環境で hdfs short-circuit read が使用できずクエリ効率を向上できない問題を修正しました。
- CHDFS 上の iceberg テーブルが読み取れない問題を修正しました。

# ストレージ

- MOW テーブルでの delete bitmap の計算誤りを修正しました。
- 複数の BE メモリ問題を修正しました。
- snappy 圧縮の問題を修正しました。
- jemalloc が一部のケースで BE をクラッシュさせる可能性がある問題を修正しました。

# その他

- 複数の java udf 関連の問題を修正しました。
- `recover table` 操作が誤って動的パーティションの作成をトリガーする問題を修正しました。
- broker load による orc ファイルのインポート時のタイムゾーンを修正しました。
- 新しく追加された `PERCENT` キーワードが routine load ジョブのメタデータの replay を失敗させる問題を修正しました。
- `truncate` 操作が非パーティションテーブルに対して失敗する問題を修正しました。
- `show snapshot` 操作により mysql 接続が失われる問題を修正しました。
- ロックロジックを最適化し、テーブル作成時のロックタイムアウトエラーの確率を削減しました。
- 一部の古い mysql クライアントとの互換性のためにセッション変数 `have_query_cache` を追加しました。
- 読み込みエラー時のエラーメッセージを最適化しました。

# Big Thanks

このリリースに貢献いただいた全ての方に感謝します：

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
