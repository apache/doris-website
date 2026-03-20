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
- hive catalog kerberosアクセスに関するいくつかの問題を修正。
- stream load profileが使用できない問題を修正。
- promethus監視パラメータ形式の問題を修正。
- 大量のtabletを作成する際のテーブル作成タイムアウトの問題を修正。

# New Features

- Unique Key modelでvalue columnとしてarray typeをサポート
- MySQLエコシステムとの互換性のために`have_query_cache`変数を追加。
- セッション間での強整合読み取りをサポートする`enable_strong_consistency_read`を追加
- FE metricsでユーザーレベルのクエリカウンターをサポート
