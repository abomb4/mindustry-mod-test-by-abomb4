
/**
 * 将某方块变成玩家己方
 *
 * @param {Unit} entity 一般是 tile.ent().target.entity
 */
exports.mindControl = function(entity) {
    var typeName = entity.getClass().getName();
    if (typeName.endsWith("Unit")) {
        var unit = entity.getType().create(Vars.player.getTeam());
        unit.set(entity.x, entity.y);
        unit.add();
        entity.remove();
    } else {
        entity.tile.setTeam(Vars.player.getTeam());
    }
}

exports.loadSound = function(name, setter) {
    const params = new Packages.arc.assets.loaders.SoundLoader.SoundParameter();
    params.loadedCallback = new Packages.arc.assets.AssetLoaderParameters.LoadedCallback({
        finishedLoading(asset, str, cls) {
            print('1 load sound ' + name + ' from arc');
            setter(asset.get(str, cls));
        }
    });

    Core.assets.load("sounds/" + name, Packages.arc.audio.Sound, params).loaded = new Cons({
        get(a) {
            print('2 load sound ' + name + ' from arc');
            setter(a);
        }
    });
}
