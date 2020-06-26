
const lib = require('abomb4/lib');

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
    }
});
