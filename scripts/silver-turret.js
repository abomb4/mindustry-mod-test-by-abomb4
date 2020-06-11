
/**
 * 指向性激光效果，创建效果时必须在 data 里实现 getX(), getY() ，代表目标位置
 */
const pointingLaserEffect = newEffect(50, e => {

    var pos = e.data;

    Draw.color(e.color.add(new Color(0.009, 0.009, 0.009, 0.009)));
    Draw.alpha(e.fout() * 0.7); // 降低最大不透明度
    Lines.stroke(2.5);
    Lines.line(e.x, e.y, pos.getX(), pos.getY());
    Draw.color(e.color);
    Draw.alpha(e.fout() * 0.7); // 降低最大不透明度
    Lines.stroke(1.5);
    Lines.line(e.x, e.y, pos.getX(), pos.getY());
});
/**
 * 圆球
 */
const sql = newEffect(50, e => {
    Draw.color(e.color);
    Draw.alpha(e.fout());
    Fill.circle(e.x, e.y, 4 - e.fout() * 4);
});

/** 指向性激光子弹，发射该类子弹必须指定 data ，目前只能使用 PointingLaserTurret 发射 */
const pointingLaserBulletType = extend(BasicBulletType, {
    update(b) {
        // 不进行向量移动，进行一次打击
        if (!b.data.hit) {
            var targetX = b.data.getX();
            var targetY = b.data.getY();
            var sourceX = b.data.getSourceX();
            var sourceY = b.data.getSourceY();

            var explosiveness = 20; // 10 damage
            // 正向激光
            Effects.effect(pointingLaserEffect, Color.red,
                b.data.getSourceX(),
                b.data.getSourceY(),
                0,
                b.data
            );

            // 反向激光，防止炮塔不在视野时效果没了
            Effects.effect(pointingLaserEffect, Color.red,
                targetX,
                targetY,
                0,
                {
                    getX() { return sourceX; },
                    getY() { return sourceY; },
                }
            );

            // 爆炸效果自行实现
            // 先炸出冲击波
            var shake = Math.min(explosiveness / 4 + 3, 9);
            Effects.shake(shake, shake, targetX, targetY);
            Effects.effect(Fx.shockwave, targetX, targetY);

            // 喷个火球
            Call.createBullet(Bullets.fireball, b.getTeam(), targetX, targetY, Mathf.random(360), 1, 1);

            // 子弹瞬移！啪嚓就撞上
            b.x = targetX;
            b.y = targetY;
            b.data.hit = true;
        }
    },

    draw(b) {
    },
});
// Don't modify
pointingLaserBulletType.speed = 0.01;
pointingLaserBulletType.hitSize = 20;
pointingLaserBulletType.lifetime = 50;
pointingLaserBulletType.pierce = false;

/**
 * 炮台实体信息，充能炮有额外的信息
 */
const pointingLaserTurretEntity = () => {
    var _myChargingEnergy = 0;
    var _myCharging = false;
    var _readyShoot = false;
    var obj = extend(Turret.TurretEntity, {
        // 充能量
        _myChargingEnergy: 0,
        // 有敌人在视野中
        _myCharging: false,
        _readyShoot: false,

        setMyChargingEnergy(v) { _myChargingEnergy = v; },
        setMyCharging(v) { _myCharging = v; },
        setReadyShoot(v) { _readyShoot = v; },
        getMyChargingEnergy() { return _myChargingEnergy; },
        getMyCharging() { return _myCharging; },
        getReadyShoot() { return _readyShoot; },
    });
    return obj;
};

