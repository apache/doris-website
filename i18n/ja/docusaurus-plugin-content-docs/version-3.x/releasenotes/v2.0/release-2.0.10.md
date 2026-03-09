---
{
  "title": "リリース 2.0.10",
  "language": "ja",
  "description": "コミュニティユーザーと開発者のおかげで、Doris 2.0.10バージョンでは約83の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者のおかげで、Doris 2.0.10 バージョンでは約83の改善とバグ修正が行われました。

**クイックダウンロード：** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)



## 改善と最適化

- この機能強化により、データベースシステムに `read_only` および `super_read_only` 変数が導入され、MySQLの読み取り専用モードとの互換性が確保されます。

- チェックステータスがIO_ERRORでない場合、ディスクパスは破損リストに追加すべきではありません。これにより、実際のI/Oエラーがあるディスクのみが破損としてマークされることが保証されます。

- 外部テーブルからCreate Table As Select (CTAS)操作を実行する際、`VARCHAR`列を`STRING`型に変換します。

- Paimonカラムタイプ「ROW」からDorisタイプ「STRUCT」へのマッピングをサポート

- タブレット作成時に、わずかなスキューを許容するディスクを選択

- フォロワーFEでの混乱したステータスを回避するため、`set replica drop`のeditlogを書き込み

- メモリ制限超過を回避するため、スキーマ変更メモリ空間を適応的に調整

- 転置インデックス'unicode'トークナイザーがストップワード除外設定をサポート

改善とバグ修正の完全なリストは[GitHub](https://github.com/apache/doris/compare/2.0.9...2.0.10)でご確認ください。

## クレジット

このリリースに貢献していただいたすべての方に感謝いたします：

@airborne12, @BePPPower, @ByteYue, @CalvinKirs, @cambyzju, @csun5285, @dataroaring, @deardeng, @DongLiang-0, @eldenmoon, @felixwluo, @HappenLee, @hubgeter, @jackwener, @kaijchen, @kaka11chen, @Lchangliang, @liaoxin01, @LiBinfeng-01, @luennng, @morningman, @morrySnow, @Mryange, @nextdreamblue, @qidaye, @starocean999, @suxiaogang223, @SWJTU-ZhangLei, @w41ter, @xiaokang, @xy720, @yujun777, @Yukang-Lian, @zhangstar333, @zxealous, @zy-kkk, @zzzxl1993
