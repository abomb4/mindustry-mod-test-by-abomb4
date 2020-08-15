
const lib = require('abomb4/lib');

const chronoBridge = (() => {

    const b = extendContent(ItemBridge, "chrono-bridge", {

        linkValid(tile, other, checkDouble) {
            if (other == null || tile == null) return false;

            if (checkDouble === undefined) { checkDouble = true; }
            return other.block() == this
                && (!checkDouble || other.ent().link != tile.pos())
                && tile.withinDst(other, this.range * Vars.tilesize);
        },
        // onConfigureTileTapped(tile, other) {
        //     var entity = tile.ent();

        //     if (this.linkValid(tile, other)) {
        //         if (entity.link == other.pos()) {
        //             tile.configure(Pos.invalid);
        //         } else if (other.entity.link != tile.pos()) {
        //             tile.configure(other.pos());
        //         }
        //         return false;
        //     }
        //     return true;
        // },
        drawConfigure(tile) {
            var entity = tile.ent();

            Draw.color(Pal.accent);
            Lines.stroke(1);
            Lines.square(tile.drawx(), tile.drawy(),
                tile.block().size * Vars.tilesize / 2 + 1);

            var target;
            if (entity.link != Pos.invalid && (target = Vars.world.tile(entity.link)) != null && this.linkValid(tile, target, true)) {
                var sin = Mathf.absin(Time.time(), 6, 1);

                Draw.color(Pal.place);
                Lines.square(target.drawx(), target.drawy(), target.block().size * Vars.tilesize / 2 + 1 + (Mathf.absin(Time.time(), 4, 1)));

                Draw.color(Pal.accent);
                Drawf.arrow(tile.drawx(), tile.drawy(), target.drawx(), target.drawy(), this.size * Vars.tilesize + sin, 4 + sin);
            }

            Drawf.dashCircle(tile.drawx(), tile.drawy(), this.range * Vars.tilesize, Pal.accent);
        },
        drawPlace(x, y, rotation, valid) {
            const range = this.range;
            const tilesize = Vars.tilesize;
            Drawf.dashCircle(x * tilesize, y * tilesize, range * tilesize, Pal.accent);

            // check if a mass driver is selected while placing this driver
            if (!Vars.control.input.frag.config.isShown()) return;
            var selected = Vars.control.input.frag.config.getSelectedTile();
            if (selected == null || !(selected.dst(x * tilesize, y * tilesize) <= range * tilesize)) return;

            // if so, draw a dotted line towards it while it is in range
            var sin = Mathf.absin(Time.time(), 6, 1);
            Tmp.v1.set(x * tilesize, y * tilesize).sub(selected.drawx(), selected.drawy()).limit((this.size / 2 + 1) * tilesize + sin + 0.5);
            var x2 = x * tilesize - Tmp.v1.x, y2 = y * tilesize - Tmp.v1.y,
                x1 = selected.drawx() + Tmp.v1.x, y1 = selected.drawy() + Tmp.v1.y;
            var segs = (selected.dst(x * tilesize, y * tilesize) / tilesize);

            Lines.stroke(2, Pal.gray);
            Lines.dashLine(x1, y1, x2, y2, segs);
            Lines.stroke(1, Pal.placing);
            Lines.dashLine(x1, y1, x2, y2, segs);
            Draw.reset();
        },
        drawLayer(tile) {
            // 连线
            const tilesize = Vars.tilesize;
            var entity = tile.ent();

            var other = Vars.world.tile(entity.link);
            if (!this.linkValid(tile, other)) return;

            var opacity = Core.settings.getInt("bridgeopacity") / 100;
            if (Mathf.zero(opacity)) return;

            // draw it

            var angle = Angles.angle(tile.worldx(), tile.worldy(), other.worldx(), other.worldy());
            Draw.color(Color.white, Color.black, Mathf.absin(Time.time(), 6, 0.07));
            Draw.alpha(Math.max(entity.uptime, 0.25) * opacity);

            Draw.rect(this.endRegion, tile.drawx(), tile.drawy(), angle + 90);
            Draw.rect(this.endRegion, other.drawx(), other.drawy(), angle + 270);

            Lines.stroke(8);
            Lines.line(this.bridgeRegion, tile.worldx(), tile.worldy(), other.worldx(), other.worldy(), CapStyle.none, 0);

            var dist = Math.max(Math.abs(other.x - tile.x), Math.abs(other.y - tile.y));

            var time = entity.time2 / 1.7;
            var arrows = (dist) * tilesize / 4 - 2;

            Draw.color();

            for (var a = 0; a < arrows; a++) {
                Draw.alpha(Mathf.absin(a / arrows - entity.time / 100, 0.1, 1) * entity.uptime * opacity);
                Draw.rect(this.arrowRegion,
                    tile.worldx() + Angles.trnsx(angle, (tilesize / 2 + a * 4 + time % 4)),
                    tile.worldy() + Angles.trnsy(angle, (tilesize / 2 + a * 4 + time % 4)), angle);
            }
            Draw.reset();
        },
        canDump(tile, to, item) {
            // 直接允许四个方向输出
            return true;
        },
        acceptItem(item, tile, source) {
            if (tile.getTeam() != source.getTeam()) return false;
            const itemCapacity = this.itemCapacity;

            var entity = tile.ent();
            if (entity) {
                var other = Vars.world.tile(entity.link);

                if (!this.linkValid(tile, other)) {
                    return source.block() == this && source.ent().link == tile.pos() && tile.entity.items.total() < itemCapacity;
                }

                return tile.entity.items.total() < itemCapacity;
            }
            return false;
        },
        update(tile) {
            this.super$update(tile);

            // Try dump liquid if not be connected
            var entity = tile.ent();
            if (entity) {
                var other = Vars.world.tile(entity.link);
                if(!this.linkValid(tile, other)){
                    this.tryDumpLiquid(tile, entity.liquids.current());
                }
            }
        },
        acceptLiquid(tile, source, liquid, amount) {
            if (tile.getTeam() != source.getTeam() || !this.hasLiquids) return false;

            var entity = tile.ent();
            var other = Vars.world.tile(entity.link);

            if (this.linkValid(tile, other)) {
                return true;
            } else if (!(source.block() == this && source.ent().link == tile.pos())) {
                return false;
            }

            return tile.entity.liquids.get(liquid) + amount < this.liquidCapacity
                && (tile.entity.liquids.current() == liquid || tile.entity.liquids.get(tile.entity.liquids.current()) < 0.2);
        },
        updateTransport(tile, other) {
            var entity = tile.ent();

            if (entity.uptime >= 0.5 && entity.timer.get(this.timerTransport, this.transportTime)) {
                // transport items
                var item = entity.items.take();
                if (item != null && other.block().acceptItem(item, other, tile)) {
                    other.block().handleItem(item, other, tile);
                    entity.cycleSpeed = Mathf.lerpDelta(entity.cycleSpeed, 4, 0.05);
                } else {
                    entity.cycleSpeed = Mathf.lerpDelta(entity.cycleSpeed, 1, 0.01);
                    if (item != null) entity.items.add(item, 1);
                }

                // transport liquid
                this.tryMoveLiquid(tile, other, false, entity.liquids.current());
            }
        }
    });
    return b;
})();
