
const lib = require('abomb4/lib');

const healBeamFrag = (() => {

    const tailEffect = newEffect(6, e => {
        Draw.color(Pal.heal);
        Drawf.tri(e.x, e.y, 4 * e.fout(), 8, e.rotation);
        Drawf.tri(e.x + Angles.trnsx(e.rotation, 8), e.y + Angles.trnsy(e.rotation, 8), 4 * (e.fout() * 0.8 + 0.2), 24 * (e.fin() * 0.8 + 0.2), e.rotation - 180);
    });

    const hitEffect = newEffect(8, (e) => {
        Draw.color(Color.white, Pal.heal, e.fin());
        Lines.stroke(0.5 + e.fout());
        Lines.circle(e.x, e.y, e.fin() * 10);
    });

    const bt = extend(HealBulletType, {
        load() {
            this.super$load();
            this.healPercent = 5;
            this.speed = 3;
            this.damage = 10;
            this.homingPower = 15;
            this.homingRange = 50;
            this.splashDamage = 5;
            this.splashDamageRadius = 10;
            this.hitEffect = hitEffect;
            this.lifetime = 20;
        },
        draw(b) {
            Draw.color(Pal.heal);
            // Lines.stroke(1);
            // Lines.lineAngleCenter(b.x, b.y, b.rot(), 6);
            // Draw.color(Color.white);
            // Lines.lineAngleCenter(b.x, b.y, b.rot(), 1);

            Drawf.tri(b.x, b.y, 4, 8, b.rot());
            Drawf.tri(b.x, b.y, 4, 12, b.rot() - 180);
            Draw.reset();
        },
        update(b) {
            if (b.timer.get(1, 1)) {
                Effects.effect(tailEffect, Pal.heal, b.x, b.y, b.rot());
            }
            if (this.homingPower > 0.0001) {
                var target = Units.closestTarget(b.getTeam(), b.x, b.y, this.homingRange, boolf(e => !e.isFlying() || this.collidesAir));
                if (target != null) {
                    b.velocity().setAngle(Mathf.slerpDelta(b.velocity().angle(), b.angleTo(target), 0.2));
                }
            }
        },
    });
    return bt;
})();
const healBeam = (() => {
    const tailEffectTime = 12;
    const tailEffect = newEffect(tailEffectTime, e => {
        Draw.color(Pal.heal);
        Drawf.tri(e.x, e.y, 8 * e.fout(), 16, e.rotation);
        Drawf.tri(e.x, e.y, 8 * e.fout(), 30 * Math.min(1, e.data.time / 6 * 0.8 + 0.2), e.rotation - 180);
    });

    const hitEffect = newEffect(8, (e) => {
        Draw.color(Color.white, Pal.heal, e.fin());
        Lines.stroke(0.5 + e.fout());
        Lines.circle(e.x, e.y, e.fin() * 30);
    });

    const bt = extend(HealBulletType, {
        load() {
            this.hitSize = 8;
            this.healPercent = 10;
            this.speed = 6;
            this.damage = 30;
            this.homingPower = 60;
            this.homingRange = 240;
            this.splashDamage = 10;
            this.splashDamageRadius = 30;
            this.hitEffect = hitEffect;
            this.fragBullet = healBeamFrag;
            this.fragBullets = 6;
            this.lifetime = 70;
        },
        draw(b) {
            Draw.color(Pal.heal);
            // Lines.stroke(2);
            // Lines.lineAngleCenter(b.x, b.y, b.rot(), 15);
            // Draw.color(Color.white);
            // Lines.lineAngleCenter(b.x, b.y, b.rot(), 1);

            Drawf.tri(b.x, b.y, 8, 16, b.rot());
            Drawf.tri(b.x, b.y, 8, 30 * Math.min(1, b.time() / this.speed * 0.8 + 0.2), b.rot() - 180);
            Draw.reset();
        },
        update(b) {

            if (b.timer.get(1, 1)) {
                Effects.effect(tailEffect, Pal.heal, b.x, b.y, b.rot(), { time: ((v) => v)(b.time())});
            }
            if (this.homingPower > 0.0001 && b.time() > 25) {
                var target = Units.closestTarget(b.getTeam(), b.x, b.y, this.homingRange, boolf(e => !e.isFlying() || this.collidesAir));
                if (target != null) {
                    b.velocity().setAngle(Mathf.slerpDelta(b.velocity().angle(), b.angleTo(target), 0.2));
                }
            }
        },
    });
    return bt;
})();

const superHealBeamShotgunWeapon = (() => {

    const fullName = lib.aModName + '-' + 'super-heal-beam-weapon';
    const w = extend(Weapon, {
        load() {
            // Add a prefix prevent confliction with other mods
            this.name = fullName;
            this.super$load();

            // const assetName = lib.aModName + '-' + this.name;
            // this.region = Core.atlas.find(
            //     assetName + "-equip",
            //     Core.atlas.find(assetName + "-equip", Core.atlas.find("clear"))
            // );
            // print('load ' + this.name + '-equip : ' + this.region);
        },
    });

    w.name = fullName;
    w.bullet = healBeam;
    w.inaccuracy = 0;
    w.shots = 12;
    w.spacing = 6;

    w.reload = 60;
    w.shake = 0.5;
    w.recoil = 2;
    w.length = 6; // Y length
    w.alternate = true;
    w.shootSound = Sounds.bigshot;
    return w;
})();

const terminator = (() => {

    // const unit = extendContent(UnitType, 'terminator-unit', {
    //     load() {
    //         this.weapon = superHealBeamShotgunWeapon;
    //         this.super$load();
    //     },
    // });
    const unit = extendContent(UnitType, 'terminator-unit', {
        load() {
            this.create(prov(() => new GroundUnit()));
            this.weapon = superHealBeamShotgunWeapon;
            this.super$load();
        },
    });
    return unit;
})();
