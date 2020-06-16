/* unit 的产生与绑定关系什么的，涉及存档、网络时可能会出 bug，先不做了 */
/*
name: Mind control device
description: BE ONE IS YURI.
size: 2
category: turret
research: duo
requirements: [
  copper/1
]
*/
const lib = require('lib');
const loadSound = lib.loadSound;

/** Controlled Effect */
const controlledEffect = newEffect(50, e => {
    Draw.color(e.color);
    Draw.alpha(e.fout());
    // Fill.circle(e.x, e.y, 4 - e.fout() * 4);
    Lines.circle(e.x, e.y, 5 - e.fout() * 5);
});

const unitControlledByGroup = {};

Events.on(EventType.UnitDestroyEvent, cons((v) => {
    const id = v.unit.id;
    const group = unitControlledByGroup[id];
    // print('destory ' + id);
    if (group) {
        // print('real destory ' + id);
        group.remove(v.unit);
    }
}));

const mindControlBulletType = extend(BasicBulletType, {});
mindControlBulletType.speed = 0.01;
mindControlBulletType.damage = 0;
mindControlBulletType.hitSize = 1;
mindControlBulletType.lifetime = 1;
mindControlBulletType.pierce = false;
mindControlBulletType.collidesTiles = false;
mindControlBulletType.collidesTeam = false;
mindControlBulletType.collidesAir = false;
mindControlBulletType.collides = false;

const mindControlEntity = () => {

    const group = (() => {
        const ids = [];
        function add(target) {
            // print('add ' + target.id);
            ids.push(target.id);
            unitControlledByGroup[target.id] = group;
            // print('after add :' + JSON.stringify(unitControlledByGroup));
        };
        function removeId(id) {
            // print('remove ' + id);
            const index = ids.indexOf(id);
            if (index >= 0) {
                ids.splice(index, 1);
                delete unitControlledByGroup[id];
                // print('after remove :' + JSON.stringify(unitControlledByGroup));
            }
        }
        function remove(target) {
            const id = target.id;
            removeId(id);
        };
        function destory() {
            const copy = Object.assign([], ids);
            copy.forEach(i => {
                const d = Vars.unitGroup.getByID(i);
                removeId(i)
                if (!d) {
                    print("Cannot remove id " + i + "!!!!!");
                    return;
                }
                d.damage(2147483647);
            });
        };
        function size() {
            return ids.length;
        };
        function read(str) {
            // TODO resolve every xy
            const xys = JSON.parse(str);
            // print("Will load " + xys.length + " units");
            Events.on(EventType.StateChangeEvent, cons(v => {
                if (v.from == GameState.State.menu && v.to == GameState.State.playing) {
                    // print("Will load continues " + xys.length + " units");
                    // What if i call update here?
                    Vars.unitGroup.update();
                    for (var i in xys) {
                        const xy = xys[i];
                        // print("Try load [" + xy[0] + ", " + xy[1] + "]");
                        Vars.unitGroup.intersect(xy[0], xy[1], 1, 1, cons((v) => {
                            // print("load " + v.id);
                            add(v);
                        }));
                    }
                }
            }));
        };
        function write() {
            // TODO find every xy, to array[array]
            const xys = [];
            for (var i in ids) {
                const id = ids[i];
                const entity = Vars.unitGroup.getByID(id);
                if (entity) {
                    xys.push([entity.getX(), entity.getY()]);
                } else {
                    print("The unit with id " + id + " will not save!");
                }
            }
            return JSON.stringify(xys);
        };
        return {
            read: read,
            write: write,
            add: add,
            remove: remove,
            destory: destory,
            size: size,
        };
    })();

    /**
     * 只能控制单位不能控制建筑
     *
     * @param tile         The tile contains mindControlEntity
     * @param targetEntity 一般是 tile.ent().target.entity
     */
    function mindControl(tile, targetEntity) {
        var typeName = targetEntity.getClass().getName();
        if (typeName.endsWith("Unit")) {
            var unit = targetEntity.getType().create(Vars.player.getTeam());
            unit.set(targetEntity.x, targetEntity.y);
            unit.add();
            group.add(unit);
            targetEntity.remove();
            return true;
        }
        return false;
    }

    const entity = extend(Turret.TurretEntity, {
        mindControl: mindControl,
        getMindControlGroup() { return group; },
        write(stream) {
            this.super$write(stream);
            const writen = group.write();
            // print('write: ' + writen);
            stream.writeUTF(writen);
        },
        read(stream, revision) {
            this.super$read(stream, revision);
            const readed = stream.readUTF()
            // print('read: ' + readed);
            group.read(readed);
        },
        remove() {
            this.super$remove();
            group.destory();
        },
    });
    return entity;
};

const mindControlBlock = extendContent(PowerTurret, "mind-control", {
    maxControl: 10,

    hasAmmo(tile) { return true; },
    peekAmmo(tile) { return mindControlBulletType; },
    shoot(tile, type) {
        const entity = tile.ent();
        const target = entity.target;
        if (target && entity.getMindControlGroup().size() < this.maxControl && entity.mindControl(tile, target)) {
            entity.heat = 1;
            this.effects(tile);
            Effects.effect(controlledEffect, new Color(200, 0, 222, 0.7), target.x, target.y);
        }
    },
    validateTarget(tile) {
        const entity = tile.ent();
        const valid = this.super$validateTarget(tile);
        // Do not target non-unit
        return valid ? entity.target.getClass().getName().endsWith("Unit") : valid;
    },
    // removed(tile) {
    //     this.super$remove
    //     const entity = tile.ent();
    //     entity.getMindControlGroup().destory();
    // },
});
mindControlBlock.shootType = mindControlBulletType;
mindControlBlock.entityType = prov(() => mindControlEntity());
