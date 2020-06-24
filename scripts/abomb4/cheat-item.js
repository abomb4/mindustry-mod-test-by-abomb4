extendContent(ItemSource, 'cheat-item', {
    tryDump(tile, item) {
        if (item) {
            tile.ent().items.set(item, 90000);
            for (var i = 36; i > 0; i--) {
                this.super$tryDump(tile, item);
            }
        }
    }
});
