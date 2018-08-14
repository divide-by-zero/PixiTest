let app = new PIXI.Application({ width: 40, height: 40, backgroundColor: 0xDAE8F4 });
app.stage.interactive = true;
document.getElementById("view").appendChild(app.view);

//MakeAliases
let Application = PIXI.Application,
    Container = PIXI.Container,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Sprite = PIXI.Sprite,
    Rectangle = PIXI.Rectangle;

var blockContainer = new PIXI.Container();
app.stage.addChild(blockContainer);

var uiContainer = new PIXI.Container();
app.stage.addChild(uiContainer);

//block obj
function BlockObj() {
    this.mode = 0;
    this.sprite = null;

    this.shakeTime = 0;

    this.update = function (delta) {
        if (this.shakeTime > 0) {
            this.shakeTime -= delta * 0.01;
            this.sprite.rotation += 0.1 * delta;

            if (this.shakeTime <= 0) {
                this.shakeTime = 0;
                this.sprite.rotation = 0;
                this.sprite.visible = false;
            }
        } 
    }

    this.click = function() {
        this.shakeTime = 1;
    }
}

const blocks = [];
const blockSize = 20;

let urlParams = new URLSearchParams(window.location.search);
let imageUrl = "https://pbs.twimg.com/profile_images/1621590384/nattu_1_400x400.jpg";
if (urlParams.has("image")) {
    imageUrl = urlParams.get("image");
}

PIXI.loader.add("block", "image/block.png").add("ball", "image/ball.png")
    .add("base", imageUrl).load(() => {
        let textures = [
            TextureCache["image/block.png"], TextureCache["image/ball.png"]
        ]; //エイリアスを使ったTextureCache(正確には PIXI.utils.TextureCache)版
        let textures2 =
            [
                PIXI.loader.resources["block"].texture, PIXI.loader.resources["ball"].texture
            ]; //そもそも、名前付きロード(PIXI.loader.add(～～))を使っているので、PIXI.loader.resourcesを使った版

        let bgSprite = new PIXI.Sprite(PIXI.loader.resources["base"].texture);
        var mosaicWidth = Math.ceil(bgSprite.width / blockSize);
        var mosaicHeight = Math.ceil(bgSprite.height / blockSize);

        app.renderer.resize(mosaicWidth * blockSize, mosaicHeight * blockSize);

        var modW = (app.screen.width - bgSprite.width) / 2;
        var modH = (app.screen.height - bgSprite.height) / 2;

        bgSprite.x = modW;
        bgSprite.y = modH;

        //背景画像をPixel化
        var data = app.renderer.extract.pixels(bgSprite);

        blockContainer.addChild(bgSprite);

        for (let y = 0; y < mosaicHeight; y++) {
            for (let x = 0; x < mosaicWidth; x++) {
                let rgba = { r: 0, g: 0, b: 0, a: 0 };
                for (let yp = 0; yp < blockSize; yp++) {
                    for (let xp = 0; xp < blockSize; xp++) {
                        let ty = (y * blockSize + yp) - modW;
                        let tx = (x * blockSize + xp) - modH;
                        if (ty < 0 || ty >= bgSprite.height || tx < 0 || tx >= bgSprite.width) {
                            rgba.r += 255;
                            rgba.g += 255;
                            rgba.b += 255;
                            continue;
                        }
                        rgba.r += data[(ty * bgSprite.width + tx) * 4 + 0];
                        rgba.g += data[(ty * bgSprite.width + tx) * 4 + 1];
                        rgba.b += data[(ty * bgSprite.width + tx) * 4 + 2];
                        rgba.a += data[(ty * bgSprite.width + tx) * 4 + 3];
                    }
                }

                rgba.r /= (blockSize * blockSize);
                rgba.g /= (blockSize * blockSize);
                rgba.b /= (blockSize * blockSize);
                rgba.a /= (blockSize * blockSize);

                if (rgba.a > 0) {
                    rgba.a = 255;
                }

                let blockSprite = new PIXI.Sprite(textures2[0]);

                blockSprite.width = blockSize;
                blockSprite.height = blockSize;
                blockSprite.x = x * blockSize + blockSize / 2;
                blockSprite.y = y * blockSize + blockSize / 2;
                blockSprite.anchor.set(0.5);
                blockSprite.tint = (Math.floor(rgba.r) << 16) + (Math.floor(rgba.g) << 8) + Math.floor(rgba.b);
                blockSprite.alpha = Math.floor(rgba.a);

                let blockObj = new BlockObj();
                blockObj.sprite = blockSprite;

                blocks.push(blockObj);
                blockSprite.interactive = true;

                blockSprite.on("mousedown", () => blockObj.click());
                blockSprite.on("touchstart", () => blockObj.click());

                blockContainer.addChild(blockSprite);
            }
        }

        let style = new PIXI.TextStyle({
            fontFamily: "Arial",
            fontSize: 36,
            fill: "white",
            stroke: '#ff3300',
            strokeThickness: 4,
            dropShadow: true,
            dropShadowColor: "#000000",
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6,
        });

        let message = new PIXI.Text("BlockBreaker", style);
        uiContainer.addChild(message);

        app.ticker.add(delta => {
            for (let index = 0; index < blocks.length; index++) {
                const block = blocks[index];
                block.update(delta);
            }
        });
    });

Array.prototype.randomAt = function () {
    return this[parseInt(Math.random() * this.length)];
};

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}