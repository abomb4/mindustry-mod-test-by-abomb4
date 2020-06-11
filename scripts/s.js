
const biu = newEffect(50, e => {

    var pos = e.data;

    Draw.color(e.color.add(new Color(0.009, 0.009, 0.009, 0.009)));
    Draw.alpha(e.fout());
    Lines.stroke(2.5);
    Lines.line(e.x, e.y, pos.getX(), pos.getY());
    Draw.color(e.color);
    Draw.alpha(e.fout());
    Lines.stroke(1.5);
    Lines.line(e.x, e.y, pos.getX(), pos.getY());
    // Draw.reset();
});

const 超时空包裹 = extend(MassDriverBolt, {

    draw(b) {
    },

    load() {
        this.hitEffect = Fx.hitBulletBig;
    }
});

const 超时空驱动器 = extendContent(MassDriver, "超时空驱动器", {

    /**
     * 大部分都是复写 java 代码，有些功能好像还不太好写，super 这种 js 不好调用
     */
    fire(tile, target) {
        var entity = tile.ent();
        var other = target.ent();

        var data = new Packages.mindustry.world.blocks.distribution.MassDriver.DriverBulletData();

        data.from = entity;
        data.to = other;

        var totalUsed = 0;
        const content = Vars.content;
        for (var i = 0; i < content.items().size; i++) {
            var maxTransfer = Math.min(entity.items.get(content.item(i)), (tile.block()).itemCapacity - totalUsed);
            data.items[i] = maxTransfer;
            totalUsed += maxTransfer;
            entity.items.remove(content.item(i), maxTransfer);
        }

        var angle = tile.angleTo(target);
        var translation = this.translation;

        Bullet.create(超时空包裹, entity, entity.getTeam(),
            tile.drawx() + Angles.trnsx(angle, translation),
            tile.drawy() + Angles.trnsy(angle, translation),
            angle, 12, 12, data);

        Effects.effect(this.shootEffect, tile.drawx() + Angles.trnsx(angle, translation),
        tile.drawy() + Angles.trnsy(angle, translation), angle);

        Effects.effect(this.smokeEffect, tile.drawx() + Angles.trnsx(angle, translation),
        tile.drawy() + Angles.trnsy(angle, translation), angle);

        Effects.effect(biu, Color.red,
            tile.drawx() + Angles.trnsx(angle, translation),
            tile.drawy() + Angles.trnsy(angle, translation),
            0, {
                getX() {
                    return target.drawx();
                },
                getY() {
                    return target.drawy();
                }
            }
        );

        Effects.shake(this.shake, this.shake, entity);
    },
    // linkValid(tile){
    //     if(tile == null) return false;
    //     var entity = tile.ent();
    //     if(entity == null || !(entity.link) || entity.link == -1) return false;
    //     var link = Vars.world.tile(entity.link);

    //     return link != null && link.block().minDistribute && link.getTeam() == tile.getTeam();
    // }
});
