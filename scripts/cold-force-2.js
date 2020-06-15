
const mockDataOutput = new java.io.DataOutput((() => {
    var objs = []

    function myPush(v) {
        objs.push(v);
    }
    function myPop() {
        return this.objs.pop();
    }

    return {
        myPush: myPush,
        myPop: myPop,
        write(v) {
            myPush(v);
        },

        write(v) {
            myPush(v);
        },

        write(b, off, len) {
        },

        writeBoolean(v) {
            myPush(v);
        },

        writeByte(v) {
            myPush(v);
        },

        writeShort(v) {
            myPush(v);
        },

        writeChar(v) {
            myPush(v);
        },

        writeInt(v) {
            myPush(v);
        },

        writeLong(v) {
            myPush(v);
        },

        writeFloat(v) {
            myPush(v);
        },

        writeDouble(v) {
            myPush(v);
        },

        writeBytes(v) {
            myPush(v);
        },

        writeChars(v) {
            myPush(v);
        },

        writeUTF(v) {
            myPush(v);
        },
    }
})());

const freezeStatusEffect = new StatusEffect("forceFreeze2");

freezeStatusEffect.speedMultiplier = 0.1;
freezeStatusEffect.armorMultiplier = 0.01;
freezeStatusEffect.effect = Fx.freezing;

const blockType = extendContent(ForceProjector, "cold-force-2", {
    update(tile) {
        /* ForceEntity */
        this.super$update(tile);

        tile.ent().write(mockDataOutput);
        // do not remove non-used var
        const phaseHeat = mockDataOutput.myPop();
        const warmup = mockDataOutput.myPop();
        const radscl = mockDataOutput.myPop();
        const buildup = mockDataOutput.myPop();
        const broken = mockDataOutput.myPop();

        const realRadius = (this.radius + phaseHeat * this.phaseRadiusBoost) * radscl;

        if (!broken) {
            Vars.unitGroup.intersect(tile.drawx() - realRadius, tile.drawy() - realRadius, realRadius * 2, realRadius * 2, new Cons({
                get(v) {
                    if (v.getTeam() != tile.getTeam() && Intersector.isInsideHexagon(v.getX(), v.getY(), realRadius * 2, tile.drawx(), tile.drawy())) {
                        v.applyEffect(freezeStatusEffect, 30);
                    }
                }
            }));
        }
    }
});
