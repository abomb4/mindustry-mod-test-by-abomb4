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

const unitIControlledBy = {};

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
        targetEntity.remove();
    }
}

const mindControlEntity = () => {

    const group = new EntityGroup(groupArray.size, Entity, true);

    const entity = extend(TileEntity, {
        getControlGroup() { return group; },
    });
    return entity;
};

const mindControlBlock = extendContent(Block, "mind-control", {
    maxControl: 10,
    mindControl(tile, unit) {

    },
});

Events.on(UnitDestroyEvent, cons((v) => {

}));
