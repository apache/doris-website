---
{
  "title": "リリース 1.2.7",
  "language": "ja",
  "description": "バグ修正：いくつかのクエリの問題を修正しました。"
}
---
# Bug Fixes

- いくつかのクエリの問題を修正しました。
- いくつかのストレージの問題を修正しました。
- いくつかの小数点精度の問題を修正しました。
- 無効な`sql_select_limit`セッション変数の値によって引き起こされるクエリエラーを修正しました。
- hdfs short-circuit readが使用できない問題を修正しました。
- Tencent Cloud cosnにアクセスできない問題を修正しました。
- hive catalog kerberosアクセスに関するいくつかの問題を修正しました。
- stream load profileが使用できない問題を修正しました。
- promethus監視パラメータフォーマットの問題を修正しました。
- 大量のtabletを作成する際のテーブル作成タイムアウトの問題を修正しました。

# New Features

- Unique Key modelが値列として配列型をサポート
- MySQLエコシステムとの互換性のために`have_query_cache`変数を追加
- セッション間での強整合性読み取りをサポートする`enable_strong_consistency_read`を追加
- FE metricsがユーザーレベルのクエリカウンターをサポート
