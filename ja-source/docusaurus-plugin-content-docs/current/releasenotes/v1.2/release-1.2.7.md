---
{
  "title": "リリース 1.2.7",
  "language": "ja",
  "description": "バグ修正：一部のクエリの問題を修正しました。"
}
---
# Bug Fixes

- いくつかのクエリの問題を修正しました。
- いくつかのストレージの問題を修正。
- いくつかの小数精度の問題を修正。
- 無効な`sql_select_limit`セッション変数の値によって引き起こされるクエリエラーを修正。
- hdfs short-circuit readが使用できない問題を修正。
- Tencent Cloud cosnにアクセスできない問題を修正。
- hive catalog kerberos アクセスに関するいくつかの問題を修正。
- stream load profileが使用できない問題を修正。
- promethus監視パラメータフォーマットの問題を修正。
- 大量のタブレット作成時のテーブル作成タイムアウトの問題を修正。

# New Features

- Unique Keyモデルが値列としてarray型をサポート
- MySQL エコシステムとの互換性のため`have_query_cache`変数を追加。
- セッション間での強い一貫性読み取りをサポートする`enable_strong_consistency_read`を追加
- FE metricsがユーザーレベルのクエリカウンタをサポート
