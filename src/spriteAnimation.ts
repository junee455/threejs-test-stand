import { sleep } from "./utils";

const spriteDist = "sprites/waveSprite";

const framesList =
  "Icon0000.png,Icon0002.png,Icon0004.png,Icon0006.png,Icon0008.png,Icon0010.png,Icon0012.png,Icon0014.png,Icon0016.png,Icon0018.png,Icon0020.png,Icon0022.png,Icon0024.png,Icon0026.png,Icon0028.png,Icon0030.png,Icon0032.png,Icon0034.png,Icon0036.png,Icon0038.png,Icon0040.png,Icon0042.png,Icon0044.png,Icon0046.png,Icon0048.png,Icon0050.png,Icon0052.png,Icon0054.png,Icon0056.png,Icon0058.png,Icon0060.png,Icon0062.png,Icon0064.png,Icon0066.png,Icon0068.png,Icon0070.png,Icon0072.png,Icon0074.png,Icon0076.png,Icon0078.png,Icon0080.png,Icon0082.png,Icon0084.png,Icon0086.png,Icon0088.png,Icon0090.png,Icon0092.png,Icon0094.png,Icon0096.png,Icon0098.png,Icon0100.png,Icon0102.png,Icon0104.png,Icon0106.png,Icon0108.png,Icon0110.png,Icon0112.png,Icon0114.png,Icon0116.png,Icon0118.png,Icon0120.png,Icon0122.png,Icon0124.png,Icon0126.png,Icon0128.png,Icon0130.png,Icon0132.png,Icon0134.png,Icon0136.png,Icon0138.png,Icon0140.png,Icon0142.png,Icon0144.png,Icon0146.png,Icon0148.png,Icon0150.png,Icon0152.png,Icon0154.png,Icon0156.png,Icon0158.png,Icon0160.png".split(
    ",",
  );

const images = new Array(framesList.length).fill(null);

framesList.forEach((fileName, i) => {
  fetch(`${spriteDist}/${fileName}`)
    .then((res) => {
      if (res.ok) {
        return res.blob();
      }
    })
    .then((blob) => {
      const imageEl = document.createElement("img");
      imageEl.setAttribute("src", URL.createObjectURL(blob));
      images[i] = imageEl;
    });
});

export async function playAnimation() {
  const animElement = document.getElementById("spriteAnimation");

  let currentIndex = 0;
  for (;;) {
    currentIndex = (currentIndex + 1) % framesList.length;
    if (animElement.children.length) {
      animElement.removeChild(animElement.children.item(0));
    }

    if (images[currentIndex]) {
      animElement.appendChild(images[currentIndex]);
    }
    await sleep(10);
  }
}
