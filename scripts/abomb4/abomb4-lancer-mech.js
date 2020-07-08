
const lib = require('abomb4/lib');

const globalLancerMechShield = (() => {

    const SHIELD_ID = 0;

    const map = {}
    const MAX_CHARGE = 2000;        // 最大血量
    const CHARGE_STEP = 30;         // 每次充能量，目前是发射一个子弹充多少能，散弹则乘以弹数
    const MAX_RADIUS = 24;          // 最大范围
    const MIN_RADIUS = 12;          // 最小范围
    const MAX_RADIUS_PRECENT = 0.5; // 最大范围临界血量
    const MIN_RADIUS_PERCENT = 0.2; // 最小范围临界血量
    const MIN_CHARGE_PERCENT = 0.2; // 被打爆后充能到多少才生效

    function PlayerShield(player) {
        var entity = {
            player: player,
            id: ++SHIELD_ID,
            power: MAX_CHARGE / 2,
            broken: false,
            hit: 0,
            chargeEffectEnergy: 0,
        };
        function setPower(v) { entity.power = v; }
        function getPower() { return entity.power; }
        function setHit(v) { entity.hit = v; }
        function getHit() { return entity.hit; }
        function setChargeEffectEnergy(v) { entity.chargeEffectEnergy = v; }
        function getChargeEffectEnergy() { return entity.chargeEffectEnergy; }
        function setBroken(v) { entity.broken = v; }
        function getBroken() { return entity.broken; }

        function handleDamage(trait) {
            trait.absorb();
            Effects.effect(Fx.absorb, trait);
            setPower(getPower() - trait.getShieldDamage())
            if (getPower() <= 0) {
                setPower(0);
                setBroken(true);
            }
            setHit(1);
        }
        function activeRadius() {
            if (entity.broken) { return 0; }
            var percent = getPower() / MAX_CHARGE;

            if (percent >= MAX_RADIUS_PRECENT) {
                return MAX_RADIUS;
            } else if (percent <= MIN_RADIUS_PERCENT) {
                return MIN_RADIUS;
            } else {
                return MIN_RADIUS + (percent - MIN_RADIUS_PERCENT) / (MAX_RADIUS_PRECENT - MIN_RADIUS_PERCENT) * (MAX_RADIUS - MIN_RADIUS);
            }
        }

        function charge(num) {
            if (num > 0) {
                setPower(Math.min(getPower() + CHARGE_STEP * num, MAX_CHARGE));
            }

            if (getPower() > MAX_CHARGE * MIN_CHARGE_PERCENT) {
                setBroken(false);
            }
            if (getPower() != MAX_CHARGE && !getBroken()) {
                setChargeEffectEnergy(1);
                // Effects.effect(chargeEffect, entity.player.x, entity.player.y, 0, {
                //     activeRadius: () => activeRadius()
                // });
            }
        }

        function tryAbsorb() {
            const realRadius = activeRadius();
            if (getHit() > 0) {
                setHit(getHit() - 1 / 5 * Time.delta());
            }
            if (getChargeEffectEnergy() > 0) {
                setChargeEffectEnergy(getChargeEffectEnergy() - 1 / 4 * Time.delta());
            }
            var me = entity.player;
            Vars.bulletGroup.intersect(me.x - realRadius, me.y - realRadius, realRadius * 2, realRadius * 2, cons((trait) => {
                if (trait.canBeAbsorbed()
                    && trait.getTeam() != me.getTeam()
                    && Mathf.dst(trait.getX(), trait.getY(), me.x, me.y) < realRadius) {

                    handleDamage(trait);
                }
            }));
        }

        function draw() {
            var x = entity.player.x;
            var y = entity.player.y;
            var rad = activeRadius();

            // shield
            if (getPower() == MAX_CHARGE) {
                Draw.color(Color.valueOf("ffe33f"));
            } else {
                Draw.color(Pal.accent);
            }
            Lines.stroke(1.5);
            Draw.alpha(0.09 + 0.08 * getHit());
            Fill.circle(x, y, rad);
            Draw.alpha(1);
            Lines.circle(x, y, rad);

            // hit
            Draw.color(Color.white);
            Draw.alpha(entity.hit * 0.5);
            Fill.circle(x, y, activeRadius());
            Draw.color();

            // charge
            Draw.color(Pal.heal);
            Draw.alpha(entity.chargeEffectEnergy * 0.5);
            Fill.circle(x, y, activeRadius());
            Draw.color();

            Draw.reset();
        }
        function debugDump() {
            print('id: ' + entity.id + ', power: ' + getPower() + ', hit: ' + getHit() + ', broken: ' + getBroken() + ', player: ' + entity.player);
        }
        return {
            charge: charge,
            defence() { tryAbsorb() },
            draw: draw,
            debugDump: debugDump,
        };
    }

    Events.on(EventType.MechChangeEvent, cons((v) => {
        if (v.mech == mech) {
            map[v.player.id] = new PlayerShield(v.player);
        }
    }));
    return {
        getShield(player, init) {
            if (init || map[player.id] == null) {
                map[player.id] = new PlayerShield(player);
            }
            return map[player.id];
        },
    };
})();
// 注意，只能安装到机甲上，不能给敌人
const lancerLaser2 = (() => {
    const tmpColor = new Color();
    const colors = [Pal.heal.cpy().mul(1, 1, 1, 0.4), Pal.heal, Pal.heal];
    const tscales = [1, 0.7, 0.5, 0.2];
    const strokes = [2, 1.5, 1, 0.3];
    const lenscales = [1, 1.1, 1.13, 1.17];
    const length = 160;

    const shootEffect = newEffect(12, e => {
        Draw.color(Pal.heal);
        const signs = Mathf.signs;
        for(var i in signs){
            var num = signs[i];
            Drawf.tri(e.x, e.y, 4 * e.fout(), 18, e.rotation + 100 * num);
        }
    });

    const shootSmokeEffect = newEffect(12, e => {
        Draw.color(Pal.heal);
        Fill.circle(e.x, e.y, e.fout() * 4);
    });

    const noRepeatBullet = {};
    const bt = extend(BasicBulletType, {
        init(b) {
            if (b) {
                Damage.collideLine(b, b.getTeam(), this.hitEffect, b.x, b.y, b.rot(), length);

                // try heal friend tiles
                const large = false;
                var tr = new Vec2();
                tr.trns(b.rot(), length);
                var collidedBlocks = new IntSet();
                var collider = new Intc2({
                    get: (cx, cy) => {
                        var tile = Vars.world.ltile(cx, cy);

                        if (tile != null && tile.entity != null && tile.getTeam() == b.getTeam() && tile.entity.maxHealth() != tile.entity.health && (tile.block() != BuildBlock)) {
                            Effects.effect(Fx.healBlockFull, Pal.heal, tile.drawx(), tile.drawy(), tile.block().size);
                            tile.entity.healBy(this.healPercent / 100 * tile.entity.maxHealth());
                        }
                        // if (tile != null && !collidedBlocks.contains(tile.pos()) && tile.entity != null && tile.getTeamID() == team.id && tile.entity.collide(b)) {
                        //     tile.entity.collision(b);
                        //     collidedBlocks.add(tile.pos());
                        //     b.getBulletType().hit(b, tile.worldx(), tile.worldy());
                        // }
                    }
                });

                Vars.world.raycastEachWorld(b.x, b.y, b.x + tr.x, b.y + tr.y, new World.Raycaster({
                    accept: (cx, cy) => {
                        collider.get(cx, cy);
                        if (large) {
                            for (var i in Geometry.d4) {
                                var p = Geometry.d4[i];
                                collider.get(cx + p.x, cy + p.y);
                            }
                        }
                        return false;
                    }
                }));
            }
        },
        range() {
            return length;
        },
        draw(b) {
            const f = Mathf.curve(b.fin(), 0, 0.2);
            const baseLen = length * f;

            Lines.lineAngle(b.x, b.y, b.rot(), baseLen);
            for (var s = 0; s < 3; s++) {
                Draw.color(colors[s]);
                for (var i = 0; i < tscales.length; i++) {
                    Lines.stroke(7 * b.fout() * (s == 0 ? 1.5 : s == 1 ? 1 : 0.3) * tscales[i]);
                    Lines.lineAngle(b.x, b.y, b.rot(), baseLen * lenscales[i]);
                }
            }
            Draw.reset();
        },
        update(b) {
            // 只能安装到机甲上，不能给敌人的原因在这里，关联了护盾
            if (!noRepeatBullet[b.getID()]) {
                noRepeatBullet[b.getID()] = true;
                var player = b.getOwner();
                var shield = globalLancerMechShield.getShield(player, false);
                shield.charge(1);
                Time.run(this.lifetime + 12, run(() => {
                    delete noRepeatBullet[b.getID()];
                }));
            }
        },
    });

    bt.healPercent = 5;
    bt.hitEffect = Fx.hitLancer;
    bt.despawnEffect = Fx.none;
    bt.speed = 0.01;
    bt.hitSize = 4;
    bt.drawSize = 420;
    bt.damage = 45;
    bt.lifetime = 16;
    bt.pierce = true;
    bt.keepVelocity = false;
    bt.collidesTiles = false;
    bt.shootEffect = shootEffect;
    bt.smokeEffect = shootSmokeEffect;

    return bt;
})();

