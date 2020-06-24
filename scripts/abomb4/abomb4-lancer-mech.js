
const lib = require('/abomb4/lib');

const healBeamFrag = (() => {

    const hitEffect = newEffect(8, (e) => {
        Draw.color(Color.white, Pal.heal, e.fin());
        Lines.stroke(0.5 + e.fout());
        Lines.circle(e.x, e.y, e.fin() * 10);
    });

    const bt = extend(HealBulletType, {
        init(b) {
            if (b) {
                this.super$init(b);
                this.healPercent = 5;
                this.speed = 3;
                this.damage = 10;
                this.homingPower = 15;
                this.splashDamage = 5;
                this.splashDamageRadius = 10;
                this.hitEffect = hitEffect;
                this.lifetime = 20;
            }
        },
        draw(b) {
            Draw.color(Pal.heal);
            Lines.stroke(1);
            Lines.lineAngleCenter(b.x, b.y, b.rot(), 6);
            Draw.color(Color.white);
            Lines.lineAngleCenter(b.x, b.y, b.rot(), 1);
            Draw.reset();
        },
    });
    return bt;
})();
const healBeam = (() => {

    const hitEffect = newEffect(8, (e) => {
        Draw.color(Color.white, Pal.heal, e.fin());
        Lines.stroke(0.5 + e.fout());
        Lines.circle(e.x, e.y, e.fin() * 30);
    });

    const bt = extend(HealBulletType, {
        init(b) {
            if (b) {
                this.super$init(b);
                this.healPercent = 10;
                this.speed = 7;
                this.damage = 30;
                this.homingPower = 50;
                this.splashDamage = 10;
                this.splashDamageRadius = 30;
                this.hitEffect = hitEffect;
                this.fragBullet = healBeamFrag;
                this.fragBullets = 3;
                this.lifetime = 40;
            }
        },
        draw(b) {
            Draw.color(Pal.heal);
            Lines.stroke(2);
            Lines.lineAngleCenter(b.x, b.y, b.rot(), 15);
            Draw.color(Color.white);
            Lines.lineAngleCenter(b.x, b.y, b.rot(), 1);
            Draw.reset();
        },
    });
    return bt;
})();

const landerLaser2 = (() => {
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

const weapon = (() => {

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
    w.bullet = landerLaser2;
    w.reload = 10;
    w.shots = 1;
    w.inaccuracy = 0;
    w.shake = 0.5;
    w.recoil = 2;
    w.length = 3; // Y length
    w.alternate = true;
    w.shootSound = Sounds.bigshot;
    return w;
})();

const mech = (() => {
    const m = extendContent(Mech, 'abomb4-lancer-mech', {
        getExtraArmor(player) {
            return player.shootHeat * 75;
        },
    });

    m.weapon = weapon;
    m.flying = false;
    m.speed = 0.2;
    m.maxSpeed = 5;
    m.boostSpeed = 2;
    m.drag = 0.09;
    m.mass = 1.5;
    m.shake = 3;
    m.health = 370;
    m.hitsize = 15;
    m.mineSpeed = 3;
    m.drillPower = 2;
    m.buildPower = 60;
    m.engineColor = Color.valueOf("98F5FF");
    m.itemCapacity = 600;
    m.turnCursor = true;
    m.canHeal = false;
    m.compoundSpeed = 8;
    m.compoundSpeedBoost = 3;
    m.drawCell = true;
    m.drawItems = true;
    m.drawLight = true;
    m.engineOffset = 5;
    // mech.engineSize = 3;
    m.weaponOffsetY = -2;
    m.weaponOffsetX = 5;

    return m;
})();
