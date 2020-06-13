
const anotherCore = extendContent(CoreBlock, "another-core", {
    canBreak() {
        return true;
    },
    placed(tile) {
        this.buildVisibility = BuildVisibility.hidden;
    },
    removed() {
        this.buildVisibility = BuildVisibility.shown;
    },
})