const lancerLaserWeapon = (() => {

    const w = extend(Weapon, {
        load() {
            // Add a prefix prevent confliction with other mods
            this.name = lib.aModName + '-' + 'abomb4-lancer-weapon';
            this.super$load();

            // const assetName = lib.aModName + '-' + this.name;
            // this.region = Core.atlas.find(
            //     assetName + "-equip",
            //     Core.atlas.find(assetName + "-equip", Core.atlas.find("clear"))
            // );
            // print('load ' + this.name + '-equip : ' + this.region);
        },
    });

    w.name = lib.aModName + '-' + 'abomb4-lancer-weapon';
    w.bullet = lancerLaser2;
    w.inaccuracy = 0;
    w.shots = 1;

    w.reload = 10;
    w.shake = 0.5;
    w.recoil = 2;
    w.length = 4; // Y length
    w.alternate = true;
    // w.shootSound = Sounds.pew;
    lib.loadSound("healLaser.ogg", s => w.shootSound = s);
    w.shootSound = Sounds.pew;
    return w;
})();

const mech = (() => {
    const healRange = 60;
    const healAmount = 20;
    const healReload = 120;
    var wasHealed;
    const m = extendContent(Mech, 'abomb4-lancer-mech', {
        getExtraArmor(player) {
            return player.shootHeat * 75;
        },
        updateAlt(player) {
            var shield = globalLancerMechShield.getShield(player, false);
            // shield.charge(player.isShooting() ? 1 : 0);
            shield.defence();

            if (player.timer.get(Player.timerAbility, healReload)) {
                wasHealed = false;

                Units.nearby(player.getTeam(), player.x, player.y, healRange, cons(unit => {
                    if (unit.health < unit.maxHealth()) {
                        Effects.effect(Fx.heal, unit);
                        wasHealed = true;
                    }
                    unit.healBy(healAmount);
                }));

                shield.charge(2);
                if (wasHealed) {
                    Effects.effect(Fx.healWave, player);
                }
            }
        },
        draw(player) {
            var shield = globalLancerMechShield.getShield(player, false);
            shield.draw();
        }
    });

    m.weapon = lancerLaserWeapon;
    m.flying = false;
    m.speed = 0.5;
    m.boostSpeed = 1.6;
    m.drag = 0.3;
    m.mass = 3;
    m.shake = 3;
    m.health = 380;
    m.mineSpeed = 6;
    m.drillPower = 8;
    m.buildPower = 3.2;
    // m.buildPower = 60;
    m.engineColor = Color.valueOf("98F5FF");
    m.itemCapacity = 600;
    m.turnCursor = true;
    m.canHeal = true;
    m.compoundSpeed = 8;
    m.compoundSpeedBoost = 3;
    m.drawCell = true;
    m.drawItems = true;
    m.drawLight = true;
    m.engineOffset = 5;
    m.engineSize = 3;
    m.weaponOffsetY = -2;
    m.weaponOffsetX = 5;

    return m;
})();
// So I move the definition to js, 'content error' again?
const mechPad = extendContent(MechPad, 'lancer-mech-pad', {
    load() {
        this.mech = mech;
        this.super$load();
    },
});
mechPad.mech = mech;
