---
{
  "title": "リリース 2.0.15",
  "language": "ja",
  "description": "コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.15バージョンでは約157の改善とバグ修正が行われました"
}
---
コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.15バージョンでは約157の改善とバグ修正が行われました

- Quick Download: https://doris.apache.org/download

- GitHub: https://github.com/apache/doris/releases/tag/2.0.15 

## 1 動作変更

NA

## 2 新機能

- Restoreで冗長なtabletの削除とpartitionオプションがサポートされました。[#39028](https://github.com/apache/doris/pull/39028)

- JSON関数 `json_search` をサポートしました。[#40948](https://github.com/apache/doris/pull/40948)

## 3 改善と最適化

### 安定性

- transactionの中断時間のためのFE設定 `abort_txn_after_lost_heartbeat_time_second` を追加しました。[#28662](https://github.com/apache/doris/pull/28662)

- BEのheartbeatが失われた後、5秒ではなく1分以上経過してからtransactionを中断するように変更し、過度に敏感なtransactionの中断を回避します。[#22781](https://github.com/apache/doris/pull/22781)

- 過剰な小さなtransactionを避けるため、routine loadのEOFタスクのスケジューリングを遅延させました。[#39975](https://github.com/apache/doris/pull/39975)

- よりロバストになるようオンラインディスクサービスからの問い合わせを優先します。[#39467](https://github.com/apache/doris/pull/39467)

- 行のdelete signがマークされている場合、non-strictモードでのpartial updateにおいて新しく挿入された行のチェックをスキップします。[#40322](https://github.com/apache/doris/pull/40322)

- FE OOMを防ぐため、backupタスクのtablet数を制限し、デフォルト値を300,000に設定しました。[#39987](https://github.com/apache/doris/pull/39987)

### パフォーマンス

- 同時実行するcolumn updateとcompactionによって引き起こされる遅いcolumn updateを最適化しました。[#38487](https://github.com/apache/doris/pull/38487)

- filter条件にNullLiteralが存在する場合、これをFalseに畳み込み、さらにEmptySetに変換して不要なデータスキャンと計算を削減できるようになりました。[#38135](https://github.com/apache/doris/pull/38135)

- `ORDER BY` permutationのパフォーマンスを向上させました。[#38985](https://github.com/apache/doris/pull/38985)

- inverted indexでの文字列処理のパフォーマンスを向上させました。[#37395](https://github.com/apache/doris/pull/37395)

### OptimizerとStatistics

- セミコロンで始まるステートメントのサポートを追加しました。[#39399](https://github.com/apache/doris/pull/39399)

- aggregate関数のシグネチャマッチングを改良しました。[#39352](https://github.com/apache/doris/pull/39352)

- schema変更後にcolumn statisticsを削除し、auto analysisをトリガーします。[#39101](https://github.com/apache/doris/pull/39101)

- `DROP CACHED STATS table_name` を使用してキャッシュされた統計の削除をサポートしました。[#39367](https://github.com/apache/doris/pull/39367)

### Multi CatalogとOthers

- JDBC Catalogのrefreshを最適化し、client作成の頻度を削減しました。[#40261](https://github.com/apache/doris/pull/40261)

- 特定の条件下でのJDBC Catalogでのthread leakを修正しました。[#39423](https://github.com/apache/doris/pull/39423)

- ARRAY MAP STRUCT型で `REPLACE_IF_NOT_NULL` をサポートしました。[#38304](https://github.com/apache/doris/pull/38304)

- `DELETE_INVALID_XXX` 以外の失敗に対してdelete jobを再試行します。[#37834](https://github.com/apache/doris/pull/37834)

**Credits**

@924060929, @BePPPower, @BiteTheDDDDt, @CalvinKirs, @GoGoWen, @HappenLee, @Jibing-Li, @Johnnyssc, @LiBinfeng-01, @Mryange, @SWJTU-ZhangLei, @TangSiyang2001, @Toms1999, @Vallishp, @Yukang-Lian, @airborne12, @amorynan, @bobhan1, @cambyzju, @csun5285, @dataroaring, @eldenmoon, @englefly, @feiniaofeiafei, @hello-stephen, @htyoung, @hubgeter, @justfortaste, @liaoxin01, @liugddx, @liutang123, @luwei16, @mongo360, @morrySnow, @qidaye, @smallx, @sollhui, @starocean999, @w41ter, @xiaokang, @xzj7019, @yujun777, @zclllyybb, @zddr, @zhangstar333, @zhannngchen, @zy-kkk, @zzzxl1993
