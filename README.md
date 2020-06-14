# 滞人的 playground
基于 Mindustry mod 机制实现一些好玩的东西。

游戏链接：https://github.com/Anuken/Mindustry/

## 设想
- [x] 光棱塔
- [x] 冷冻力场
- [ ] 熔毁大风车
- [x] 冷冻液弹
- [ ] 加特林
- [ ] 近战机甲

## Mod 开发
这东西需要同时了解 Java 和 JS，才可以进行开发。

这游戏的 Mod 脚本机制是基于 Rhino 的 js 引擎，可以方便调用 java 的很多功能，
甚至继承某些指定的类来实现更多功能。

## Mod 开发概念说明
目前已经了解的概念：
- Turret 炮塔
- Bullet 子弹实体
- BulletType 子弹定义
- Damage 提供了一堆静态方法方便对任何东西造成伤害
- Effect 可实现各种神奇效果，不要在实体生命周期中使用画图，而是使用 Effect
