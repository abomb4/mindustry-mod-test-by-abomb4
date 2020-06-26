
const lib = require('abomb4/lib');

const globalLancerMechShield = (() => {

    const SHIELD_ID = 0;

    const map = {}
    const MAX_CHARGE = 2000;
    const CHARGE_STEP = 6;
    const MAX_RADIUS = 24;
    const MIN_RADIUS = 12;
    const MAX_RADIUS_PRECENT = 0.5;
    const MIN_RADIUS_PERCENT = 0.2;
    const MIN_CHARGE_PERCENT = 0.2;

    function PlayerShield(player) {
        var entity = {
            player: player,
            id: ++SHIELD_ID,
            power: MAX_CHARGE / 2,
            broken: false,
            hit: 0
        };
        function setPower(v) { entity.power = v; }
        function getPower() { return entity.power; }
        function setHit(v) { entity.hit = v; }
        function getHit() { return entity.hit; }
        function setBroken(v) { entity.broken = v; }
        function getBroken() { return entity.broken; }

        function handleDamage(trait) {
            trait.absorb();
            Effects.effect(Fx.absorb, trait);
            setPower(getPower() - trait.getShieldDamage())
            print('damage: ' + trait.getShieldDamage() + ', power left: ' + getPower());
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
                print('charge: ' + CHARGE_STEP * num);
                setPower(Math.min(getPower() + CHARGE_STEP * num, MAX_CHARGE));
            }

            if (getPower() > MAX_CHARGE * MIN_CHARGE_PERCENT) {
                setBroken(false);
            }
        }

        function tryAbsorb() {
            const realRadius = activeRadius();
            if(getHit() > 0){
                setHit(getHit() - 1 / 5 * Time.delta());
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
const lancerLaser2 = (() => {
    const tmpColor = new Color();
    const colors = [Pal.lancerLaser.cpy().mul(1, 1, 1, 0.4), Pal.lancerLaser, Color.white];
    const tscales = [1, 0.7, 0.5, 0.2];
    const strokes = [2, 1.5, 1, 0.3];
    const lenscales = [1, 1.1, 1.13, 1.17];
    const length = 160;

    const bt = extend(BasicBulletType, {
        init(b) {
            if (b) {
                Damage.collideLine(b, b.getTeam(), this.hitEffect, b.x, b.y, b.rot(), length);
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
    });

    bt.hitEffect = Fx.hitLancer;
    bt.despawnEffect = Fx.none;
    bt.speed = 0.01;
    bt.hitSize = 4;
    bt.drawSize = 420;
    bt.damage = 70;
    bt.lifetime = 16;
    bt.pierce = true;
    bt.keepVelocity = false;

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
    w.length = 6; // Y length
    w.alternate = true;
    w.shootSound = Sounds.bigshot;
    return w;
})();

const mech = (() => {
    const m = extendContent(Mech, 'abomb4-lancer-mech', {
        getExtraArmor(player) {
            return player.shootHeat * 75;
        },
        updateAlt(player) {
            var shield = globalLancerMechShield.getShield(player, false);
            shield.charge(player.isShooting() ? 1 : 0);
            shield.defence();
        },
        draw(player) {
            var shield = globalLancerMechShield.getShield(player, false);
            shield.draw();
        }
    });

    m.weapon = lancerLaserWeapon;
    m.flying = false;
    m.speed = 0.2;
    m.maxSpeed = 5;
    m.boostSpeed = 2;
    m.drag = 0.09;
    m.mass = 1.5;
    m.shake = 3;
    m.health = 370;
    m.mineSpeed = 3;
    m.drillPower = 2;
    m.buildPower = 60;
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
extendContent(MechPad, 'lancer-mech-pad', {
    load() {
        this.mech = mech;
        this.super$load();
    },
});
