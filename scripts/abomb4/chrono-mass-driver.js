
const biu = newEffect(50, e => {

    var pos = e.data;

    Draw.color(e.color.add(new Color(0.009, 0.009, 0.009, 0.009)));
    Draw.alpha(e.fout());
    Lines.stroke(1.5);
    Lines.line(e.x, e.y, pos.getX(), pos.getY());
    Draw.color(e.color);
    Draw.alpha(e.fout());
    Lines.stroke(0.5);
    Lines.line(e.x, e.y, pos.getX(), pos.getY());
    // Draw.reset();
});

const ChronoMassDriverBolt = extend(MassDriverBolt, {

    draw(b) {
    },

    load() {
        this.hitEffect = Fx.hitBulletBig;
    }
});

const chronoMassDriver = extendContent(MassDriver, "chrono-mass-driver", {

    update(tile) {
        this.super$update(tile);
        // 添加一些液体相关逻辑
        const entity = tile.ent();
        // dump when idle or accepting
        // 干他妈的这么多字段都不是 protected 也不是 public 根本没法定制
        // if (entity.state == MassDriver.DriverState.idle || entity.state == MassDriver.DriverState.accepting) {
        //     tryDumpLiquid(tile, entity.liquids.current());
        // }
        var hasLink = this.linkValid(tile);
        if (hasLink) {
            // 液体够了就发射的逻辑无法实现，没法旋转，因为数据都是 package-private 没法访问
        } else {
            this.tryDumpLiquid(tile, entity.liquids.current());
        }


        // TODO 如果不处于 shooting 状态，通过液体判断是否需要发射


    },
    /**
     * 大部分都是复写 java 代码，因为当时不知道有 this.super$
     */
    fire(tile, target) {
        var entity = tile.ent();
        var other = target.ent();

        var data = (() => {
            var liquid = null;
            var liquidAmount = 0;
            const b = extend(MassDriver.DriverBulletData, {
                getLiquid() { return liquid; },
                setLiquid(v) { liquid = v; print('in set liquid') },
                getLiquidAmount() { return liquidAmount; },
                setLiquidAmount(v) { liquidAmount = v; },
            });
            return b;
        })();

        data.from = entity;
        data.to = other;

        // Package items
        var totalUsed = 0;
        const content = Vars.content;
        for (var i = 0; i < content.items().size; i++) {
            var maxTransfer = Math.min(entity.items.get(content.item(i)), (tile.block()).itemCapacity - totalUsed);
            data.items[i] = maxTransfer;
            totalUsed += maxTransfer;
            entity.items.remove(content.item(i), maxTransfer);
        }

        // Package liquids
        var liquid = entity.liquids.current();
        var liquidAmount;
        if (target.block() == this && liquid != null && (liquidAmount = tile.entity.liquids.get(liquid)) > 0) {
            entity.liquids.remove(liquid, liquidAmount);
            print('want set liquid');
            data.setLiquid(liquid);
            data.setLiquidAmount(liquidAmount);
        }

        var angle = tile.angleTo(target);
        var translation = this.translation;

        const transX = Angles.trnsx(angle, translation);
        const transY = Angles.trnsy(angle, translation);
        var b = Bullet.create(ChronoMassDriverBolt, entity, entity.getTeam(),
            tile.drawx() + transX,
            tile.drawy() + transY,
            angle, 12, 12, data);
        b.set(target.drawx(),target.drawy());

        Effects.effect(this.shootEffect, tile.drawx() + transX, tile.drawy() + transY, angle);
        Effects.effect(this.smokeEffect, tile.drawx() + transX, tile.drawy() + transY, angle);

        Effects.effect(biu, Color.purple,
            tile.drawx() + transX,
            tile.drawy() + transY,
            0, {
                getX() { return target.drawx(); },
                getY() { return target.drawy(); }
            }
        );
        Effects.effect(biu, Color.purple,
            target.drawx(),
            target.drawy(),
            0, {
                getX() { return tile.drawx() + transX; },
                getY() { return tile.drawy() + transY; }
            }
        );

        Effects.shake(this.shake, this.shake, entity);
    },
    tryDump(tile) {
        // 24X SUPER DUMP SPPED!?
        for (var i = 24; i > 0; i--) {
            this.super$tryDump(tile, null);
        }
    },
    handlePayload(entity, bullet, data) {
        this.super$handlePayload(entity, bullet, data);
        const liquid = data.getLiquid();
        const liquidCapacity = this.liquidCapacity;
        if (liquid != null) {
            const current = entity.liquids.get(liquid)
            const amount = data.getLiquidAmount();

            // 多的直接浪费
            entity.liquids.add(data.getLiquid(), Math.min(liquidCapacity, current + amount));
        }
    },
    acceptLiquid(tile, source, liquid, amount) {
        return tile.entity.liquids.get(liquid) + amount < this.liquidCapacity
            && (tile.entity.liquids.current() == liquid || tile.entity.liquids.get(tile.entity.liquids.current()) < 0.2)
            && this.linkValid(tile);
    }
    // linkValid(tile){
    //     if(tile == null) return false;
    //     var entity = tile.ent();
    //     if(entity == null || !(entity.link) || entity.link == -1) return false;
    //     var link = Vars.world.tile(entity.link);

    //     return link != null && link.block().minDistribute && link.getTeam() == tile.getTeam();
    // }
});
chronoMassDriver.shake = 1;
