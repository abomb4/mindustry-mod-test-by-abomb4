
const built = {};
function canBuild(team) {
    if (!built[team.id]) {
        built[team.id] = 0;
    }
    return built[team.id] < 2;
}
function addBuild(team) {
    if (!built[team.id]) {
        built[team.id] = 0;
    }
    built[team.id]++;
}
function removeBuild(team) {
    if (!built[team.id]) {
        built[team.id] = 0;
    }
    built[team.id]--;
}
const anotherCoreEntity = (core) => {
    var theTeam = Vars.player.team;
    const entity = new JavaAdapter(CoreBlock.CoreEntity, {
        added() {
            this.super$added();
            theTeam = this.team;
            addBuild(theTeam);
        },
        removed() {
            removeBuild(theTeam);
            this.super$removed();
        },
    }, core);
    return entity;
};
const anotherCore = extendContent(CoreBlock, "another-core", {
    canBreak() {
        return Vars.state.teams.cores(Vars.player.team).size > 1;
    },
    isVisible() {
        return this.super$isVisible() && canBuild(Vars.player.team);
    }
});
anotherCore.entityType = prov(() => anotherCoreEntity(anotherCore));

Events.on(EventType.WorldLoadEvent, run(() => {
    built = {};
}));
