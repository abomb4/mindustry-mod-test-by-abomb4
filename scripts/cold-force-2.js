
const mockDataOutput = new java.io.DataOutput({
    objs: [],

    myPush(v) {
        this.objs.push(v);
    },

    write(v) {
        this.myPush(v);
    },

    write(v) {
        this.myPush(v);
    },

    write(b, off, len) {
    },

    writeBoolean(v) {
        this.myPush(v);
    },

    writeByte(v) {
        this.myPush(v);
    },

    writeShort(v) {
        this.myPush(v);
    },

    writeChar(v) {
        this.myPush(v);
    },

    writeInt(v) {
        this.myPush(v);
    },

    writeLong(v) {
        this.myPush(v);
    },

    writeFloat(v) {
        this.myPush(v);
    },

    writeDouble(v) {
        this.myPush(v);
    },

    writeBytes(v) {
        this.myPush(v);
    },

    writeChars(v) {
        this.myPush(v);
    },

    writeUTF(v) {
        this.myPush(v);
    },
    myPop() {
        return this.objs.pop();
    },
});

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
                        print("freeze him! : " + v);
                        v.applyEffect(StatusEffects.freezing, 1);
                    }
                }
            }));
        }
    }
});
