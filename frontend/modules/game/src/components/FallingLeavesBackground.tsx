import { useEffect, useRef } from "react";

const LEAF_TEXTURES = [
  "/leaves1.png",
  "/leaves2.png",
  "/leaves3.png",
  "/leaves4.png",
] as const;

type LeafState = {
  texture: HTMLImageElement;
  baseX: number;
  x: number;
  y: number;
  width: number;
  height: number;
  verticalSpeed: number;
  horizontalDrift: number;
  swayAmplitude: number;
  swayFrequency: number;
  swayPhase: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  blur: number;
  windWeight: number;
  depth: number;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickRandom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

function createLeaf(textures: HTMLImageElement[], width: number, height: number, spawnInView: boolean): LeafState {
  const texture = pickRandom(textures);
  const depth = Math.random();
  const targetWidth = randomBetween(10, 18) + depth * 14;
  const aspectRatio = texture.height / texture.width;
  const spawnY = spawnInView
    ? randomBetween(-height * 0.1, height * 1.05)
    : -targetWidth - randomBetween(12, height * 0.2);

  return {
    texture,
    baseX: randomBetween(-width * 0.08, width * 1.08),
    x: 0,
    y: spawnY,
    width: targetWidth,
    height: targetWidth * aspectRatio,
    verticalSpeed: randomBetween(16, 28) + depth * 18,
    horizontalDrift: randomBetween(-5, 5),
    swayAmplitude: randomBetween(5, 14) + depth * 10,
    swayFrequency: randomBetween(0.45, 0.95) + depth * 0.25,
    swayPhase: randomBetween(0, Math.PI * 2),
    rotation: randomBetween(0, Math.PI * 2),
    rotationSpeed: randomBetween(-0.38, 0.38),
    opacity: randomBetween(0.18, 0.34) + depth * 0.28,
    blur: (1 - depth) * randomBetween(0.2, 1.4),
    windWeight: randomBetween(0.3, 0.85) + depth * 0.35,
    depth,
  };
}

export function FallingLeavesBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animationFrameId = 0;
    let lastTimestamp = 0;
    let elapsedSeconds = 0;
    let destroyed = false;
    let leaves: LeafState[] = [];
    let textures: HTMLImageElement[] = [];

    const updateCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!textures.length) {
        return;
      }

      const targetCount = Math.max(10, Math.min(22, Math.round((width * height) / 85000)));

      if (leaves.length < targetCount) {
        while (leaves.length < targetCount) {
          leaves.push(createLeaf(textures, width, height, true));
        }
      } else if (leaves.length > targetCount) {
        leaves = leaves.slice(0, targetCount);
      }
    };

    const getWind = () => {
      const primary = Math.sin(elapsedSeconds * 0.22) * 7;
      const secondary = Math.sin(elapsedSeconds * 0.58 + 1.4) * 3;
      return primary + secondary;
    };

    const animate = (timestamp: number) => {
      if (destroyed) return;

      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.033);
      lastTimestamp = timestamp;
      elapsedSeconds += deltaSeconds;

      context.clearRect(0, 0, width, height);

      const wind = getWind();
      leaves.sort((left, right) => left.depth - right.depth);

      for (const leaf of leaves) {
        leaf.y += leaf.verticalSpeed * deltaSeconds;
        leaf.baseX += (leaf.horizontalDrift + wind * 0.12) * deltaSeconds;
        leaf.swayPhase += leaf.swayFrequency * deltaSeconds;
        leaf.rotation += leaf.rotationSpeed * deltaSeconds;

        const mainSway = Math.sin(leaf.swayPhase) * leaf.swayAmplitude;
        const microSway = Math.sin(leaf.swayPhase * 0.42 + leaf.depth * 5) * (leaf.swayAmplitude * 0.35);
        leaf.x = leaf.baseX + mainSway + microSway + wind * leaf.windWeight;

        if (
          leaf.y > height + leaf.height * 1.4 ||
          leaf.x < -leaf.width * 2 ||
          leaf.x > width + leaf.width * 2
        ) {
          Object.assign(leaf, createLeaf(textures, width, height, false));
        }

        context.save();
        context.globalAlpha = Math.min(leaf.opacity, 0.8);
        context.filter = leaf.blur > 0.1 ? `blur(${leaf.blur.toFixed(2)}px)` : "none";
        context.translate(leaf.x, leaf.y);
        context.rotate(leaf.rotation + Math.sin(leaf.swayPhase * 0.7) * 0.18);
        context.drawImage(
          leaf.texture,
          -leaf.width * 0.5,
          -leaf.height * 0.5,
          leaf.width,
          leaf.height,
        );
        context.restore();
      }

      animationFrameId = window.requestAnimationFrame(animate);
    };

    updateCanvasSize();

    Promise.all(LEAF_TEXTURES.map((src) => loadImage(src)))
      .then((loadedTextures) => {
        if (destroyed) return;
        textures = loadedTextures;
        leaves = [];
        updateCanvasSize();
        animationFrameId = window.requestAnimationFrame(animate);
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    window.addEventListener("resize", updateCanvasSize);

    return () => {
      destroyed = true;
      window.removeEventListener("resize", updateCanvasSize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.9,
      }}
    />
  );
}
