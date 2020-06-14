
var built = 0;
const anotherCoreEntity = (core) => {
    return new JavaAdapter(CoreBlock.CoreEntity, {
        added() {
            this.super$added();
            built++;
        },
        removed() {
            this.super$removed();
            built--;
        },
    }, core);
};
const anotherCore = extendContent(CoreBlock, "another-core", {
    canBreak() {
        return true;
    },
    isVisible() {
        return built <= 0;
    }
});
anotherCore.entityType = prov(() => anotherCoreEntity(anotherCore));

Events.on(EventType.WorldLoadEvent, run(() => {
    built = 0;
}));
