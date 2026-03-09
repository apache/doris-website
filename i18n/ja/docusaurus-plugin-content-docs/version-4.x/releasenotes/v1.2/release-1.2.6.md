---
{
  "title": "リリース 1.2.6",
  "language": "ja",
  "description": "このリリースに貢献していただいた皆様に感謝いたします："
}
---
# 動作変更

- decimal の精度を超えるデータのインポートを制御するBE設定項目 `allow_invalid_decimalv2_literal` を追加し、以前のロジックとの互換性を提供します。

# クエリ

- 複数のクエリ計画の問題を修正しました。
- `sql_select_limit` セッション変数をサポートしました。
- クエリのコールドラン性能を最適化しました。
- expr context のメモリリークを修正しました。
- 一部のケースで `explode_split` 関数が正しく実行されない問題を修正しました。

## Multi Catalog

- hive メタデータの同期がFEのreplay edit logの失敗を引き起こす問題を修正しました。
- `refresh catalog` 操作がFE OOMを引き起こす問題を修正しました。
- jdbc catalog が `0000-00-00` を正しく処理できない問題を修正しました。
- kerberos チケットが自動的に更新されない問題を修正しました。
- hive のパーティションプルーニング性能を最適化しました。
- jdbc catalog における trino と presto の動作が一致しない問題を修正しました。
- 一部の環境で hdfs short-circuit read が使用できず、クエリ効率を向上できない問題を修正しました。
- CHDFS 上の iceberg テーブルが読み取れない問題を修正しました。

# ストレージ

- MOW テーブルにおけるdelete bitmapの計算間違いを修正しました。
- 複数のBEメモリ問題を修正しました。
- snappy 圧縮の問題を修正しました。
- 一部のケースで jemalloc がBEクラッシュを引き起こす可能性がある問題を修正しました。

# その他

- java udf 関連の複数の問題を修正しました。
- `recover table` 操作が動的パーティションの作成を誤ってトリガーする問題を修正しました。
- broker load 経由でorc ファイルをインポートする際のタイムゾーンを修正しました。
- 新しく追加された `PERCENT` キーワードが routine load ジョブのメタデータreplayの失敗を引き起こす問題を修正しました。
- 非パーティションテーブルに対して `truncate` 操作が失敗する問題を修正しました。
- `show snapshot` 操作により mysql 接続が失われる問題を修正しました。
- ロックロジックを最適化し、テーブル作成時のロックタイムアウトエラーの確率を減らしました。
- 一部の古い mysql クライアントとの互換性のためにセッション変数 `have_query_cache` を追加しました。
- ロード時のエラーに遭遇した際のエラーメッセージを最適化しました。

# Big Thanks

このリリースに貢献してくださったすべての方々に感謝します:

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