/** 指向性激光炮塔 */
const pointingLaserTurret = extendContent(PowerTurret, "silver-turret", {
    chargeTime: 60,
    cooldownDelay: 60,
    chargeSound: Sounds.shotgun,

    update(tile) {
        this.super$update(tile);

        var entity = tile.ent();

        if (entity.getMyCharging()) {
            entity.setMyChargingEnergy(entity.getMyChargingEnergy() + 1);
            // print('Charge:' + entity.getMyChargingEnergy());
        }
    },

    updateShooting(tile) {
        // 进入该函数则说明‘发现敌人’
        // 发现敌人则开始充能
        // 充能完成 = 发射
        //   发射附带充能归零，及开始计算 reload
        // 敌人消失不能立刻停止充能，也不能充一半放着，要继续充能
        //   一定时间内都没有发现敌人，则充能归零

        // -======- from Turret.java -======-
        var entity = tile.ent();

        if (entity.reload >= this.reload) {
            var type = this.peekAmmo(tile);

            var tr = this.tr;

            if (!entity.getMyCharging()) {
                // print('Play the charging animation!');
                entity.setMyCharging(true);
                this.chargeSound.at(tile, Mathf.random(0.9, 1.1));
                Effects.effect(this.chargeBeginEffect, tile.drawx() + tr.x, tile.drawy() + tr.y, entity.rotation);
                for (var i = 0; i < this.chargeEffects; i++) {
                    Time.run(Mathf.random(this.chargeMaxDelay), run(() => {
                        if (!this.isTurret(tile)) return;
                        tr.trns(entity.rotation, this.size * Vars.tilesize / 2);
                        Effects.effect(this.chargeEffect, tile.drawx() + tr.x, tile.drawy() + tr.y, entity.rotation);
                    }));
                }
                const the = this;
                // 经过一段 delay 准备发射
                Time.run(this.chargeTime, run(() => {
                    // print('Ready Shot!');
                    entity.setReadyShoot(true);
                }));
                // 经过一长段时间进行 cooldown
                Time.run(this.chargeTime + this.cooldownDelay, run(() => {
                    if (entity.getMyCharging() && entity.getReadyShoot() && entity.getMyChargingEnergy() > the.chargeTime) {
                        // print('Cool down!');
                        entity.setReadyShoot(false);
                        entity.setMyCharging(false);
                        entity.setMyChargingEnergy(0);
                    } else {
                        // print('Not cooldown! charging: ' + entity.getMyCharging() + ',readyShoot: ' + entity.getReadyShoot() + ',energy: ' + entity.getMyChargingEnergy());
                    }
                }));
            }
            if (entity.getReadyShoot()) {
                // print('Fire!');
                this.shoot(tile, type);
                entity.setReadyShoot(false);
                entity.setMyCharging(false);
                entity.setMyChargingEnergy(0);

                entity.reload = 0;
            }

        } else {
            entity.reload += tile.entity.delta() * this.peekAmmo(tile).reloadMultiplier * this.baseReloadSpeed(tile);
        }

        // -======- from CooledTurret.java -======-
        var maxUsed = this.consumes.get(ConsumeType.liquid).amount;

        var liquid = entity.liquids.current();

        var used = Math.min(
            Math.min(entity.liquids.get(liquid), maxUsed * Time.delta()),
            Math.max(0, ((this.reload - entity.reload) / this.coolantMultiplier) / liquid.heatCapacity)
        ) * this.baseReloadSpeed(tile);

        entity.reload += used * liquid.heatCapacity * this.coolantMultiplier;
        entity.liquids.remove(liquid, used);

        if (Mathf.chance(0.06 * used)) {
            Effects.effect(this.coolEffect, tile.drawx() + Mathf.range(this.size * Vars.tilesize / 2), tile.drawy() + Mathf.range(this.size * Vars.tilesize / 2));
        }
    },

    shoot(tile, ammo) {
        var entity = tile.ent();
        if (entity.target) {
            entity.shots++;

            var targetX = entity.target.x;
            var targetY = entity.target.y;

            var i = Mathf.signs[entity.shots % 2];

            // this.tr.trns(entity.rotation - 90, this.shotWidth * i, this.size * this.tilesize / 2);
            // 发射指向性激光子弹必须在 data 中指定目标位置，就不能用 this.bullet 了
            Bullet.create(ammo, tile.entity, tile.getTeam(), tile.drawx(), tile.drawy(), this.angle || 1, 1, 1, {
                // 目标 x
                getX() { return targetX; },
                // 目标 y
                getY() { return targetY; },
                // 发射孔 x
                getSourceX() { return tile.drawx(); },
                // 发射孔 y
                getSourceY() { return tile.drawy(); },

                hit: false,
            });

            this.effects(tile);
            this.useAmmo(tile);
        }
    },
});

// Don't modify
pointingLaserTurret.shootType = pointingLaserBulletType;
pointingLaserTurret.entityType = new Prov({
    get: function () {
        return pointingLaserTurretEntity();
    }
});

// 特效配置，Fx 的定制需要 newEffect
pointingLaserTurret.chargeEffects = 5;
pointingLaserTurret.chargeMaxDelay = 8;
pointingLaserTurret.chargeEffect = Fx.lancerLaserCharge;
pointingLaserTurret.chargeBeginEffect = Fx.lancerLaserChargeBegin;
pointingLaserTurret.shootEffect = Fx.lancerLaserShoot;
pointingLaserTurret.smokeEffect = Fx.lancerLaserShootSmoke;


// -=-=-常用属性 -=-=-
// -= 子弹 =-
// 直接伤害
pointingLaserBulletType.damage = 300;
// 爆炸伤害
pointingLaserBulletType.splashDamage = 100;
// 爆炸范围（一格 = 8 似乎，40 = 5 格）
pointingLaserBulletType.splashDamageRadius = 40;
// 发射效果
pointingLaserBulletType.shootEffect = sql;
// 发射效果的烟？
pointingLaserBulletType.smokeEffect = Fx.shootSmallSmoke;
// 击中效果
pointingLaserBulletType.hitEffect = sql;
// 消失效果
pointingLaserBulletType.despawnEffect = sql;

// -= 炮塔 =-
// 发射声音
pointingLaserTurret.shootSound = Sounds.laser;
// 充能声音
pointingLaserTurret.chargeSound = Sounds.shotgun;
// 充能时间 60 = 1s
pointingLaserTurret.chargeTime = 60;
// 丢失目标的缓冲时间，不能大于 chargeTime， 60 = 1s
pointingLaserTurret.cooldownDelay = 40;
