//this is NOT the complete definition for this block! see content/blocks/scatter-silo.hjson for the stats and other properties.

//create a simple shockwave effect
const siloLaunchEffect = newEffect(20, e => {
    Draw.color(Color.white, Color.lightGray, e.fin()); //color goes from white to light gray
    Lines.stroke(e.fout() * 3); //line thickness goes from 3 to 0
    Lines.circle(e.x, e.y, e.fin() * 100); //draw a circle whose radius goes from 0 to 100
});

//create the block type
const silo = extendContent(Block, "scatter-silo", {
    //override the method to build configuration
    buildConfiguration(tile, table) {
        table.addImageButton(Icon.upOpen, Styles.clearTransi, run(() => {
            //configure the tile to signal that it has been pressed (this sync on client to server)
            tile.configure(0)
        })).size(50)
        // .disabled(boolf(b => tile.entity != null && !tile.entity.cons.valid()))
    },

    //override configure event
    configured(tile, value) {
        // Eval thing, any one can call next wave
        if (Vars.net.client()) {
            Call.onAdminRequest(Vars.player, Packages.mindustry.net.Packets.AdminAction.wave);
        } else {
            state.wavetime = 0;
        }
    }
})
