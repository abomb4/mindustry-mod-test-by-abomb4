
const lib = require('abomb4/lib');

const multiLiquidTankEntity = prov(() => {

    const e = extendContent(LiquidSource.LiquidSourceEntity, {

    });

    return e;
});
const multiLiquidTank = (() => {

    const b = extendContent(LiquidRouter, "multi-liquid-tank", {

        load() {
            this.super$load();
            entityType = multiLiquidTankEntity;
        },
    });
    return b;
})();
