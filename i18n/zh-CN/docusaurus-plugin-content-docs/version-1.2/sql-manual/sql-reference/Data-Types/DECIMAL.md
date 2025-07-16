---
{
    "title": "DECIMAL",
    "language": "zh-CN"
}
---

## DECIMAL
## 描述
    DECIMAL(M[,D])
    高精度定点数，M 代表一共有多少个有效数字(precision)，D 代表小数位有多少数字(scale)，
    有效数字 M 的范围是 [1, 27]，小数位数字数量 D 的范围是 [0, 9]，整数位数字数量的范围是 [1, 18]，
    另外，M 必须要大于等于 D 的取值。

    默认值为 DECIMAL(9, 0)。

### note
    我们打算在2024年删除这个类型，目前阶段，Doris默认禁止创建含有DECIMAL类型的表，如果需要使用需要在FE的config中添加`disable_decimalv2 = false`，并重启FE。

### keywords
    DECIMAL
