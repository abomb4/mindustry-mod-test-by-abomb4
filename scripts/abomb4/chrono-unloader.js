
extendContent(Unloader, "chrono-unloader", {
    removeItem(tile, item) {
        const entity = tile.entity;

        if (item == null) {
            return entity.items.take();
        } else {
            if (entity.items.has(item)) {
                entity.items.remove(item, 1);
                return item;
            }

            return null;
        }
    },
    hasItem(tile, item) {
        const entity = tile.entity;
        if (item == null) {
            return entity.items.total() > 0;
        } else {
            return entity.items.has(item);
        }
    },
    update(tile) {
        const entity = tile.ent();

        for (var i = 13; i > 0; i--) {

            if (tile.entity.items.total() == 0) {
                const proximity = tile.entity.proximity();
                for (var ii = 0; ii < proximity.size; ii++) {
                    const other = proximity.get(ii);
                    if (other.interactable(tile.getTeam()) && other.block().unloadable && other.block().hasItems && entity.items.total() == 0 &&
                        ((entity.sortItem == null && other.entity.items.total() > 0) || this.hasItem(other, entity.sortItem))) {
                        this.offloadNear(tile, this.removeItem(other, entity.sortItem));
                    }
                }
            }

            if (entity.items.total() > 0) {
                this.tryDump(tile);
            }
        }
    },
});
