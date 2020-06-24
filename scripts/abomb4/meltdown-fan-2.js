
// 大 风 车 吱扭吱扭扭地2转

const lib = require("lib");

const meltdownLaser2 = (() => {
    const tmpColor = new Color();
    const colors = [Color.valueOf("ec745855"), Color.valueOf("ec7458aa"), Color.valueOf("ff9c5a"), Color.white];
    const tscales = [1, 0.7, 0.5, 0.2];
    const strokes = [2, 1.5, 1, 0.3];
    const lenscales = [1, 1.12, 1.15, 1.17];
    const length = 120;

    const bt = extend(BasicBulletType, {
        update(b) {
            if (b.timer.get(1, 5)) {
                Damage.collideLine(b, b.getTeam(), this.hitEffect, b.x, b.y, b.rot(), length, true);
            }
            Effects.shake(1, 1, b.x, b.y);
        },
        hit(b, hitx, hity) {
            if (hitx && hity) {
                Effects.effect(this.hitEffect, colors[2], hitx, hity);
                if (Mathf.chance(0.4)) {
                    Fire.create(Vars.world.tileWorld(hitx + Mathf.range(5), hity + Mathf.range(5)));
                }
            }
        },
        draw(b) {
            const baseLen = (length) * b.fout();

            Lines.lineAngle(b.x, b.y, b.rot(), baseLen);
            for (var s = 0; s < colors.length; s++) {
                Draw.color(tmpColor.set(colors[s]).mul(1 + Mathf.absin(Time.time(), 1, 0.1)));
                for (var i = 0; i < tscales.length; i++) {
                    Tmp.v1.trns(b.rot() + 180, (lenscales[i] - 1) * 35);
                    Lines.stroke((9 + Mathf.absin(Time.time(), 0.8, 1.5)) * b.fout() * strokes[s] * tscales[i]);
                    Lines.lineAngle(b.x + Tmp.v1.x, b.y + Tmp.v1.y, b.rot(), baseLen * lenscales[i], CapStyle.none);
                }
            }
            Draw.reset();
        },
    });

    bt.hitEffect = Fx.hitMeltdown;
    bt.despawnEffect = Fx.none;
    bt.hitSize = 4;
    bt.drawSize = 420;
    bt.damage = 15;
    bt.lifetime = 32;
    bt.pierce = true;
    bt.keepVelocity = false;

    return bt;
})();
const bulletType = extend(BasicBulletType, {

    update(b) {
        this.super$update(b);
        const time = (b.time() || 0);
        const angle = 45 + time * 3;
        if (Math.floor(time) % 3 == 0) {
            Bullet.create(meltdownLaser2, b, b.getTeam(), b.x, b.y, angle, 1, 1).deflect();
            Bullet.create(meltdownLaser2, b, b.getTeam(), b.x, b.y, angle - 120, 1, 1).deflect();
            Bullet.create(meltdownLaser2, b, b.getTeam(), b.x, b.y, angle - 240, 1, 1).deflect();
        }
    },

});
bulletType.lifetime = 420;
bulletType.speed = 0.01;
bulletType.bulletHeight = 60;
bulletType.bulletWidth = 90;
bulletType.damage = 5000; // 大约2s 一个 11000 血的死神，就算 5000/s 伤害好了
bulletType.hitSize = 0;
bulletType.pierce = true;
bulletType.hitTiles = false;
bulletType.collides = false;
bulletType.collidesTiles = false;
bulletType.collidesAir = false;

const fan = extendContent(PowerTurret, 'meltdown-fan-2', {
    load() {
        this.super$load();
        this.baseRegion = Core.atlas.find(lib.aModName + "-meltdown-fan-2-base");
    },
    generateIcons(){
        const list = this.super$generateIcons();
        list[0] = Core.atlas.find(lib.aModName + "-meltdown-fan-2-base");
        list[1] = Core.atlas.find(this.name);
        return list;
    },
    shoot(tile, ammo) {
        var entity = tile.ent();
        if (entity.target) {
            entity.shots++;

            var targetX = entity.target.x;
            var targetY = entity.target.y;

            var i = Mathf.signs[entity.shots % 2];

            // this.tr.trns(entity.rotation - 90, this.shotWidth * i, this.size * this.tilesize / 2);
            var blt = Bullet.create(ammo, tile.entity, tile.getTeam(), tile.drawx(), tile.drawy(), this.angle || 1, 1, 1);
            blt.x = targetX;
            blt.y = targetY;
            this.effects(tile);
            this.useAmmo(tile);
        }
    },
});

fan.shootType = bulletType;
