---
{
  "title": "リリース 2.0.10",
  "language": "ja",
  "description": "コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.10バージョンでは約83件の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者のおかげで、Doris 2.0.10 バージョンでは約83の改善とバグ修正が行われました。

**クイックダウンロード：** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)



## 改善と最適化

- この拡張により、データベースシステムに `read_only` と `super_read_only` 変数が導入され、MySQLの読み取り専用モードとの互換性が確保されます。

- チェック状態がIO_ERRORでない場合、ディスクパスは破損リストに追加すべきではありません。これにより、実際のI/Oエラーがあるディスクのみが破損としてマークされることが保証されます。

- 外部テーブルからCreate table As Select (CTAS)操作を実行する際、`VARCHAR`列を`STRING`型に変換します。

- Paimon列型"ROW"からDoris型"STRUCT"へのマッピングをサポート

- tabletを作成する際に、わずかなスキューを許容するディスクを選択

- follower FEでの混乱した状態を避けるために、`set replica drop`のeditlogを書き込み

- メモリ制限を超えることを避けるために、スキーマ変更メモリ空間を適応的にする

- 転置インデックス'unicode'トークナイザーがストップワードを除外する設定をサポート

改善とバグ修正の完全なリストについては[GitHub](https://github.com/apache/doris/compare/2.0.9...2.0.10)をご覧ください。

## クレジット

このリリースに貢献してくださった皆様に感謝します：

@airborne12, @BePPPower, @ByteYue, @CalvinKirs, @cambyzju, @csun5285, @dataroaring, @deardeng, @DongLiang-0, @eldenmoon, @felixwluo, @HappenLee, @hubgeter, @jackwener, @kaijchen, @kaka11chen, @Lchangliang, @liaoxin01, @LiBinfeng-01, @luennng, @morningman, @morrySnow, @Mryange, @nextdreamblue, @qidaye, @starocean999, @suxiaogang223, @SWJTU-ZhangLei, @w41ter, @xiaokang, @xy720, @yujun777, @Yukang-Lian, @zhangstar333, @zxealous, @zy-kkk, @zzzxl1993
