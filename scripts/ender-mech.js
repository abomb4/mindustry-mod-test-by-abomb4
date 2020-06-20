
const lib = require('lib');

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
    bt.damage = 90;
    bt.lifetime = 16;
    bt.pierce = true;
    bt.keepVelocity = false;

    return bt;
})();

const weapon = (() => {

    const w = extend(Weapon, {
        load() {
            this.name = 'ender-weapon';
            const assetName = lib.modName + '-' + this.name;
            this.region = Core.atlas.find(
                assetName + "-equip",
                Core.atlas.find(assetName + "-equip", Core.atlas.find("clear"))
            );
            print('load ' + assetName + '-equip : ' + this.region);
        },
    });

    w.name = 'ender-weapon';
    w.bullet = landerLaser2;
    w.reload = 10;
    w.shots = 1;
    w.inaccuracy = 0;
    w.shake = 0.5;
    w.recoil = 2;
    w.length = 1;
    w.alternate = true;
    w.shootSound = Sounds.bigshot;
    return w;
})();

const mech = extendContent(Mech, 'ender-mech', {
    getExtraArmor(player) {
        return player.shootHeat * 75;
    },
});
mech.weapon = weapon;
mech.flying = false;
mech.speed = 0.2;
mech.maxSpeed = 5;
mech.boostSpeed = 2;
mech.drag = 0.09;
mech.mass = 1.5;
mech.shake = 3;
mech.health = 370;
mech.hitsize = 15;
mech.mineSpeed = 3;
mech.drillPower = 2;
mech.buildPower = 60;
mech.engineColor = Color.valueOf("98F5FF");
mech.itemCapacity = 600;
mech.turnCursor = true;
mech.canHeal = false;
mech.compoundSpeed = 8;
mech.compoundSpeedBoost = 3;
mech.drawCell = true;
mech.drawItems = true;
mech.drawLight = true;
mech.engineOffset = 5;
mech.engineSize = 3;
mech.weaponOffsetY = -2;
mech.weaponOffsetX = 5;
